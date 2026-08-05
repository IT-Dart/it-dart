-- Verfolgt die Kosten von Supabase Preview-Branches (E2E-Testläufe) --
-- diese Branches laufen komplett außerhalb jeder im Fixkosten-Register
-- (recurring_costs) erfassten Abo-Summe, da sie variabel und kurzlebig
-- sind statt eines festen monatlichen Betrags. Ergänzt dieses Register,
-- ersetzt es nicht.
--
-- Bewusst KEIN Poll gegen die Supabase-Management-API (ursprünglicher
-- Entwurf, 2026-08-05 verworfen): ein Management-API-Personal-Access-Token
-- ist laut Supabase-Doku ein Konto-weiter Vollzugriffs-Schlüssel ohne
-- Scopes und ohne eingebautes Ablaufdatum -- für dieses reine
-- Kosten-Dashboard ein unverhältnismäßiges Risiko (Nutzer-Einwand,
-- zu Recht). Stattdessen meldet .github/workflows/e2e-tests.yml Start/Ende
-- jedes Branches direkt an die branch-cost-sync Edge Function (Push statt
-- Poll, gleiches Shared-Secret-Muster wie e2e-report-ingest). Ad-hoc-
-- Debug-Branches, die über die Supabase-MCP-Verbindung entstehen, werden
-- damit NICHT automatisch erfasst -- bewusst in Kauf genommene Lücke,
-- geringeres Risiko als ein Management-API-Token für diesen Zweck.
create table if not exists public.branch_cost_log (
  id bigint generated always as identity primary key,
  branch_id text not null,
  branch_name text not null,
  status text not null default 'active' check (status in ('active', 'closed')),
  started_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists branch_cost_log_active_branch_idx
  on public.branch_cost_log (branch_id)
  where status = 'active';

alter table public.branch_cost_log enable row level security;

create policy "Admins can read branch cost log"
on public.branch_cost_log for select
to authenticated
using (is_admin_user());
-- Bewusst keine INSERT/UPDATE/DELETE-Policy für Nutzer -- ausschließlich die
-- branch-cost-sync Edge Function (Service-Role, umgeht RLS) schreibt hier.

create or replace function public.branch_hourly_rate_usd()
returns numeric
language sql
immutable
as $$ select 0.01344::numeric $$;

create or replace function public.get_branch_cost_summary()
returns table(
  active_branches jsonb,
  today_cost_usd numeric,
  month_cost_usd numeric,
  last_synced_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin_user() then
    raise exception 'Nur für Admins.';
  end if;

  return query
  select
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'branch_name', b.branch_name,
        'started_at', b.started_at,
        'minutes_running', round(extract(epoch from (now() - b.started_at)) / 60),
        'cost_so_far_usd', round(extract(epoch from (now() - b.started_at)) / 3600 * branch_hourly_rate_usd(), 4)
      ) order by b.started_at)
      from public.branch_cost_log b
      where b.status = 'active'
    ), '[]'::jsonb) as active_branches,
    coalesce((
      select sum(extract(epoch from (coalesce(b.ended_at, now()) - b.started_at)) / 3600 * branch_hourly_rate_usd())
      from public.branch_cost_log b
      where b.started_at::date = now()::date
    ), 0)::numeric as today_cost_usd,
    coalesce((
      select sum(extract(epoch from (coalesce(b.ended_at, now()) - b.started_at)) / 3600 * branch_hourly_rate_usd())
      from public.branch_cost_log b
      where date_trunc('month', b.started_at) = date_trunc('month', now())
    ), 0)::numeric as month_cost_usd,
    (select max(b.last_seen_at) from public.branch_cost_log b) as last_synced_at;
end;
$$;

revoke all on function public.get_branch_cost_summary() from public;
grant execute on function public.get_branch_cost_summary() to authenticated;

-- Sicherheitsnetz statt Live-Erkennung: schließt Zeilen, die (z. B. durch
-- einen abgestürzten CI-Runner vor dem "Sandbox-Branch löschen"-Schritt)
-- fälschlich für immer "active" blieben. 3 Stunden liegt deutlich über der
-- üblichen E2E-Laufzeit (~5-10 Minuten), um keinen legitim noch laufenden
-- Branch fälschlich zu schließen. Reine SQL-Operation auf der eigenen
-- Tabelle -- kein externer API-Aufruf, kein pg_net, kein Secret nötig.
select cron.schedule(
  'branch-cost-safety-net',
  '*/15 * * * *',
  $$
  update public.branch_cost_log
  set status = 'closed', ended_at = now()
  where status = 'active' and started_at < now() - interval '3 hours';
  $$
);

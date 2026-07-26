-- Minimal, scoped-down version of the "full BI/CBA platform" idea: a
-- registry of IT-Dart-ecosystem projects (this app + generated clones) with
-- their fixed costs, plus a cost overview that links in the ai_usage
-- variable-cost data already built. Deliberately NOT: ROI/CLV/break-even
-- formulas, scenario simulation, an AI recommendation engine, or
-- cross-project automated aggregation — those need real revenue/usage data
-- across multiple live tools first, which doesn't exist yet. Extend this
-- table with more fields/KPIs once there is something real to compute.
--
-- Admin-only (not Junior-Admin): unlike ai_usage's aggregate cost summary,
-- this table holds raw business planning data (fixed dev/design/license
-- costs per project) — a more sensitive data domain than usage counts.
create table if not exists public.tools (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  category text,
  status text not null default 'idea' check (status in ('idea', 'development', 'beta', 'live')),
  owner text,
  launch_date date,
  fixed_dev_cost_usd numeric(12, 2) not null default 0,
  fixed_design_cost_usd numeric(12, 2) not null default 0,
  fixed_asset_cost_usd numeric(12, 2) not null default 0,
  fixed_license_cost_usd numeric(12, 2) not null default 0,
  fixed_other_cost_usd numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tools enable row level security;

create policy "Admins can manage tools"
  on public.tools for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

create or replace function public.set_tools_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tools_set_updated_at on public.tools;
create trigger tools_set_updated_at
  before update on public.tools
  for each row execute function public.set_tools_updated_at();

-- Seed the two real projects that exist today. No cost figures guessed —
-- fixed costs default to 0 until an admin fills in real numbers.
insert into public.tools (slug, name, description, category, status, owner)
values
  ('it-dart', 'IT-Dart', 'Haupt-Lernplattform für die FISI-Ausbildung.', 'Lernplattform', 'live', 'Coskun Bulut'),
  ('it-dart-troubleshooter', 'IT-Dart-Troubleshooter', 'Erstes über IT-Dart-Generator erzeugtes, eigenständiges Lerntool.', 'Lernplattform', 'beta', 'Coskun Bulut')
on conflict (slug) do nothing;

-- Cost overview: fixed costs from this table, plus variable AI-chat cost
-- for the 'it-dart' row only (its ai_usage IS this project's own AI cost —
-- other tools run in separate Supabase projects, no automated cross-project
-- aggregation by design, see CLAUDE.md "kein Feedback-Loop").
create or replace function public.get_tool_cost_overview()
returns table(
  slug text,
  name text,
  status text,
  fixed_cost_usd numeric,
  variable_ai_cost_usd numeric,
  total_cost_usd numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Nur für Admins.';
  end if;
  return query
    select
      t.slug,
      t.name,
      t.status,
      (t.fixed_dev_cost_usd + t.fixed_design_cost_usd + t.fixed_asset_cost_usd
        + t.fixed_license_cost_usd + t.fixed_other_cost_usd)::numeric as fixed_cost_usd,
      case when t.slug = 'it-dart'
        then coalesce((select sum(u.cost_usd) from public.ai_usage u), 0)
        else 0
      end::numeric as variable_ai_cost_usd,
      ((t.fixed_dev_cost_usd + t.fixed_design_cost_usd + t.fixed_asset_cost_usd
        + t.fixed_license_cost_usd + t.fixed_other_cost_usd)
        + case when t.slug = 'it-dart'
            then coalesce((select sum(u.cost_usd) from public.ai_usage u), 0)
            else 0
          end)::numeric as total_cost_usd
    from public.tools t
    order by t.name;
end;
$$;

revoke all on function public.get_tool_cost_overview() from public;
grant execute on function public.get_tool_cost_overview() to authenticated;

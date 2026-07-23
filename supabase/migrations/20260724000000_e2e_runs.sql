-- Speichert Läufe der End-to-End-Testsuite (siehe .github/workflows/e2e-tests.yml
-- und supabase/functions/e2e-trigger-run, e2e-report-ingest). Ein Lauf wird von
-- e2e-trigger-run als 'queued' angelegt und von e2e-report-ingest nach Abschluss
-- des GitHub-Actions-Laufs mit dem strukturierten Ergebnis aktualisiert.
create table if not exists public.e2e_runs (
  id bigint generated always as identity primary key,
  status text not null default 'queued' check (status in ('queued','running','success','failure','error')),
  suite text not null,
  triggered_by uuid references auth.users(id) on delete set null,
  gh_run_id bigint,
  gh_workflow_url text,
  report jsonb,
  error_text text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.e2e_runs enable row level security;

-- Nur volle Admins sehen Testläufe (bewusst kein is_junior_admin_user() —
-- das Auslösen echter Testläufe gegen die Produktivdatenbank mit echten
-- Testkonten ist sensibler als das bisher dokumentierte Junior-Admin-Profil).
drop policy if exists "Admins can read e2e runs" on public.e2e_runs;
create policy "Admins can read e2e runs"
  on public.e2e_runs for select
  using (public.is_admin_user());

-- Bewusst keine INSERT/UPDATE/DELETE-Policy für Clients — beide Schreibpfade
-- (Testlauf anlegen, Ergebnis eintragen) laufen ausschließlich über die
-- Edge Functions e2e-trigger-run/e2e-report-ingest mit dem Service-Role-Key,
-- exakt wie beim bestehenden Muster von ai_usage/progress.

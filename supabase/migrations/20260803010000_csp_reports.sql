-- CSP-Verstoßmeldungen (Content-Security-Policy Reporting). Browser senden
-- automatisch einen Bericht hierher, wenn eine Ressource durch die CSP
-- blockiert wurde (z. B. eine kompromittierte/fremde Skriptquelle) -- bisher
-- landete das nur unsichtbar in der Konsole des jeweiligen Nutzers. Insert
-- ausschließlich über die csp-report Edge Function (Service-Role, umgeht
-- RLS) -- kein Insert-Pfad für normale Nutzer, nur Admin-Lesezugriff.

create table if not exists public.csp_reports (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  document_uri text,
  blocked_uri text,
  violated_directive text,
  effective_directive text,
  source_file text,
  line_number int,
  disposition text,
  raw jsonb
);

alter table public.csp_reports enable row level security;

create policy "Admins can read csp_reports"
  on public.csp_reports for select
  using (public.is_admin_user());

-- Automatisches Aufräumen: nur die letzten 90 Tage vorhalten (verhindert
-- unbegrenztes Anwachsen bei wiederholten/gescripteten Meldungen).
create or replace function public.cleanup_old_csp_reports()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.csp_reports where received_at < now() - interval '90 days';
$$;

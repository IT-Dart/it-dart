-- Audit-Befund M3 (2026-08-06): parent-consent (submit/resend) hatte kein
-- Rate-Limit -- ein angemeldetes Konto konnte in kurzer Zeit beliebig viele
-- Bestaetigungs-Mails an eine (ggf. fremde) Eltern-E-Mail-Adresse ausloesen
-- (Spam-/Belaestigungspotenzial gegen Dritte, zusaetzlich Resend-Kosten).
-- Eigene, schlanke Tabelle statt einer neuen profiles-Spalte, da profiles
-- seit der K2-Migration eine Spalten-Positivliste hat und diese Zaehl-Info
-- ohnehin nie vom Client gelesen werden muss -- nur die parent-consent Edge
-- Function (Service-Role) schreibt/liest hier, RLS bewusst ohne Client-
-- Policies (sperrt anon/authenticated komplett aus).
create table if not exists public.parent_consent_mail_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.parent_consent_mail_log enable row level security;

create index if not exists parent_consent_mail_log_user_sent_idx
  on public.parent_consent_mail_log (user_id, sent_at);

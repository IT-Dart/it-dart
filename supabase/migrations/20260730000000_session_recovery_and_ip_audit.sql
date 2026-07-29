-- Erweiterung der Single-Session-Erzwingung um zwei Punkte:
-- 1. Recovery-Option: Ein erneuter, passwort-verifizierter Login-Versuch darf die
--    alte (vermutlich tote) Sitzung sofort beenden, statt 5 Minuten auf den
--    Herzschlag-Timeout zu warten. Erneute korrekte Passworteingabe ist selbst
--    schon ein starker Nachweis der Berechtigung.
-- 2. IP-Protokollierung fuer Sicherheits-Audit (Art. 6 Abs. 1 lit. f DSGVO,
--    berechtigtes Interesse: Missbrauchserkennung). Zweckgebunden, 7 Tage
--    Aufbewahrung (rollierend geloescht), nur ueber Edge Function befuellbar,
--    nur fuer Admins einsehbar.

create or replace function public.claim_session(new_session_id uuid, stale_after_minutes int default 5, force boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_active uuid;
  current_seen timestamptz;
begin
  if uid is null then
    return false;
  end if;

  select active_session_id, session_last_seen_at into current_active, current_seen
  from public.profiles where id = uid
  for update;

  if not force
     and current_active is not null
     and current_active <> new_session_id
     and current_seen is not null
     and current_seen > now() - (stale_after_minutes || ' minutes')::interval
  then
    return false;
  end if;

  update public.profiles
  set active_session_id = new_session_id, session_last_seen_at = now()
  where id = uid;

  return true;
end;
$$;

create table if not exists public.session_audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address inet,
  created_at timestamptz not null default now()
);

alter table public.session_audit_log enable row level security;

create policy "admins can read session audit log" on public.session_audit_log
  for select using (is_admin_user());
-- Bewusst keine Insert/Update/Delete-Policy fuer normale Nutzer -- Schreiben
-- geschieht ausschliesslich ueber die claim-session Edge Function mit dem
-- Service-Role-Key, nie direkt vom Client.

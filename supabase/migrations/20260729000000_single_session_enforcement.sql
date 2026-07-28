-- Nur eine aktive Sitzung pro Konto: ein zweiter Login-Versuch mit
-- denselben Zugangsdaten wird abgelehnt, solange eine andere Sitzung als
-- "aktiv" gilt (Herzschlag alle 2 Minuten, gilt nach 5 Minuten ohne
-- Herzschlag als beendet und gibt das Konto wieder frei -- sonst würde
-- ein abgestürzter/geschlossener Tab ohne sauberes Abmelden das Konto
-- dauerhaft aussperren).

alter table public.profiles
  add column if not exists active_session_id uuid,
  add column if not exists session_last_seen_at timestamptz;

create or replace function public.claim_session(new_session_id uuid, stale_after_minutes int default 5)
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

  if current_active is not null
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

create or replace function public.heartbeat_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set session_last_seen_at = now()
  where id = auth.uid() and active_session_id = session_id;
end;
$$;

create or replace function public.release_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set active_session_id = null, session_last_seen_at = null
  where id = auth.uid() and active_session_id = session_id;
end;
$$;

-- Aktiver Sitzungs-Kick-out (Task #6): eine Uebernahme per claim_session(force
-- => true) aktualisiert bisher nur die DB-Zeile -- das verdraengte Geraet
-- lief unbemerkt weiter, sein naechster Herzschlag traf lediglich 0 Zeilen
-- (WHERE active_session_id = alte_id passt nicht mehr) und heartbeat_session
-- gab das als "void" zurueck, ohne dass der Client das je erfahren hat.
-- heartbeat_session meldet jetzt per Rueckgabewert, ob diese Sitzung noch
-- die aktive ist -- false heisst: anderswo uebernommen, Client soll sich
-- sofort lokal abmelden statt erst beim naechsten Reload zu bemerken.
drop function if exists public.heartbeat_session(uuid);

create function public.heartbeat_session(session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update public.profiles
  set session_last_seen_at = now()
  where id = auth.uid() and active_session_id = session_id;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

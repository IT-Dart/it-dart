-- release_session() nullte bisher auch session_last_seen_at mit -- das war
-- fuer die Single-Session-Sicherheitspruefung nie noetig: claim_session()
-- prueft zuerst "current_active is not null" und laesst dank
-- active_session_id=null sofort einen neuen Login zu, unabhaengig vom Wert
-- von session_last_seen_at. Das Nullen hatte aber den Nebeneffekt, dass ein
-- sauberer Logout die "zuletzt aktiv"-Anzeige (TrainerScreen.jsx) sofort auf
-- "nie" zurueckwarf. session_last_seen_at bleibt jetzt als echter
-- "zuletzt gesehen"-Zeitstempel stehen, nur active_session_id wird noch
-- freigegeben.
create or replace function public.release_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set active_session_id = null
  where id = auth.uid() and active_session_id = session_id;
end;
$$;

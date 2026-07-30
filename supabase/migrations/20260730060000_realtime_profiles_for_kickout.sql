-- Aktiver Sitzungs-Kick-out, Nachschärfung: der 2-Minuten-Herzschlag allein
-- liess ein verdraengtes Geraet bis zu 2 Minuten lang faelschlich weiter als
-- "angemeldet" erscheinen (beobachtet: gleichzeitig in Chrome und Firefox
-- angemeldet, bis der naechste Herzschlag-Tick die Uebernahme bemerkte).
-- profiles zur Realtime-Publikation hinzufuegen, damit eine Uebernahme
-- (aktive_session_id aendert sich) sofort per Postgres-Changes-Event beim
-- verdraengten Geraet ankommt, statt auf das naechste Polling zu warten.
-- RLS ("Users can read own profile", auth.uid() = id) filtert automatisch,
-- sodass jedes Geraet nur Aenderungen an der eigenen Zeile empfaengt.
alter publication supabase_realtime add table public.profiles;

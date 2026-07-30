-- Grundueberholung der Single-Session-Sperre: statt einen zweiten
-- Login-Versuch abzulehnen und dem Nutzer einen "Vorherige Sitzung
-- beenden"-Button anzuzeigen (verwirrend, unprofessionell, und faktisch
-- eine eingebaute Umgehung fuer Konto-Sharing -- zwei Personen konnten sich
-- per Klick gegenseitig einfach durchwechseln), gewinnt ab sofort immer der
-- NEUESTE Login sofort und bedingungslos. Das alte Geraet wird ueber den
-- Realtime-Kanal (siehe 20260730060000) und den Herzschlag-Fallback aktiv
-- abgemeldet -- kein Warten auf eine 5-Minuten-Staleness-Grenze mehr noetig,
-- kein Konflikt-Dialog, kein force-Flag. Wer sich staendig gegenseitig
-- rauswirft, merkt das sofort selbst; ein legitimer Nutzer kommt immer ohne
-- Wartezeit rein.
drop function if exists public.claim_session(uuid, integer, boolean);
drop function if exists public.claim_session(uuid, integer);

create function public.claim_session(new_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  update public.profiles
  set active_session_id = new_session_id, session_last_seen_at = now()
  where id = uid;

  return true;
end;
$$;

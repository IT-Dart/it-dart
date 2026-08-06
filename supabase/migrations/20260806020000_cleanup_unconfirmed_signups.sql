-- Automatische Aufraeumung "schwebender Anmeldungen" (To-Do, 2026-08-06):
-- Konten, die ihre E-Mail-Adresse nie bestaetigt haben, werden nach 48h
-- automatisch geloescht. Bewusst NUR dieser Fall automatisiert -- Konten,
-- die zwar bestaetigt haben, aber bei AGB/Passwort/Geburtsdatum haengen
-- geblieben sind, koennten ein echter, nur langsamer Azubi sein und werden
-- stattdessen ueber einen manuellen Filter in AdminScreen.jsx sichtbar
-- gemacht, nicht automatisch geloescht.
--
-- Hartes Loeschen direkt aus auth.users kaskadiert wie bei
-- admin-delete-user/index.ts automatisch zu profiles/progress/ai_usage/
-- lernnachweisen ueber "on delete cascade".
create or replace function public.cleanup_unconfirmed_signups()
returns void
language plpgsql
as $$
begin
  delete from auth.users
  where confirmed_at is null
    and created_at < now() - interval '48 hours';
end;
$$;

select cron.schedule(
  'cleanup-unconfirmed-signups-daily',
  '0 4 * * *',
  $$select public.cleanup_unconfirmed_signups();$$
);

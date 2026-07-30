-- To-Do #67: Trainee-Onboarding ohne E-Mail. Konten mit synthetischer
-- Platzhalter-E-Mail (kein echtes Postfach) melden sich per Magic-Link an
-- und haben nie selbst ein Passwort gesetzt -- dieses Flag zeigt, dass die
-- Passwort-Einrichtung nach dem ersten Login noch nachgeholt werden muss.
alter table public.profiles add column if not exists needs_password_setup boolean not null default false;

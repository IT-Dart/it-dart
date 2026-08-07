-- Regressions-Fix: die M8-Migration (20260807050000_agb_consent_only_via_rpc.sql)
-- hat handle_new_user() per "create or replace" komplett neu geschrieben und dabei
-- versehentlich username/username_welcome_seen aus dem INSERT entfernt (waren seit
-- 20260805010000_username_field.sql dort). Seit dem M8-Deploy (2026-08-07 ~19:xx)
-- angelegte Konten haben dadurch username=null UND username_welcome_seen=true
-- (Spalten-Default) -- der Willkommens-Screen wird faelschlich uebersprungen UND
-- es existiert gar kein Nutzername. Betroffen: mindestens ein echtes Konto
-- (frank.metzler@bdolegal.de, Testzugang fuer die Anwaltspruefung) sowie ein
-- Test-Konto. Live per Query gefunden, nicht nur vermutet.

-- ---------------------------------------------------------------------------
-- Nutzerhinweis 2026-08-07 (zweiter, unabhaengiger Fund im selben Zug): erste
-- Reaktion nach Klick auf "Konto aktivieren" in der Einladungs-Mail war bisher
-- direkt die Geburtsdatum-Abfrage -- ohne jede Einordnung, was IT-Dart ist,
-- dass KI an vielen Stellen eingesetzt wird, oder dass kostenpflichtige
-- Zusatzpakete existieren. Neue Spalte onboarding_intro_seen: eine einmalige,
-- echte Einfuehrungsseite (OnboardingIntroScreen.jsx) laeuft ab jetzt vor
-- JEDEM anderen Onboarding-Gate (Geburtsdatum/AGB/Passwort/Nutzername).
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists onboarding_intro_seen boolean not null default true;

-- Bestandskonten (Stand vor dieser Migration) haben den Einfuehrungsprozess
-- nie durchlaufen, sollen aber nicht rueckwirkend dazu gezwungen werden --
-- bleiben beim Spalten-Default (true), analog zum username_welcome_seen-Muster.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, agb_consent_given, username, username_welcome_seen, onboarding_intro_seen)
  values (
    new.id, new.email, false,
    public.generate_username(),
    false,
    false
  );
  return new;
end;
$$;

create or replace function public.confirm_onboarding_intro_seen()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set onboarding_intro_seen = true where id = auth.uid();
end;
$$;

grant execute on function public.confirm_onboarding_intro_seen() to authenticated;

-- Die beiden vom Regressions-Fund betroffenen Konten reparieren: Nutzername
-- nachtragen, Willkommens-Screen wieder als "noch nicht gesehen" markieren.
update public.profiles
set username = public.generate_username(), username_welcome_seen = false
where username is null;

-- Spalten-Positivliste (K2, Migration 20260807000000): neue Spalte muss
-- explizit freigegeben werden, sonst "permission denied for column".
grant select (onboarding_intro_seen) on public.profiles to anon, authenticated;
grant update (onboarding_intro_seen) on public.profiles to anon, authenticated;

notify pgrst, 'reload schema';

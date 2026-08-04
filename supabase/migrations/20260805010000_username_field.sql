-- Nutzername als rein optischer, aenderbarer Anzeigename (kein Login-
-- Ersatz -- Login bleibt ausschliesslich E-Mail-basiert, siehe CLAUDE.md).
-- Ziel: Trainer-Ansichten koennen kuenftig den Nutzernamen statt der
-- E-Mail-Adresse zeigen (echter Datenschutz-Gewinn), und Bestandskonten
-- bleiben im maskierten Supabase-Studio identifizierbar.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists username_changed_at timestamptz;
alter table public.profiles add column if not exists username_welcome_seen boolean not null default true;

-- Generiert einen freien Nutzernamen nach dem Muster Adjektiv+Tier+Zahl
-- (z. B. "SchnellerFuchs42") -- bewusst nicht aus E-Mail/echtem Namen
-- abgeleitet, da ein Teil der Nutzer minderjaehrig ist. Retry-Schleife
-- gegen den (sehr unwahrscheinlichen) Kollisionsfall.
create or replace function public.generate_username()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  adjectives text[] := array['Schneller','Kluger','Mutiger','Ruhiger','Heller','Wilder','Freundlicher','Neugieriger','Findiger','Flinker','Tapferer','Cleverer'];
  nouns text[] := array['Fuchs','Adler','Baer','Wolf','Falke','Luchs','Delfin','Panther','Drache','Loewe','Tiger','Phoenix'];
  candidate text;
  attempt int := 0;
begin
  loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
              || nouns[1 + floor(random() * array_length(nouns, 1))::int]
              || (10 + floor(random() * 9990))::text;
    attempt := attempt + 1;
    exit when not exists (select 1 from public.profiles where username = candidate) or attempt > 30;
  end loop;
  return candidate;
end;
$$;

-- Bestandskonten (Stand vor dieser Migration) bekommen ebenfalls einen
-- Nutzernamen, sehen den Willkommens-Screen aber NICHT erneut --
-- username_welcome_seen bleibt beim Spalten-Default (true).
update public.profiles set username = public.generate_username() where username is null;

alter table public.profiles add constraint profiles_username_unique unique (username);

-- handle_new_user generiert ab jetzt automatisch einen Nutzernamen fuer
-- jedes neue Konto (Selbstregistrierung UND Einladung) und markiert den
-- Willkommens-Screen als noch nicht gesehen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, agb_consent_given, username, username_welcome_seen)
  values (
    new.id, new.email,
    coalesce((new.raw_user_meta_data->>'agb_accepted')::boolean, false),
    public.generate_username(),
    false
  );
  return new;
end;
$$;

-- Bestaetigt den Willkommens-Screen, ohne den generierten Namen zu aendern.
create or replace function public.confirm_username_seen()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set username_welcome_seen = true where id = auth.uid();
end;
$$;

grant execute on function public.confirm_username_seen() to authenticated;

-- Eng gefasste Funktion zum Aendern des eigenen Nutzernamens -- profiles
-- hat bewusst keine generelle Selbst-Update-Policy (siehe init-Migration).
-- Validierung: Laenge, erlaubte Zeichen, Sperrliste gegen Impersonation,
-- 30-Tage-Cooldown zwischen Aenderungen (die allererste manuelle Aenderung
-- ist davon ausgenommen -- username_changed_at ist dann noch null).
create or replace function public.set_username(new_username text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  reserved text[] := array['admin','administrator','support','moderator','mod','itdart','it-dart','system','root','trainer'];
  last_change timestamptz;
begin
  if new_username is null or length(new_username) < 3 or length(new_username) > 20 then
    raise exception 'Nutzername muss zwischen 3 und 20 Zeichen lang sein.';
  end if;
  if new_username !~ '^[A-Za-z0-9_]+$' then
    raise exception 'Nutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten.';
  end if;
  if lower(new_username) = any(reserved) then
    raise exception 'Dieser Nutzername ist reserviert.';
  end if;
  if exists (select 1 from public.profiles where lower(username) = lower(new_username) and id <> auth.uid()) then
    raise exception 'Dieser Nutzername ist bereits vergeben.';
  end if;

  select username_changed_at into last_change from public.profiles where id = auth.uid();
  if last_change is not null and last_change > now() - interval '30 days' then
    raise exception 'Der Nutzername kann erst wieder am % geändert werden.', to_char(last_change + interval '30 days', 'DD.MM.YYYY');
  end if;

  update public.profiles
  set username = new_username, username_changed_at = now(), username_welcome_seen = true
  where id = auth.uid();
end;
$$;

grant execute on function public.set_username(text) to authenticated;

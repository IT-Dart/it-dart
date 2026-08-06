-- Fund 2026-08-07: generate_username() konnte Namen bis 23 Zeichen erzeugen
-- (z. B. "Freundlicher"+"Panther"+"9999" = 12+7+4), waehrend set_username()
-- maximal 20 Zeichen erlaubt (gleiche Grenze wie das Frontend-Input-Feld,
-- UsernameScreen.jsx maxLength={20}). Klickte ein Nutzer mit einem zu langen
-- generierten Namen auf "Speichern", ohne den Text zu aendern, schlug die
-- Validierung fehl -- obwohl exakt dieser Name bereits als eigener
-- Nutzername gespeichert war (der INSERT in handle_new_user() validiert
-- nicht gegen dieselbe Regel wie set_username()). Retry-Schleife bricht ab,
-- wenn der Kandidat >20 Zeichen hat, statt ihn zu akzeptieren.
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
    exit when (length(candidate) <= 20 and not exists (select 1 from public.profiles where username = candidate)) or attempt > 30;
  end loop;
  return candidate;
end;
$$;

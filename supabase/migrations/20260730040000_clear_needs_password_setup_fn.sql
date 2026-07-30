-- To-Do #67: profiles hat keine generelle UPDATE-Policy fuer authenticated
-- (siehe 20260719000000_init.sql). Ein Nutzer darf sein eigenes
-- needs_password_setup-Flag nur ueber diese eng gefasste Funktion loeschen,
-- nachdem er erfolgreich ein eigenes Passwort gesetzt hat -- kein generelles
-- Schreibrecht auf die eigene Zeile.
create or replace function public.clear_needs_password_setup()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set needs_password_setup = false where id = auth.uid();
end;
$$;

grant execute on function public.clear_needs_password_setup() to authenticated;

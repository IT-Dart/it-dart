-- Mirrors auth.users.email_confirmed_at into profiles, so the Admin
-- screen can tell an invited-but-not-yet-accepted account apart from a
-- real active one (the account can't be used to log in either way until
-- confirmed — this is purely about not showing pending invites as if
-- they were already active members).
alter table public.profiles add column if not exists confirmed_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, confirmed_at)
  values (new.id, new.email, new.email_confirmed_at);
  return new;
end;
$$;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.profiles set confirmed_at = new.email_confirmed_at where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute procedure public.handle_user_confirmed();

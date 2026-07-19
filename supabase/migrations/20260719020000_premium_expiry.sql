-- Replaces the plain is_premium boolean with an expiry timestamp, so
-- premium access can be granted for a limited time (e.g. 1 month) instead
-- of being permanent until manually revoked.
alter table public.profiles add column if not exists premium_until timestamptz;

-- One-time migration of existing is_premium=true rows, then drop the old
-- column. Wrapped so this file stays safe to run more than once.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_premium'
  ) then
    update public.profiles
      set premium_until = now() + interval '100 years'
      where is_premium = true and premium_until is null;
    alter table public.profiles drop column is_premium;
  end if;
end $$;

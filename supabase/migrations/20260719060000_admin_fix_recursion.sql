-- Fixes "infinite recursion detected in policy for relation profiles".
-- The previous admin policies checked admin status via a raw subquery on
-- profiles itself, which re-triggers RLS evaluation on every nested call.
-- A SECURITY DEFINER function bypasses RLS internally, breaking the loop.
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin_user());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

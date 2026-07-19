-- Adds an admin flag and lets admins manage every profile (premium status)
-- directly from the client, via RLS — no extra Edge Function needed.
-- Only YOU should ever have is_admin = true (set that separately by hand,
-- this migration never grants it automatically).
alter table public.profiles add column if not exists is_admin boolean not null default false;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

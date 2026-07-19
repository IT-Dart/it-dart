-- Stores each user's learning progress (which topics they've seen per
-- module) so it survives reloads and works across devices.
-- Deliberately a separate table from profiles: users are allowed to write
-- their own rows here, which must never be true for profiles (that would
-- let a user grant themselves premium).
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

drop policy if exists "Users can read own progress" on public.progress;
create policy "Users can read own progress"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.progress;
create policy "Users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.progress;
create policy "Users can update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

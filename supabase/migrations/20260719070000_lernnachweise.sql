-- Logs every generated Lernnachweis (learning proof PDF), so we know when
-- and for what a user downloaded one. The PDF itself is generated entirely
-- client-side (jsPDF) — this table is only the audit trail.
create table if not exists public.lernnachweise (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('modul','pruefung')),
  title text not null,
  score int not null,
  total int not null,
  percent int not null,
  badge text,
  created_at timestamptz not null default now()
);

alter table public.lernnachweise enable row level security;

drop policy if exists "Users can insert own Lernnachweise" on public.lernnachweise;
create policy "Users can insert own Lernnachweise"
  on public.lernnachweise for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own Lernnachweise" on public.lernnachweise;
create policy "Users can read own Lernnachweise"
  on public.lernnachweise for select
  using (auth.uid() = user_id);

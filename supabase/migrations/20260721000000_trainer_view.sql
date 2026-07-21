-- Lets an admin flag an account as a trainer (Ausbilder) and assign
-- trainees to them, so the trainer can read those trainees' Lernnachweis
-- history (started_at/finished_at/score/topics) without full admin rights.
alter table public.profiles add column if not exists is_trainer boolean not null default false;

create table if not exists public.trainer_trainees (
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  trainee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trainer_id, trainee_id)
);

alter table public.trainer_trainees enable row level security;

drop policy if exists "Trainers can read their own assignments" on public.trainer_trainees;
create policy "Trainers can read their own assignments"
  on public.trainer_trainees for select
  using (auth.uid() = trainer_id);

drop policy if exists "Admins can manage trainer assignments" on public.trainer_trainees;
create policy "Admins can manage trainer assignments"
  on public.trainer_trainees for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Trainers may read the Lernnachweise and basic profile (for the email,
-- to identify who's who) of the trainees assigned to them.
drop policy if exists "Trainers can read their trainees' Lernnachweise" on public.lernnachweise;
create policy "Trainers can read their trainees' Lernnachweise"
  on public.lernnachweise for select
  using (
    exists (
      select 1 from public.trainer_trainees tt
      where tt.trainer_id = auth.uid() and tt.trainee_id = lernnachweise.user_id
    )
  );

drop policy if exists "Trainers can read their trainees' profile" on public.profiles;
create policy "Trainers can read their trainees' profile"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trainer_trainees tt
      where tt.trainer_id = auth.uid() and tt.trainee_id = profiles.id
    )
  );

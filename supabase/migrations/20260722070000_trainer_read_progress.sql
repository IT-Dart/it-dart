-- Lets a trainer read their own trainees' module progress (which topics
-- they've seen per module), mirroring the existing trainer-read policies on
-- lernnachweise/profiles — needed so "Meine Statistik" can show a module
-- progress overview when a trainer views a trainee, not just their own view.
drop policy if exists "Trainers can read their trainees' progress" on public.progress;
create policy "Trainers can read their trainees' progress"
  on public.progress for select
  using (
    exists (
      select 1 from public.trainer_trainees tt
      where tt.trainer_id = auth.uid() and tt.trainee_id = progress.user_id
    )
  );

-- Lets a trainer unassign one of their own (already active) trainees
-- directly from the client, without going through an admin or an edge
-- function. Adding a trainee is deliberately NOT opened up the same way —
-- that only ever happens via the invite-user edge function (new accounts,
-- auto-assigned at creation) or through the admin. A trainer can never
-- attach an existing arbitrary user to themselves.
drop policy if exists "Trainers can unassign their own trainees" on public.trainer_trainees;
create policy "Trainers can unassign their own trainees"
  on public.trainer_trainees for delete
  using (auth.uid() = trainer_id);

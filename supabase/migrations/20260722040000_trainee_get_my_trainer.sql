-- Lets a plain trainee discover their own assigned trainer's email (for the
-- Hilfe-Bereich: "wende dich an deinen Trainer"), without opening a blanket
-- RLS read on trainer_trainees or profiles for trainees. Today no policy on
-- trainer_trainees checks trainee_id = auth.uid() at all, and no policy lets
-- a trainee read any profile but their own — so without this, a trainee has
-- no way to find out who their trainer is. Mirrors the narrow-RPC pattern
-- used for the Junior-Admin role: exactly one derived fact, nothing broader.
create or replace function public.get_my_trainer()
returns table(trainer_id uuid, trainer_email text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.email
  from trainer_trainees tt
  join profiles p on p.id = tt.trainer_id
  where tt.trainee_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_trainer() from public;
grant execute on function public.get_my_trainer() to authenticated;

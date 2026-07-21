-- Per-trainer capacity limit for trainer_trainees assignments. Enforced as
-- a DB trigger (not just in the UI) so a direct API call can't bypass it —
-- the trigger is the authoritative guard, the frontend check is just for a
-- fast, friendly response before round-tripping to the database.
alter table public.profiles add column if not exists trainee_limit integer not null default 5;

create or replace function public.enforce_trainee_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  current_count integer;
  max_allowed integer;
begin
  select count(*) into current_count from public.trainer_trainees where trainer_id = new.trainer_id;
  select trainee_limit into max_allowed from public.profiles where id = new.trainer_id;
  max_allowed := coalesce(max_allowed, 5);
  if current_count >= max_allowed then
    raise exception 'Maximale Anzahl an Trainees erreicht (%/%). Bitte wende dich an den Administrator, um dein Kontingent zu erweitern.', current_count, max_allowed;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_trainee_limit on public.trainer_trainees;
create trigger trg_enforce_trainee_limit
  before insert on public.trainer_trainees
  for each row execute procedure public.enforce_trainee_limit();

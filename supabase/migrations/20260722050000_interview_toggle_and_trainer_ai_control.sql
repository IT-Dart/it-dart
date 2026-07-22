-- Two additions:
-- 1) A separate "interview_enabled" flag so the Mock-Interview can be
--    switched off independently of the regular KI-Chat (ai_enabled).
-- 2) Trainers gain the ability to manage both flags for their OWN assigned
--    trainees — previously only Admin/Junior-Admin could do this. Both
--    set_* functions now share one narrow permission check instead of
--    duplicating the admin/junior-admin/trainer logic in each function.
alter table public.profiles add column if not exists interview_enabled boolean not null default true;

create or replace function public.can_manage_ai_settings_for(target_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_admin_user()
    or (public.is_junior_admin_user() and not public.is_protected_account(target_id))
    or exists (
      select 1 from public.trainer_trainees
      where trainer_id = auth.uid() and trainee_id = target_id
    );
$$;

create or replace function public.set_ai_enabled(target_id uuid, enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_ai_settings_for(target_id) then
    raise exception 'Keine Berechtigung für dieses Konto.';
  end if;
  update public.profiles set ai_enabled = enabled where id = target_id;
end;
$$;

create or replace function public.set_interview_enabled(target_id uuid, enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_ai_settings_for(target_id) then
    raise exception 'Keine Berechtigung für dieses Konto.';
  end if;
  update public.profiles set interview_enabled = enabled where id = target_id;
end;
$$;

revoke all on function public.can_manage_ai_settings_for(uuid) from public;
grant execute on function public.can_manage_ai_settings_for(uuid) to authenticated;
revoke all on function public.set_ai_enabled(uuid, boolean) from public;
grant execute on function public.set_ai_enabled(uuid, boolean) to authenticated;
revoke all on function public.set_interview_enabled(uuid, boolean) from public;
grant execute on function public.set_interview_enabled(uuid, boolean) to authenticated;

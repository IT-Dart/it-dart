-- Nachtrag zu 20260805050000_admin_action_log_fix_coverage.sql: der
-- Ultra-Review (Cloud, 2026-08-05) fand, dass die vier dort ergänzten
-- Felder (premium_until, interview_enabled, trainee_limit, ai_enabled)
-- nur im UPDATE-Trigger nachgezogen wurden -- der DELETE-Trigger
-- (log_profile_deletion) blieb unverändert und erfasst diese Felder im
-- before-Snapshot einer Kontolöschung weiterhin nicht. trainee_limit und
-- ai_enabled fehlten dort sogar bereits in der ursprünglichen Fassung.
-- Diese Migration zieht den DELETE-Pfad symmetrisch nach, damit eine
-- Kontolöschung denselben Vollständigkeitsstand hat wie eine normale
-- Rechteänderung.
create or replace function public.log_profile_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_action_log (actor_id, target_id, action, before, after)
  values (
    auth.uid(),
    old.id,
    'profile_deleted',
    jsonb_build_object(
      'email', old.email,
      'is_admin', old.is_admin,
      'is_premium', old.is_premium,
      'premium_until', old.premium_until,
      'is_trainer', old.is_trainer,
      'is_junior_admin', old.is_junior_admin,
      'trainee_limit', old.trainee_limit,
      'ai_enabled', old.ai_enabled,
      'interview_enabled', old.interview_enabled
    ),
    null
  );
  return old;
end;
$$;

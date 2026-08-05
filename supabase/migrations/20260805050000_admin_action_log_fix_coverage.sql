-- Nachtrag zu 20260805040000_admin_action_log.sql: die Nutzer-Rückfrage
-- "prüft RLS allein, oder fehlen Erfassungs-Lücken?" deckte zwei echte,
-- verifizierte Lücken auf (kein Bypass-Risiko, aber unvollständige
-- Protokollierung):
--
-- 1. premium_until wurde nicht verglichen -- AdminScreen.jsx' "+1 Monat"-
--    Button (grantMonth()) setzt AUSSCHLIESSLICH premium_until, nie
--    is_premium. Eine befristete Premium-Vergabe blieb dadurch komplett
--    unprotokolliert.
-- 2. interview_enabled wurde nicht verglichen -- die eigene RPC
--    set_interview_enabled() sperrt/entsperrt den Zugriff aufs
--    KI-Mock-Interview, ebenfalls unprotokolliert.
--
-- INSERT-seitige Rechtevergabe (neues Konto direkt mit Rechten anlegen,
-- würde den reinen AFTER-UPDATE-Trigger umgehen) wurde geprüft und
-- ausgeschlossen: handle_new_user() setzt beim Anlegen nie Rechte-
-- Spalten direkt, jede Vergabe läuft über ein nachträgliches UPDATE.
create or replace function public.log_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.is_admin is distinct from new.is_admin)
     or (old.is_premium is distinct from new.is_premium)
     or (old.premium_until is distinct from new.premium_until)
     or (old.is_trainer is distinct from new.is_trainer)
     or (old.is_junior_admin is distinct from new.is_junior_admin)
     or (old.trainee_limit is distinct from new.trainee_limit)
     or (old.ai_enabled is distinct from new.ai_enabled)
     or (old.interview_enabled is distinct from new.interview_enabled) then
    insert into public.admin_action_log (actor_id, target_id, action, before, after)
    values (
      auth.uid(),
      new.id,
      'profile_privilege_update',
      jsonb_build_object('is_admin', old.is_admin, 'is_premium', old.is_premium, 'premium_until', old.premium_until, 'is_trainer', old.is_trainer, 'is_junior_admin', old.is_junior_admin, 'trainee_limit', old.trainee_limit, 'ai_enabled', old.ai_enabled, 'interview_enabled', old.interview_enabled),
      jsonb_build_object('is_admin', new.is_admin, 'is_premium', new.is_premium, 'premium_until', new.premium_until, 'is_trainer', new.is_trainer, 'is_junior_admin', new.is_junior_admin, 'trainee_limit', new.trainee_limit, 'ai_enabled', new.ai_enabled, 'interview_enabled', new.interview_enabled)
    );
  end if;
  return new;
end;
$$;

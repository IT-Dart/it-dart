-- Der neue "Rechner"-Modus im Rechentrainer (IP/Subnetz- und Dez/Bin/Hex-
-- Umrechner mit sofortigem Ergebnis, kein Uebungswerkzeug) soll separat vom
-- allgemeinen rechentrainer_enabled abstellbar sein: ein Ausbildungsbetrieb
-- kann seinen Azubis so weiterhin Zugang zum Trainings-/Pruefungsmodus
-- geben, aber den direkten Umrechner deaktivieren, falls er das didaktisch
-- nicht moechte (Sorge, dass Azubis damit statt zu ueben nur nachschlagen).
-- Default true -- die meisten Betriebe/Einzelnutzer wollen den Rechner
-- vermutlich nutzen, es ist ein bewusstes Opt-out, kein Opt-in.
alter table public.profiles add column if not exists rechentrainer_tool_enabled boolean not null default true;

-- Gleiche Berechtigungspruefung wie bei set_ai_enabled/set_interview_enabled
-- (20260722050000_interview_toggle_and_trainer_ai_control.sql): Admin,
-- Junior-Admin (außer beim geschützten Hauptkonto) oder der Trainer, dem
-- genau dieser Trainee zugeordnet ist -- can_manage_ai_settings_for() ist
-- trotz des Namens bereits als generischer Helfer fuer "eng gefasste
-- Konto-Einstellung durch Admin/Trainer" gebaut, hier bewusst wiederverwendet
-- statt eine dritte fast identische Pruefung zu duplizieren.
create or replace function public.set_rechentrainer_tool_enabled(target_id uuid, enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_ai_settings_for(target_id) then
    raise exception 'Keine Berechtigung für dieses Konto.';
  end if;
  update public.profiles set rechentrainer_tool_enabled = enabled where id = target_id;
end;
$$;

revoke all on function public.set_rechentrainer_tool_enabled(uuid, boolean) from public;
grant execute on function public.set_rechentrainer_tool_enabled(uuid, boolean) to authenticated;

-- admin_action_log-Abdeckung erweitern (Single-Source-Pattern aus
-- 20260805070000_admin_action_log_single_source.sql): Spaltenliste UND
-- WHEN-Klausel muessen beide gepflegt werden, das ist dort bewusst
-- dokumentiert als die verbleibende, nicht vermeidbare Duplizierung.
create or replace function public.admin_action_log_tracked_columns()
returns text[]
language sql
immutable
set search_path = public
as $$
  select array['is_admin','is_premium','premium_until','is_trainer','is_junior_admin','trainee_limit','ai_enabled','interview_enabled','rechentrainer_tool_enabled']
$$;

drop trigger if exists trg_log_profile_privilege_change on public.profiles;
create trigger trg_log_profile_privilege_change
after update on public.profiles
for each row
when (
  old.is_admin is distinct from new.is_admin
  or old.is_premium is distinct from new.is_premium
  or old.premium_until is distinct from new.premium_until
  or old.is_trainer is distinct from new.is_trainer
  or old.is_junior_admin is distinct from new.is_junior_admin
  or old.trainee_limit is distinct from new.trainee_limit
  or old.ai_enabled is distinct from new.ai_enabled
  or old.interview_enabled is distinct from new.interview_enabled
  or old.rechentrainer_tool_enabled is distinct from new.rechentrainer_tool_enabled
)
execute function public.log_profile_privilege_change();

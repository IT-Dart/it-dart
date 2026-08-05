-- Nachtrag nach /simplify-Review (2026-08-05): behebt Fund 1 (Rechte-
-- Spaltenliste an 5 Stellen von Hand dupliziert -- hat bereits zweimal
-- echt zugeschlagen, siehe 20260805050000/20260805060000) und Fund 2
-- (Trigger feuert bei JEDER profiles-Änderung, nicht nur bei
-- Rechteänderungen -- unnötiger Aufruf-Overhead auf einer stark
-- frequentierten Tabelle).
--
-- Ehrliche Grenze: die WHEN-Klausel am Trigger selbst MUSS ein
-- statischer SQL-Ausdruck sein (kein Loop über ein Array möglich) --
-- die Spaltenliste taucht deshalb weiterhin an zwei Stellen auf (hier
-- als Array-Literal UND in der WHEN-Klausel), nicht mehr an fünf. Bei
-- einer künftigen neuen Spalte müssen beide Stellen gepflegt werden.
create or replace function public.admin_action_log_tracked_columns()
returns text[]
language sql
immutable
set search_path = public
as $$
  select array['is_admin','is_premium','premium_until','is_trainer','is_junior_admin','trainee_limit','ai_enabled','interview_enabled']
$$;

create or replace function public.log_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  col text;
  changed boolean := false;
  before_jsonb jsonb := '{}'::jsonb;
  after_jsonb jsonb := '{}'::jsonb;
begin
  foreach col in array public.admin_action_log_tracked_columns() loop
    if (to_jsonb(old) -> col) is distinct from (to_jsonb(new) -> col) then
      changed := true;
    end if;
    before_jsonb := before_jsonb || jsonb_build_object(col, to_jsonb(old) -> col);
    after_jsonb := after_jsonb || jsonb_build_object(col, to_jsonb(new) -> col);
  end loop;

  if changed then
    insert into public.admin_action_log (actor_id, target_id, action, before, after)
    values (auth.uid(), new.id, 'profile_privilege_update', before_jsonb, after_jsonb);
  end if;
  return new;
end;
$$;

create or replace function public.log_profile_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  col text;
  before_jsonb jsonb := jsonb_build_object('email', old.email);
begin
  foreach col in array public.admin_action_log_tracked_columns() loop
    before_jsonb := before_jsonb || jsonb_build_object(col, to_jsonb(old) -> col);
  end loop;

  insert into public.admin_action_log (actor_id, target_id, action, before, after)
  values (auth.uid(), old.id, 'profile_deleted', before_jsonb, null);
  return old;
end;
$$;

-- WHEN-Klausel: Postgres wertet dies direkt gegen OLD/NEW aus, ohne die
-- PL/pgSQL-Funktion überhaupt aufzurufen, wenn keine der acht Spalten
-- betroffen ist -- kein Overhead mehr bei Nutzername-/AGB-/Sonstigen
-- Updates auf profiles.
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
)
execute function public.log_profile_privilege_change();

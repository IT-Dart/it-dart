-- Sicherheitsaudit 2026-08-06/07: gebündelter Aufräum-Commit für die
-- "niedrig" priorisierten Befunde N1, N2, N3, N7 (siehe docs/reviews/
-- 2026-08-06_sicherheitsaudit_gesamt_c847167.md). N4-N6, N8-N11, S0-S4
-- sind Code-/Doku-Änderungen ohne eigene Migration, laufen im selben Commit.

-- ---------------------------------------------------------------------------
-- N1: cleanup_unconfirmed_signups() ohne SET search_path, EXECUTE für
-- anon/authenticated. Nicht ausnutzbar (live verifiziert:
-- has_table_privilege('authenticated','auth.users','delete') = false, der
-- Aufruf schlägt an der fehlenden Tabellenberechtigung ab, nicht an fehlendem
-- EXECUTE), verstößt aber gegen die eigene search_path-Regel und sollte
-- ohnehin nicht clientseitig aufrufbar sein.
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_unconfirmed_signups()
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from auth.users
  where confirmed_at is null
    and created_at < now() - interval '48 hours';
end;
$$;

revoke execute on function public.cleanup_unconfirmed_signups() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- N2: branch_hourly_rate_usd() ohne SET search_path (Advisor-WARN). Reine
-- Konstanten-Funktion, minimales Risiko, aber die zweite und letzte
-- Ausnahme von der Projektregel.
-- ---------------------------------------------------------------------------
create or replace function public.branch_hourly_rate_usd()
returns numeric
language sql
immutable
set search_path = public
as $$ select 0.01344::numeric $$;

-- ---------------------------------------------------------------------------
-- N3: ai_usage hat aktive RLS, aber 0 Policies -- das ist fail-closed und
-- korrekt so (Schreiben nur per Service-Role, Lesen nur über
-- get_ai_usage_counts()/get_ai_usage_cost_summary()), erscheint aber als
-- Advisor-INFO. Als bewusste Entscheidung dokumentiert, damit es niemand
-- später "repariert".
-- ---------------------------------------------------------------------------
comment on table public.ai_usage is
  'RLS aktiv, bewusst OHNE Policies (fail-closed): kein Client darf direkt lesen/schreiben. Schreiben läuft ausschließlich über Edge Functions (Service-Role), Lesen ausschließlich über get_ai_usage_counts()/get_ai_usage_cost_summary() (SECURITY DEFINER). Erscheint als Supabase-Advisor-INFO ("RLS enabled, no policy") -- das ist hier erwünscht, nicht ein vergessener Schritt.';

-- ---------------------------------------------------------------------------
-- N7: admin_action_log protokollierte die Rechentrainer-Freischaltung nicht
-- (rechentrainer_enabled, rechentrainer_until fehlten in der getrackten
-- Spaltenliste) -- ausgerechnet der bezahlpflichtige Freischalt-Vorgang von
-- 2026-08-06. Single-Source-Pattern aus 20260805070000: Spaltenliste UND
-- WHEN-Klausel müssen beide gepflegt werden (WHEN muss ein statischer
-- SQL-Ausdruck sein, kein Array-Loop möglich).
-- ---------------------------------------------------------------------------
create or replace function public.admin_action_log_tracked_columns()
returns text[]
language sql
immutable
set search_path = public
as $$
  select array['is_admin','is_premium','premium_until','is_trainer','is_junior_admin','trainee_limit','ai_enabled','interview_enabled','rechentrainer_tool_enabled','rechentrainer_enabled','rechentrainer_until']
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
  or old.rechentrainer_enabled is distinct from new.rechentrainer_enabled
  or old.rechentrainer_until is distinct from new.rechentrainer_until
)
execute function public.log_profile_privilege_change();

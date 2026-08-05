-- Protokolliert Rechte-/Rollenänderungen und Kontolöschungen -- bisher
-- deckte session_audit_log (Migration 20260730000000) ausschließlich IP-/
-- Sitzungs-Claims ab, nicht WER WANN Admin-/Premium-/Trainer-/Junior-Admin-
-- Status vergeben oder entzogen bzw. ein Konto gelöscht hat. In CLAUDE.md
-- ("4. Verifikation, Protokollierung & Bestandsschutz") als echter,
-- bestehender Lückenbefund benannt -- diese Migration schließt ihn.
--
-- Trigger-basiert statt Logging-Aufrufe in jeder einzelnen Edge Function/
-- jedem RPC zu ergänzen: erfasst dadurch JEDEN Schreibpfad auf profiles
-- automatisch (AdminScreen.jsx-Direktänderungen, Junior-Admin-RPCs wie
-- update_trainee_limit(), künftige neue Pfade), nicht nur die Stellen, an
-- die man beim Bauen zufällig gedacht hat -- gleiches Prinzip wie die
-- bestehende Trainer-Kontingent-Durchsetzung per DB-Trigger.
--
-- Bekannte Grenze, bewusst nicht verschwiegen: auth.uid() ist nur gesetzt,
-- wenn die auslösende Schreiboperation mit dem JWT des handelnden Nutzers
-- lief (z. B. AdminScreen.jsx-Direktänderungen, RPC-Aufrufe). Läuft eine
-- Änderung stattdessen über eine Service-Role-Edge-Function (z. B.
-- admin-delete-user, trainer-manage-invite), ist actor_id NULL -- WAS sich
-- geändert hat wird trotzdem vollständig erfasst, nur WER es über diesen
-- Pfad ausgelöst hat nicht automatisch. Spätere Erweiterung möglich, aber
-- bewusst nicht Teil dieser ersten Version.
create table if not exists public.admin_action_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  target_id uuid not null,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_action_log enable row level security;

create policy "Admins can read admin action log"
on public.admin_action_log for select
to authenticated
using (is_admin_user());
-- Bewusst keine INSERT/UPDATE/DELETE-Policy für Nutzer -- ausschließlich die
-- untenstehenden Trigger (SECURITY DEFINER) schreiben hier, niemand kann die
-- eigene Spur nachträglich verändern oder löschen.

create or replace function public.log_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.is_admin is distinct from new.is_admin)
     or (old.is_premium is distinct from new.is_premium)
     or (old.is_trainer is distinct from new.is_trainer)
     or (old.is_junior_admin is distinct from new.is_junior_admin)
     or (old.trainee_limit is distinct from new.trainee_limit)
     or (old.ai_enabled is distinct from new.ai_enabled) then
    insert into public.admin_action_log (actor_id, target_id, action, before, after)
    values (
      auth.uid(),
      new.id,
      'profile_privilege_update',
      jsonb_build_object('is_admin', old.is_admin, 'is_premium', old.is_premium, 'is_trainer', old.is_trainer, 'is_junior_admin', old.is_junior_admin, 'trainee_limit', old.trainee_limit, 'ai_enabled', old.ai_enabled),
      jsonb_build_object('is_admin', new.is_admin, 'is_premium', new.is_premium, 'is_trainer', new.is_trainer, 'is_junior_admin', new.is_junior_admin, 'trainee_limit', new.trainee_limit, 'ai_enabled', new.ai_enabled)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_profile_privilege_change on public.profiles;
create trigger trg_log_profile_privilege_change
after update on public.profiles
for each row execute function public.log_profile_privilege_change();

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
    jsonb_build_object('email', old.email, 'is_admin', old.is_admin, 'is_premium', old.is_premium, 'is_trainer', old.is_trainer, 'is_junior_admin', old.is_junior_admin),
    null
  );
  return old;
end;
$$;

drop trigger if exists trg_log_profile_deletion on public.profiles;
create trigger trg_log_profile_deletion
after delete on public.profiles
for each row execute function public.log_profile_deletion();

-- Admin-only Leseansicht mit aufgelösten E-Mails statt roher UUIDs -- direkt
-- gegen die Tabelle selektieren würde in der UI nur IDs anzeigen, für einen
-- echten Prüfzweck braucht es die E-Mail-Zuordnung.
create or replace function public.get_admin_action_log(row_limit integer default 100)
returns table(
  id bigint,
  actor_email text,
  target_email text,
  action text,
  before jsonb,
  after jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin_user() then
    raise exception 'Nur für Admins.';
  end if;

  return query
    select
      l.id,
      actor.email as actor_email,
      target.email as target_email,
      l.action,
      l.before,
      l.after,
      l.created_at
    from public.admin_action_log l
    left join public.profiles actor on actor.id = l.actor_id
    left join public.profiles target on target.id = l.target_id
    order by l.created_at desc
    limit least(row_limit, 500);
end;
$$;

revoke all on function public.get_admin_action_log(integer) from public;
grant execute on function public.get_admin_action_log(integer) to authenticated;

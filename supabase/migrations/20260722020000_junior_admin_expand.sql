-- Erweiterung der Junior-Admin-Rolle um KI-Zugriffssteuerung. Gleiches
-- Prinzip wie update_trainee_limit(): eine einzelne, eng gefasste Funktion
-- statt einer generellen UPDATE-Policy auf profiles — Premium- und
-- Trainer-Rollenvergabe bleiben bewusst admin-only, wie ursprünglich
-- festgelegt. "Trainees verwalten" (Zuordnung/Entfernen) läuft bereits über
-- die bestehende trainer_trainees-Policy für Junior-Admins, dafür ist
-- keine weitere Migration nötig.
create or replace function public.set_ai_enabled(target_id uuid, enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin_user() or public.is_junior_admin_user()) then
    raise exception 'Nur für Admins oder Junior-Admins.';
  end if;
  update public.profiles set ai_enabled = enabled where id = target_id;
end;
$$;

revoke all on function public.set_ai_enabled(uuid, boolean) from public;
grant execute on function public.set_ai_enabled(uuid, boolean) to authenticated;

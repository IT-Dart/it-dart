-- Junior-Admin-Rolle nach dem Prinzip der minimalen Rechtevergabe:
-- Lesezugriff auf die Nutzerliste, Einladungen versenden/verwalten und
-- Trainer-Zuordnungen unterstützen — aber keine Kontolöschung, keine
-- Rechtevergabe (Admin/Trainer/Premium) und kein genereller Schreibzugriff
-- auf profiles. Zugriff auf Server-Secrets war ohnehin nie clientseitig
-- möglich (Service-Role-Key existiert ausschließlich in Edge Functions).
alter table public.profiles add column if not exists is_junior_admin boolean not null default false;

create or replace function public.is_junior_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_junior_admin from public.profiles where id = auth.uid()), false);
$$;

-- Gleiche Lesesicht wie ein voller Admin — aber bewusst KEINE analoge
-- "kann alles updaten"-Policy. Schreibrechte laufen für Junior-Admins nur
-- über die eng gefasste Funktion update_trainee_limit() weiter unten.
drop policy if exists "Junior admins can read all profiles" on public.profiles;
create policy "Junior admins can read all profiles"
  on public.profiles for select
  using (public.is_junior_admin_user());

-- Trainer-Testenden-Zuordnungen verwalten dürfen (Kontingent-Trigger greift
-- weiterhin unabhängig von der aufrufenden Rolle).
drop policy if exists "Junior admins can manage trainer assignments" on public.trainer_trainees;
create policy "Junior admins can manage trainer assignments"
  on public.trainer_trainees for all
  using (public.is_junior_admin_user())
  with check (public.is_junior_admin_user());

-- Einziger erlaubter Schreibpfad für Junior-Admins auf profiles: exakt eine
-- Spalte (trainee_limit), über eine Funktion statt einer direkten
-- UPDATE-Policy. So gibt es keine Möglichkeit, über denselben Weg heimlich
-- is_admin/is_trainer/is_premium/premium_until mitzuändern.
create or replace function public.update_trainee_limit(target_id uuid, new_limit integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin_user() or public.is_junior_admin_user()) then
    raise exception 'Nur für Admins oder Junior-Admins.';
  end if;
  if new_limit < 0 then
    raise exception 'Kontingent darf nicht negativ sein.';
  end if;
  update public.profiles set trainee_limit = new_limit where id = target_id;
end;
$$;

revoke all on function public.update_trainee_limit(uuid, integer) from public;
grant execute on function public.update_trainee_limit(uuid, integer) to authenticated;

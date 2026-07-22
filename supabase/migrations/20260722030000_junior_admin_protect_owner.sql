-- The main admin account is already exempt from every in-app deletion path
-- (see delete-account, admin-delete-user, trainer-manage-invite). That only
-- covered deletion — a Junior-Admin could still flip its AI access, change
-- its trainee quota, or (un)assign it as a trainer/trainee. This closes that
-- gap: the account is now rejected as a *target* by every write path a
-- Junior-Admin has, full stop, regardless of which screen calls it.
create or replace function public.is_protected_account(target_id uuid)
returns boolean
language sql
immutable
as $$
  select target_id = '33271bc9-6b8a-456f-9cf1-a5c564218b07'::uuid;
$$;

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
  if public.is_junior_admin_user() and not public.is_admin_user() and public.is_protected_account(target_id) then
    raise exception 'Dieses Konto ist geschützt und kann nicht verändert werden.';
  end if;
  if new_limit < 0 then
    raise exception 'Kontingent darf nicht negativ sein.';
  end if;
  update public.profiles set trainee_limit = new_limit where id = target_id;
end;
$$;

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
  if public.is_junior_admin_user() and not public.is_admin_user() and public.is_protected_account(target_id) then
    raise exception 'Dieses Konto ist geschützt und kann nicht verändert werden.';
  end if;
  update public.profiles set ai_enabled = enabled where id = target_id;
end;
$$;

-- trainer_trainees is written to directly from the client (not through an
-- RPC), so the same guard has to live in the RLS policy itself: a
-- Junior-Admin may not create or remove any assignment row that touches the
-- protected account on either side.
drop policy if exists "Junior admins can manage trainer assignments" on public.trainer_trainees;
create policy "Junior admins can manage trainer assignments"
  on public.trainer_trainees for all
  using (
    public.is_junior_admin_user()
    and not public.is_protected_account(trainer_id)
    and not public.is_protected_account(trainee_id)
  )
  with check (
    public.is_junior_admin_user()
    and not public.is_protected_account(trainer_id)
    and not public.is_protected_account(trainee_id)
  );

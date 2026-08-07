-- Nutzerhinweis 2026-08-07: Trainer konnten ihren Trainees bisher KI/
-- Mock-Interview/Rechner freischalten, aber kein Premium -- obwohl
-- is_premium/premium_until in TrainerScreen.jsx laengst angezeigt wurden
-- (nur ohne zugehoerigen Umschalter). Neue enge RPC set_trainee_premium():
-- Trainer duerfen Premium fuer ihre eigenen Trainees vergeben, aber nur bis
-- zu ihrem eigenen trainee_limit gleichzeitig freigeschalteter Trainees --
-- dieselbe Zahl, die auch die Einladungs-Obergrenze bildet.
--
-- Bewusst KEIN Zugriff fuer Junior-Admins: "Nur Admins können Rechte
-- vergeben." gilt in AdminScreen.jsx fuer JEDE Premium-/Rollen-Vergabe
-- (grantDisabled=busyId===r.id||juniorOnly) -- diese neue Funktion haelt
-- dieselbe Grenze ein, statt versehentlich can_manage_ai_settings_for()
-- wiederzuverwenden (die wuerde Junior-Admins mit einschliessen).
create or replace function public.set_trainee_premium(target_id uuid, enabled boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_is_admin boolean := public.is_admin_user();
  caller_trainee_limit int;
  current_premium_count int;
begin
  if not (
    caller_is_admin
    or exists (
      select 1 from public.trainer_trainees
      where trainer_id = auth.uid() and trainee_id = target_id
    )
  ) then
    raise exception 'Keine Berechtigung für dieses Konto.';
  end if;

  -- Kontingent-Grenze gilt nur fuer den Trainer-Weg, Admins duerfen
  -- unbegrenzt vergeben (wie bei allen anderen Premium-Aktionen).
  if enabled and not caller_is_admin then
    select trainee_limit into caller_trainee_limit from public.profiles where id = auth.uid();
    select count(*) into current_premium_count
      from public.trainer_trainees tt
      join public.profiles p on p.id = tt.trainee_id
      where tt.trainer_id = auth.uid() and p.is_premium = true;
    if current_premium_count >= coalesce(caller_trainee_limit, 5) then
      raise exception 'Premium-Kontingent erreicht (% von % Plätzen bereits vergeben).', current_premium_count, coalesce(caller_trainee_limit, 5);
    end if;
  end if;

  update public.profiles set is_premium = enabled, premium_until = null where id = target_id;
end;
$$;

grant execute on function public.set_trainee_premium(uuid, boolean) to authenticated;

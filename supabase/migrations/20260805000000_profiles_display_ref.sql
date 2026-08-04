-- Rein kosmetische, fortlaufende Referenznummer fuers Wiedererkennen im
-- Supabase-Studio, seit dort "email" als sensible Spalte maskiert wird.
-- KEINE Sicherheits-/Auth-Bedeutung -- niemals im App-Code fuer
-- Lookups/Autorisierung verwenden (sonst IDOR-Risiko, siehe CLAUDE.md
-- "Kein stilles Abschwaechen bestehender Sicherheitsmechanismen"). Die
-- echte auth.users/profiles.id-UUID bleibt unveraendert die einzige
-- Identitaet, die die App tatsaechlich verwendet.
create sequence if not exists public.profiles_display_ref_seq;

alter table public.profiles add column if not exists display_ref integer;

with numbered as (
  select id, row_number() over (order by created_at) as rn
  from public.profiles
  where display_ref is null
)
update public.profiles p set display_ref = numbered.rn
from numbered where p.id = numbered.id;

select setval('public.profiles_display_ref_seq', (select coalesce(max(display_ref), 0) from public.profiles));
alter table public.profiles alter column display_ref set default nextval('public.profiles_display_ref_seq');
alter table public.profiles add constraint profiles_display_ref_unique unique (display_ref);

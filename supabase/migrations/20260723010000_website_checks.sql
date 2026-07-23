-- Speichert Ergebnisse des admin-only Website-Analyse-Tools (siehe
-- supabase/functions/website-check). Anders als e2e_runs synchron: eine
-- Prüfung läuft komplett innerhalb eines einzigen Edge-Function-Aufrufs
-- (reiner HTTP-Abruf der Ziel-URL, kein Browser, kein externer CI-Lauf),
-- daher kein Status "queued"/"running" nötig.
create table if not exists public.website_checks (
  id bigint generated always as identity primary key,
  url text not null,
  status text not null default 'success' check (status in ('success', 'error')),
  report jsonb,
  error_text text,
  triggered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.website_checks enable row level security;

create policy "Admins can read website checks"
  on public.website_checks for select
  using (public.is_admin_user());

-- Anders als e2e_runs zusätzlich eine Client-Delete-Policy: Prüfergebnisse
-- enthalten ausschließlich öffentlich abrufbare Metadaten der geprüften
-- fremden Website (keine Berechtigungs- oder Kontodaten), daher ist ein
-- direktes Aufräumen alter Einträge durch Admins risikofrei möglich, ohne
-- dafür eine eigene Edge Function zu brauchen.
create policy "Admins can delete website checks"
  on public.website_checks for delete
  using (public.is_admin_user());

-- Bewusst keine INSERT/UPDATE-Policy — das eigentliche Schreiben (inkl. des
-- externen HTTP-Abrufs) läuft ausschließlich über die Edge Function
-- website-check mit dem Service-Role-Key.

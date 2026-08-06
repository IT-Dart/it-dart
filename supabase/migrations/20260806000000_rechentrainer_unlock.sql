-- Rechentrainer (Subnetting-Uebungswerkzeug): eigenstaendig freischaltbares
-- Add-on, unabhaengig von Premium. Spiegelt bewusst das is_premium/
-- premium_until-Muster (dauerhaft ODER befristet, je nachdem was zuletzt
-- gewaehrt wurde) statt der interview_enabled-Variante -- Freischaltung ist
-- hier ein Kaufvorgang, den wie bei Premium nur der volle Admin gewaehrt/
-- entzieht, keine Trainer-/Junior-Admin-Delegation noetig. Die bereits
-- bestehende Policy "Admins can update all profiles" deckt beide neuen
-- Spalten automatisch mit ab, keine zusaetzliche RLS-Policy noetig.
alter table public.profiles
  add column if not exists rechentrainer_enabled boolean not null default false,
  add column if not exists rechentrainer_until timestamptz;

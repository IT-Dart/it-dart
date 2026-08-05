-- Nachtrag nach /simplify-Review (2026-08-05), Fund 3 (Efficiency): der
-- ursprüngliche Kommentar in branch-cost-sync/index.ts behauptete, ON
-- CONFLICT könne den partiellen Unique-Index (branch_cost_log_active_branch_idx,
-- nur status='active') nicht als Ziel nutzen -- das war FALSCH, live gegen
-- die echte Datenbank widerlegt: "on conflict (branch_id) where status =
-- 'active' do update ..." funktioniert korrekt. supabase-js' getyptes
-- .upsert() kann diese WHERE-Klausel aber nicht ausdrücken (PostgREST
-- generiert nur ein reines "ON CONFLICT (spalte)" ohne Prädikat, das gegen
-- einen rein partiellen Index nicht als Konflikt-Ziel auflösbar ist) --
-- deshalb hier eine kleine SQL-Funktion, die die korrekte Syntax kapselt,
-- statt weiterhin zwei sequenzielle Aufrufe (SELECT dann INSERT/UPDATE)
-- aus der Edge Function zu machen.
create or replace function public.branch_cost_log_start(p_branch_id text, p_branch_name text)
returns void
language sql
set search_path = public
as $$
  insert into public.branch_cost_log (branch_id, branch_name, status, started_at, last_seen_at)
  values (p_branch_id, p_branch_name, 'active', now(), now())
  on conflict (branch_id) where status = 'active'
  do update set last_seen_at = now();
$$;

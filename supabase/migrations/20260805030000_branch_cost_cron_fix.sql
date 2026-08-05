-- Nachtrag zu 20260805020000_branch_cost_tracking.sql: der ursprüngliche
-- Cron-Job dort (Poll gegen die Supabase-Management-API, 2026-08-05 aus
-- Sicherheitsgründen verworfen -- siehe Kommentar in dieser Datei) würde bei
-- jedem erneuten Replay dieser Migration (z. B. auf einem frischen
-- E2E-Branch) wieder angelegt werden, weil der bereits AUF DER PRODUKTION
-- gespeicherte Migrations-Eintrag selbst noch den alten Text enthält --
-- eine Korrektur dieses gespeicherten Eintrags direkt war durch die
-- Auto-Mode-Berechtigungssperre blockiert (siehe PROJEKT-STATUS.md, "bei
-- Gelegenheit" statt sofort erzwungen). Diese eigenständige Migration räumt
-- das bei jedem Replay sauber auf, statt den historischen Eintrag zu
-- überschreiben: alten Job entfernen (falls vorhanden), sicherstellen dass
-- nur der neue, rein SQL-basierte Sicherheitsnetz-Job existiert.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'branch-cost-sync') then
    perform cron.unschedule('branch-cost-sync');
  end if;
end;
$$;

select cron.schedule(
  'branch-cost-safety-net',
  '*/15 * * * *',
  $$
  update public.branch_cost_log
  set status = 'closed', ended_at = now()
  where status = 'active' and started_at < now() - interval '3 hours';
  $$
);

-- Audit-Befund M7 (2026-08-06): cleanup_old_csp_reports() (Migration
-- 20260803010000_csp_reports.sql) wurde nie tatsaechlich in pg_cron
-- registriert -- csp_reports waechst seither unbegrenzt, die im Kommentar
-- der Funktion beschriebene 90-Tage-Aufraeumung lief nie. Gleiches
-- taeglich-04:00-UTC-Muster wie cleanup-unconfirmed-signups-daily
-- (Migration 20260806020000_cleanup_unconfirmed_signups.sql).

select cron.schedule('cleanup-old-csp-reports-daily', '0 4 * * *', $$select public.cleanup_old_csp_reports();$$);

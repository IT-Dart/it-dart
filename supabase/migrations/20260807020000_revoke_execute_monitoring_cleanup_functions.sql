-- Audit-Befund M5 (2026-08-06): fire_uptime_check(), collect_uptime_checks()
-- und cleanup_old_csp_reports() sind SECURITY DEFINER, hatten aber (anders
-- als z. B. get_monitoring_overview()) keine eigene is_admin_user()-Pruefung
-- im Funktionskoerper -- verlassen sich allein darauf, dass sie nur ueber
-- pg_cron aufgerufen werden. Postgres vergibt EXECUTE auf neue Funktionen
-- per Default an PUBLIC, was anon/authenticated einschliesst: jeder
-- angemeldete oder sogar anonyme Aufruf konnte damit ungefragt einen
-- externen HTTP-Request ausloesen (fire_uptime_check) oder Loeschungen in
-- csp_reports anstossen (cleanup_old_csp_reports). Ausfuehrung soll
-- ausschliesslich ueber pg_cron (Rolle postgres) laufen, nie ueber den
-- Client -- EXECUTE fuer anon/authenticated entziehen, PUBLIC ebenfalls
-- explizit, damit kuenftige Rollen es nicht automatisch mit erben.

revoke execute on function public.fire_uptime_check() from public, anon, authenticated;
revoke execute on function public.collect_uptime_checks() from public, anon, authenticated;
revoke execute on function public.cleanup_old_csp_reports() from public, anon, authenticated;

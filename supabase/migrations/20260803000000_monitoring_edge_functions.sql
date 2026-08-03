-- Erweitert das bestehende Uptime-Monitoring (siehe 20260728000000) um zwei
-- kritische Edge Functions (ai-chat, claim-session): erkennt den Fall
-- "Hauptseite erreichbar, aber eine einzelne Funktion kaputt" (z. B. nach
-- einem fehlerhaften Deploy). Nutzt denselben Fire-and-Collect-Mechanismus
-- über pg_net wie der bestehende Website-Check.
--
-- Sicherer Health-Check ohne echte Seiteneffekte/Kosten: ein GET-Request ohne
-- Authorization-Header trifft in beiden Functions sofort auf die eigene
-- "Nicht angemeldet"-Pruefung (401) -- kein Anthropic-Aufruf, keine DB-
-- Schreibaktion, keine Kosten. Ein HTTP 401 gilt hier deshalb bewusst als
-- "gesund" (die Funktion lief und antwortete korrekt), nur ein fehlender
-- Status-Code (Timeout/Netzwerkfehler) oder ein 5xx-Fehler gilt als Ausfall.

create or replace function public.fire_uptime_check()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req_id bigint;
  fn_base text := 'https://vukqjpqawzhfvpjjpipp.supabase.co/functions/v1/';
begin
  req_id := net.http_get(url => 'https://it-dart.de/', timeout_milliseconds => 8000);
  insert into public.monitoring_pending_checks (request_id, target)
  values (req_id, 'it-dart.de');

  req_id := net.http_get(url => fn_base || 'ai-chat', timeout_milliseconds => 8000);
  insert into public.monitoring_pending_checks (request_id, target)
  values (req_id, 'edge-function:ai-chat');

  req_id := net.http_get(url => fn_base || 'claim-session', timeout_milliseconds => 8000);
  insert into public.monitoring_pending_checks (request_id, target)
  values (req_id, 'edge-function:claim-session');
end;
$$;

create or replace function public.collect_uptime_checks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Beantwortete Anfragen einsammeln. "ok" haengt vom Ziel ab:
  -- - it-dart.de: nur 200-399 gilt als gesund (echter Seitenaufruf).
  -- - edge-function:*: 401 ist die erwartete, gesunde Antwort auf einen
  --   Ping ohne Authorization-Header -- nur ein 5xx-Fehler zaehlt als Ausfall.
  insert into public.monitoring_checks (target, status_code, ok, response_time_ms, checked_at)
  select
    p.target,
    r.status_code,
    case
      when p.target = 'it-dart.de' then r.status_code between 200 and 399
      else r.status_code < 500
    end,
    round(extract(epoch from (r.created - p.requested_at))*1000),
    r.created
  from public.monitoring_pending_checks p
  join net._http_response r on r.id = p.request_id
  where r.status_code is not null;

  insert into public.monitoring_checks (target, ok, error, checked_at)
  select p.target, false, coalesce(r.error_msg, 'Fehler ohne Statuscode'), r.created
  from public.monitoring_pending_checks p
  join net._http_response r on r.id = p.request_id
  where r.status_code is null;

  delete from public.monitoring_pending_checks p
  using net._http_response r
  where r.id = p.request_id;

  -- Anfragen, die nach 2 Minuten immer noch keine Antwort haben, als
  -- Timeout werten und aufräumen (verhindert unbegrenztes Anwachsen).
  insert into public.monitoring_checks (target, ok, error, checked_at)
  select target, false, 'keine Antwort (Timeout)', now()
  from public.monitoring_pending_checks
  where requested_at < now() - interval '2 minutes';

  delete from public.monitoring_pending_checks
  where requested_at < now() - interval '2 minutes';
end;
$$;

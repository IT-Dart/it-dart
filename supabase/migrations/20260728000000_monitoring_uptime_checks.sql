-- Einfaches, auf IT-Dart abgestimmtes Monitoring v1: Uptime-Check für
-- it-dart.de alle 5 Minuten + Datenbankgröße. Traffic (Vercel) und externe
-- Alarmierung (z. B. UptimeRobot) sind bewusst als spätere Erweiterung
-- zurückgestellt (siehe To-Do #1).
--
-- pg_net erlaubt kein synchrones Warten auf die Antwort: net.http_get()
-- feuert innerhalb der aufrufenden Transaktion, der pg_net-Hintergrund-
-- prozess sieht die Anfrage aber erst nach deren Commit. Ein Fire-and-Poll
-- in einer einzigen Funktion kann die Antwort daher strukturell nie sehen
-- -- deshalb zwei getrennte, jeweils eigenständig committende Cron-Jobs.

create extension if not exists pg_cron;

create table if not exists public.monitoring_checks (
  id bigint generated always as identity primary key,
  target text not null,
  checked_at timestamptz not null default now(),
  status_code int,
  ok boolean not null,
  response_time_ms int,
  error text
);

alter table public.monitoring_checks enable row level security;

create policy "Admins can read monitoring checks"
on public.monitoring_checks for select
to authenticated
using (is_admin_user());

create table if not exists public.monitoring_pending_checks (
  request_id bigint primary key,
  target text not null,
  requested_at timestamptz not null default now()
);

alter table public.monitoring_pending_checks enable row level security;

create policy "Admins can read pending monitoring checks"
on public.monitoring_pending_checks for select
to authenticated
using (is_admin_user());

create or replace function public.fire_uptime_check()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req_id bigint;
begin
  req_id := net.http_get(url => 'https://it-dart.de/', timeout_milliseconds => 8000);
  insert into public.monitoring_pending_checks (request_id, target)
  values (req_id, 'it-dart.de');
end;
$$;

create or replace function public.collect_uptime_checks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Beantwortete Anfragen einsammeln.
  insert into public.monitoring_checks (target, status_code, ok, response_time_ms, checked_at)
  select
    p.target,
    r.status_code,
    r.status_code between 200 and 399,
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

select cron.schedule('it-dart-uptime-fire', '*/5 * * * *', $$select public.fire_uptime_check();$$);
select cron.schedule('it-dart-uptime-collect', '*/1 * * * *', $$select public.collect_uptime_checks();$$);

create or replace function public.get_monitoring_overview()
returns table(db_size_bytes bigint, db_size_pretty text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Nur für Admins.';
  end if;
  return query
    select pg_database_size(current_database()), pg_size_pretty(pg_database_size(current_database()));
end;
$$;

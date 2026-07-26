-- Extends ai_usage to also track Anthropic's web-search tool cost
-- ($10 / 1000 searches, billed separately from token usage) for the new
-- admin-only "Lösung suchen" feature on the To-Do dashboard.
alter table public.ai_usage
  add column if not exists web_search_requests integer;

create or replace function public.get_ai_usage_cost_summary()
returns table(
  month text,
  request_count bigint,
  total_input_tokens bigint,
  total_output_tokens bigint,
  total_web_searches bigint,
  total_cost_usd numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (public.is_admin_user() or public.is_junior_admin_user()) then
    raise exception 'Nur für Admins oder Junior-Admins.';
  end if;
  return query
    select
      to_char(u.created_at, 'YYYY-MM') as month,
      count(*)::bigint as request_count,
      coalesce(sum(u.input_tokens), 0)::bigint as total_input_tokens,
      coalesce(sum(u.output_tokens), 0)::bigint as total_output_tokens,
      coalesce(sum(u.web_search_requests), 0)::bigint as total_web_searches,
      coalesce(sum(u.cost_usd), 0)::numeric as total_cost_usd
    from public.ai_usage u
    group by 1
    order by 1 desc;
end;
$$;

revoke all on function public.get_ai_usage_cost_summary() from public;
grant execute on function public.get_ai_usage_cost_summary() to authenticated;

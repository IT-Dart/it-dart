-- Extends ai_usage (already one row per AI-chat request) with real token
-- counts and a computed USD cost per request, instead of introducing a
-- second table for the same grain. Values are computed from Anthropic's
-- own usage.input_tokens/usage.output_tokens in the response, multiplied by
-- published per-model pricing — a supporting attribution log, not a
-- replacement for the real Anthropic invoice (reconcile monthly).
alter table public.ai_usage
  add column if not exists model text,
  add column if not exists module_id text,
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists cost_usd numeric(12, 6);

-- Admin/Junior-Admin read-only cost summary, mirroring the access pattern of
-- get_ai_usage_counts (ai_usage has RLS with zero policies by design — only
-- the service-role key inside ai-chat may read/write it directly).
create or replace function public.get_ai_usage_cost_summary()
returns table(
  month text,
  request_count bigint,
  total_input_tokens bigint,
  total_output_tokens bigint,
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
      coalesce(sum(u.cost_usd), 0)::numeric as total_cost_usd
    from public.ai_usage u
    group by 1
    order by 1 desc;
end;
$$;

revoke all on function public.get_ai_usage_cost_summary() from public;
grant execute on function public.get_ai_usage_cost_summary() to authenticated;

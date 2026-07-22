-- ai_usage has RLS enabled with zero policies (by design — only the
-- service-role key inside ai-chat may read/write it). To let Admin/
-- Junior-Admin see how many AI requests an account has made in total, this
-- narrow, read-only RPC aggregates counts for a given set of ids instead of
-- opening a blanket policy on the table.
create or replace function public.get_ai_usage_counts(target_ids uuid[])
returns table(user_id uuid, request_count bigint)
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
    select u.user_id, count(*)::bigint
    from public.ai_usage u
    where u.user_id = any(target_ids)
    group by u.user_id;
end;
$$;

revoke all on function public.get_ai_usage_counts(uuid[]) from public;
grant execute on function public.get_ai_usage_counts(uuid[]) to authenticated;

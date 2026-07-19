-- Tracks one row per AI-chat request, used to rate-limit per user.
-- No RLS policies on purpose: only the service-role client (used inside
-- the ai-chat Edge Function) may read/write this table.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create index if not exists ai_usage_user_time_idx on public.ai_usage(user_id, created_at);

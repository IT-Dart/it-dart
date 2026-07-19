-- Lets you disable the AI chat for a specific account (independent of
-- premium status) — e.g. to stop abuse without touching their access to
-- modules. Defaults to enabled for everyone.
alter table public.profiles add column if not exists ai_enabled boolean not null default true;

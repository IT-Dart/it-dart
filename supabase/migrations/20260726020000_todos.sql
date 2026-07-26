-- Simple internal to-do tracker for the IT-Dart ecosystem, same pattern as
-- the tools registry: admin-only, optionally linked to a registered tool.
create table if not exists public.todos (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  tool_slug text references public.tools(slug) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists todos_status_idx on public.todos(status);

alter table public.todos enable row level security;

create policy "Admins can manage todos"
  on public.todos for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

create or replace function public.set_todos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at = now();
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
  before update on public.todos
  for each row execute function public.set_todos_updated_at();

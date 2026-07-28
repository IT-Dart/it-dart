-- Automatische Archivierung geloeschter To-Dos: der bestehende
-- "Loeschen"-Button in TodoScreen.jsx war ein echtes Hard-Delete ohne
-- jede Sicherung. Statt eines manuellen Schrittes, der vergessen werden
-- koennte, kopiert ein BEFORE-DELETE-Trigger den Datensatz automatisch
-- in todos_archive, bevor er entfernt wird -- strukturell erzwungen,
-- kein separates Monitoring noetig.

create table if not exists public.todos_archive (
  id bigint primary key,
  title text not null,
  description text,
  status text,
  priority text,
  tool_slug text,
  due_date date,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz not null default now()
);

alter table public.todos_archive enable row level security;

create policy "Admins can read archived todos"
on public.todos_archive for select
to authenticated
using (is_admin_user());

create or replace function public.archive_todo_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.todos_archive
    (id, title, description, status, priority, tool_slug, due_date, created_at, updated_at, completed_at)
  values
    (old.id, old.title, old.description, old.status, old.priority, old.tool_slug, old.due_date, old.created_at, old.updated_at, old.completed_at)
  on conflict (id) do nothing;
  return old;
end;
$$;

drop trigger if exists todos_archive_before_delete on public.todos;
create trigger todos_archive_before_delete
before delete on public.todos
for each row execute function public.archive_todo_before_delete();

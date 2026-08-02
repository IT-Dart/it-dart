-- Erlaubt eine Ebene Unteraufgaben je To-Do (Eltern->Kind, kein tieferes
-- Verschachteln) fuer effizientere Zusammenarbeit bei Aufgaben mit mehreren
-- Teilschritten (z.B. "Plattform final testen" mit Unteraufgaben je Modul).
alter table public.todos
  add column parent_id bigint references public.todos(id) on delete cascade;

create index if not exists idx_todos_parent_id on public.todos(parent_id);

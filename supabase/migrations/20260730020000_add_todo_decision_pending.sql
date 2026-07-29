-- To-Do #62: Kennzeichnung "Entscheidung ausstehend", damit der Nutzer sieht,
-- wo er selbst agieren/entscheiden muss, statt es implizit aus dem Status abzuleiten.
alter table public.todos add column if not exists decision_pending boolean not null default false;

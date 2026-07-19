-- Adds the fields needed for a "Meine Statistik" history view: when an
-- attempt started/finished (to show duration) and the per-topic
-- breakdown (so a past Lernnachweis PDF can be regenerated identically
-- on demand, without storing the PDF itself).
alter table public.lernnachweise
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists topics jsonb;

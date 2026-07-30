-- Feedback-Fragebögen (To-Do #68): zwei kurze, überspringbare Umfragen --
-- Onboarding ("Was erwartest du von der Plattform?") und nach der
-- Prüfungsvorbereitung ("Wie fandest du den Test?"). Kein Update/Delete für
-- Nutzer -- einmal abgeschickte Antworten bleiben unveränderlich, wie ein
-- echter Fragebogen.
create table if not exists public.feedback_responses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('onboarding', 'pruefung')),
  rating smallint check (rating between 1 and 5),
  message text,
  created_at timestamptz not null default now()
);

alter table public.feedback_responses enable row level security;

create policy "users can insert own feedback"
  on public.feedback_responses for insert
  with check (auth.uid() = user_id);

create policy "admins can read all feedback"
  on public.feedback_responses for select
  using (is_admin_user());

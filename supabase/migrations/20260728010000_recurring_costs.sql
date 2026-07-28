-- Fixkosten-Register (To-Do #48, Ausgaben-Teil): manuell gepflegte
-- wiederkehrende Abo-Kosten (GitHub, Vercel, STRATO, OpenArt, Claude/
-- Anthropic, Gemini Premium etc.), da die meisten dieser Anbieter keine
-- programmatisch abrufbare Abrechnungs-API fuer persoenliche/Business-
-- Abos bieten. Der Einnahmen-Teil von #48 haengt an Stripe (To-Do #43)
-- und ist bewusst nicht Teil dieser Migration.

create table if not exists public.recurring_costs (
  id bigint generated always as identity primary key,
  provider text not null,
  description text,
  amount numeric not null,
  currency text not null default 'USD',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  category text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recurring_costs enable row level security;

create policy "Admins can manage recurring costs"
on public.recurring_costs for all
to authenticated
using (is_admin_user())
with check (is_admin_user());

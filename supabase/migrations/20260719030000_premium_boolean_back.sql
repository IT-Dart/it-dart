-- Brings back a simple permanent on/off switch alongside the expiry date.
-- Premium is active if EITHER is true:
--   is_premium = true            (permanent, click-to-toggle in Table Editor)
--   premium_until > now()        (temporary, e.g. "1 month" via SQL)
alter table public.profiles add column if not exists is_premium boolean not null default false;

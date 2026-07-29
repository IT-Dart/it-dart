-- CREATE OR REPLACE beim Hinzufuegen des `force`-Parameters hat keine echte
-- Ersetzung ausgeloest, sondern eine zweite, parallele Funktions-Ueberladung
-- erzeugt (alte 2-Parameter-Version blieb bestehen). Das machte RPC-Aufrufe
-- ohne `force` (z.B. den Herzschlag-Bootstrap) mehrdeutig. Alte Version
-- explizit entfernen, nur die neue (mit force) bleibt.
drop function if exists public.claim_session(uuid, integer);

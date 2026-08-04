-- Vorbereitung fuer eine kuenftige, noch nicht scharf geschaltete
-- Altersabfrage/Elternzustimmung bei der Registrierung (siehe
-- dokumentation/29_Anwalt_Pruefauftrag_Rechtstexte.docx, Punkt 6 "Kein
-- Alters-/Geburtsdatum-Feld"). Komplett inaktiv, solange
-- MINOR_CONSENT_ENABLED (src/lib/featureFlags.js) false ist -- erst nach
-- anwaltlicher Bestaetigung des Mechanismus scharf zu schalten.
--
-- Keine neue UPDATE-Policy fuer authenticated noetig: profiles hat bewusst
-- keine generelle Selbst-Update-Policy (siehe 20260719000000_init.sql).
-- Alle vier Spalten werden ausschliesslich von der parent-consent Edge
-- Function (Service-Role-Key, umgeht RLS) geschrieben -- sonst koennte ein
-- minderjaehriges Konto die Elternbestaetigung selbst vortaeuschen.
alter table public.profiles add column if not exists birthdate date;
alter table public.profiles add column if not exists parent_email text;
alter table public.profiles add column if not exists parent_consent_confirmed boolean not null default false;
alter table public.profiles add column if not exists parent_consent_token uuid;

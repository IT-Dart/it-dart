-- Audit-Befund M8 (2026-08-06), Entscheidung mit dem Nutzer am 2026-08-07:
-- agb_consent_given wurde bei der Selbstregistrierung direkt aus
-- raw_user_meta_data (`options.data` von signUp(), vollstaendig
-- client-steuerbar) uebernommen -- kein Rechteproblem (man setzt es nur
-- fuer sich selbst), aber entwertet den Datensatz als NACHWEIS der
-- Einwilligung, zusaetzlich fehlte ein Zeitstempel.
--
-- Ab jetzt: agb_consent_given wird bei JEDER Registrierung (Selbst- wie
-- Einladungs-Registrierung) mit false angelegt und ausschliesslich ueber
-- die bereits vorhandene, faelschungssichere RPC confirm_agb_consent()
-- (laeuft ueber auth.uid()) auf true gesetzt -- dieselbe Bestaetigung, die
-- eingeladene Nutzer schon heute ueber AgbConsentScreen.jsx durchlaufen.
-- Neue Spalte agb_consent_at liefert den fehlenden Nachweis-Zeitstempel.
--
-- Bestandsschutz (bewusste Entscheidung, keine Rueckwirkung): bestehende
-- Konten mit agb_consent_given=true aus der alten Metadaten-Uebernahme
-- bleiben unangetastet, agb_consent_at bleibt fuer sie NULL (kein
-- verlaesslicher historischer Zeitpunkt vorhanden) -- niemand wird zu einer
-- erneuten Bestaetigung gezwungen.

alter table public.profiles add column if not exists agb_consent_at timestamptz;

-- Spalten-Positivliste (K2, Migration 20260807000000): neue Spalte muss
-- explizit freigegeben werden, sonst "permission denied for column".
-- Nur SELECT, keine UPDATE-Freigabe -- Schreibzugriff ausschliesslich ueber
-- confirm_agb_consent() (SECURITY DEFINER), analog zu parent_consent_confirmed.
grant select (agb_consent_at) on public.profiles to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, agb_consent_given)
  values (new.id, new.email, false);
  return new;
end;
$$;

create or replace function public.confirm_agb_consent()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set agb_consent_given = true, agb_consent_at = now() where id = auth.uid();
end;
$$;

notify pgrst, 'reload schema';

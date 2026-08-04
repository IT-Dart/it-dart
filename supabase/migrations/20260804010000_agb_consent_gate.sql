-- Schliesst eine real gefundene Luecke (2026-08-04, dokumentation/
-- 29_Anwalt_Pruefauftrag_Rechtstexte.docx Abschnitt 6): per Einladungslink
-- registrierte Nutzer (Trainer-/Admin-Einladung) durchliefen nie die
-- Einwilligungs-Checkbox aus AuthScreen.jsx -- es gab fuer sie keinen
-- expliziten Zustimmungsmechanismus zu AGB/Datenschutzerklaerung. Nutzt
-- denselben, bereits beim Anwalt zur Pruefung liegenden Wortlaut, keine neue
-- Rechtstext-Formulierung -- daher sofort scharf geschaltet, kein Feature-Flag.
alter table public.profiles add column if not exists agb_consent_given boolean not null default false;

-- Bestandskonten koennen nicht rueckwirkend zur Zustimmung gezwungen werden,
-- ohne den laufenden Betrieb zu stoeren -- alle zum Zeitpunkt dieser Migration
-- bereits existierenden Zeilen gelten als abgedeckt (Bestandsschutz).
update public.profiles set agb_consent_given = true where created_at < now();

-- handle_new_user liest ab jetzt ein optionales agb_accepted-Flag aus den
-- Supabase-Auth-User-Metadaten (von AuthContext.jsx beim echten
-- Selbstregistrierungs-Formular gesetzt, wo die Checkbox bereits clientseitig
-- erzwungen wird). Per Einladung angelegte Konten (invite-user Edge Function)
-- setzen dieses Metadatenfeld nicht -- deren Zeile bleibt beim Spalten-Default
-- (false) und durchlaeuft dadurch den neuen Zustimmungs-Screen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, agb_consent_given)
  values (new.id, new.email, coalesce((new.raw_user_meta_data->>'agb_accepted')::boolean, false));
  return new;
end;
$$;

-- Wie bei clear_needs_password_setup: keine generelle UPDATE-Policy fuer
-- authenticated auf profiles -- ein Nutzer darf sein eigenes
-- agb_consent_given nur ueber diese eng gefasste Funktion setzen, nachdem er
-- dem im Gate-Screen angezeigten Text zugestimmt hat.
create or replace function public.confirm_agb_consent()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set agb_consent_given = true where id = auth.uid();
end;
$$;

grant execute on function public.confirm_agb_consent() to authenticated;

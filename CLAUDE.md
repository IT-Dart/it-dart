# IT-Dart – Bleib am Dart!

Webbasierte Lernplattform für die FISI-Ausbildung (Fachinformatiker für Systemintegration). Live unter www.it-dart.de.

## Tech-Stack

| Baustein | Technologie |
| --- | --- |
| Frontend | Vite + React (JSX), Single-Page-Application, **kein Router** |
| Styling | Reine Inline-Style-Objekte + zentrale Konstanten aus `src/lib/theme.js` (`C`, `pri`, `ghost`, `wrap`, `inner`, `ff`, `BP`, `fm`). **Kein Tailwind, kein CSS-Modul, kein styled-components.** |
| Backend | Supabase: Postgres + Row-Level-Security + Auth + Edge Functions (Deno) |
| Hosting | Vercel, automatisches Deployment bei Push auf `main` |
| PDF-Erzeugung | jsPDF, vollständig clientseitig |
| KI-Anbindung | Anthropic-API, ausschließlich über die Edge Function `ai-chat`, Schlüssel nie im Frontend |
| E-Mail-Versand | Eigenes SMTP (nicht der Supabase-Standard-Mailer — der hat ein hartes 2-E-Mails/Stunde-Limit) |

## Architektur-Konventionen

- Kein react-router. `view` ist ein einfacher String-State in `src/ITDart.jsx`; Screens werden über sequenzielle `if(view==="x")return <XScreen onClose={...}/>`-Early-Returns gerendert.
- Jeder Sub-Screen bekommt eine `onClose`-Prop, kein eigenes internes Routing.
- `useAuth()` (`src/lib/AuthContext.jsx`) liefert: `user, session, loading, isPremium, premiumUntil, isAdmin, isTrainer, isJuniorAdmin, recoveryMode, signIn, signUp, signOut, resetPassword, updatePassword`.
- **Bei mehreren Berechtigungsstufen für denselben Funktionsbereich: EIN gemeinsames Dashboard mit rollenbasiertem Ausgrauen bauen, keine separaten Screens pro Rolle.** Der Junior-Admin-Bereich wurde zunächst als eigener Screen gebaut und musste später komplett in `AdminScreen.jsx` zusammengeführt werden, weil zwei parallele Screens zu inkonsistent sichtbaren Buttons führten. Nicht wiederholen.
- Bestehende Komponenten und Muster erweitern statt parallele, ähnliche neu zu bauen — keine doppelten Implementierungen derselben Sache.
- Keine Refactorings oder Aufräumarbeiten außerhalb des eigentlichen Auftrags. Ein Bugfix bleibt ein Bugfix.

## Sicherheitsprinzipien (nicht verhandelbar)

- Row-Level-Security auf jeder Tabelle.
- Selbstreferenzierende Berechtigungsprüfungen über `SECURITY DEFINER`-Hilfsfunktionen kapseln (`is_admin_user()`, `is_trainer_user()`, `is_junior_admin_user()` etc.) — sonst „infinite recursion detected in policy".
- Eingeschränkte Rollen (z. B. Junior-Admin) schreiben **nur** über eng gefasste `SECURITY DEFINER`-Funktionen für einzelne Felder (z. B. `update_trainee_limit()`, `set_ai_enabled()`), nie über eine generelle UPDATE-Policy — sonst gibt es einen Weg, sich über denselben Kanal heimlich mehr Rechte zu verschaffen.
- Service-Role-Key ausschließlich in Edge Functions, nie im Frontend.
- CORS-Whitelisting je Edge Function über ein `ALLOWED_ORIGINS`-Set.
- **Geschütztes Hauptkonto:** `33271bc9-6b8a-456f-9cf1-a5c564218b07` (`coskunselimbulut@gmail.com`) ist gegen jede Löschung und — für Junior-Admins — gegen jede Veränderung abgesichert. Bei neuen Schreibpfaden, die eine niedriger-privilegierte Rolle betreffen, diesen Schutz von Anfang an mit einbauen (Edge Function **und** RLS-Policy/RPC), nicht nachträglich nur beim offensichtlichsten Pfad (Löschen) nachrüsten.
- Limit-Regeln (z. B. Trainer-Kontingent) zusätzlich per Datenbank-Trigger erzwingen, nicht nur im UI prüfen.
- Keine destruktiven Migrationen (`DROP`, `TRUNCATE`, unwiderrufliche Datenverluste) ohne ausdrückliche Anweisung des Nutzers.
- Bestehende RLS-Policies möglichst erweitern/ergänzen statt ersetzen, wenn eine Erweiterung reicht.
- Rollen/Berechtigungen nicht per Ad-hoc-Hardcode prüfen (z. B. kein `if(email==="...")` für Rechte-Logik) — **Ausnahme:** das bewusst dokumentierte PROTECTED_UID-Muster oben verwendet absichtlich eine feste UUID und ist davon ausgenommen.

## Deployment — was ein reiner `git push` NICHT auslöst

- **Migrationen** (`supabase/migrations/*.sql`) müssen im Supabase SQL-Editor manuell ausgeführt werden.
- **Edge Functions** (`supabase/functions/*/index.ts`) müssen im Supabase-Dashboard manuell neu deployed werden.
- **E-Mail-Templates** (`supabase/email-templates/*.html`) müssen im Supabase-Dashboard eingefügt werden.

Nach jeder Änderung an diesen drei Bereichen den Nutzer explizit auf die fällige manuelle Aktion hinweisen.

## Bekannte Stolperfallen (bereits gelöst — nicht wieder einführen)

- `auth.admin.deleteUser()` **immer** mit `shouldSoftDelete: false` aufrufen, sonst bleibt die `auth.users`-Zeile bestehen und blockiert eine erneute Einladung derselben E-Mail.
- Edge Functions haben kein `window.location` — `redirectTo` bei `inviteUserByEmail`/`generateLink` immer explizit setzen.
- `inviteUserByEmail()` auf eine bereits bestehende, unbestätigte Adresse kann ohne Fehler zurückkommen, ohne tatsächlich zu senden. „Erneut senden" (`trainer-manage-invite/index.ts`) läuft deshalb als Löschen + frisches Neu-Einladen; bestehende `trainer_trainees`-Zuordnungen werden dabei auf die neue Konto-ID übertragen.
- Postgres-Fehlercodes (`23505` Eindeutigkeitsverletzung, `42501` RLS-Verstoß, ...) im Frontend immer auf verständliche Meldungen abbilden, nie roh durchreichen.
- Ein Einladungs-Link löst kein eigenes Auth-Event aus — `type=invite` steckt im URL-Hash-Fragment und muss in `AuthContext.jsx` **vor** Supabases eigener Session-Erkennung ausgelesen werden.
- `python-docx`s namensbasierte Style-Auflösung (`add_heading(..., level=1)`, `style="Heading 1"`) kann bei manchen `.docx`-Dateien einen falschen `KeyError` werfen, obwohl der Style existiert — Workaround: Style-Objekt über `style_id` statt über den Namen auflösen.

## UI-Konventionen

- Keine neuen UI-/Komponentenbibliotheken einführen (siehe auch „kein Tailwind" oben).
- Einheitliche, bestehende Stil-Objekte aus `theme.js` verwenden statt neue Farb-/Abstandswerte zu erfinden.
- **Ziel, noch nicht überall umgesetzt:** Mobile-first/responsives Verhalten und Barrierefreiheit bei neuen Screens mitdenken. Das ist ein Anspruch für neue Arbeit, keine Behauptung, dass bestehende Screens das schon konsequent einhalten — bisher wurden keine bewussten Breakpoints oder ARIA-Attribute im Code beobachtet.

## Datenmodell — `profiles` (relevante Spalten)

`id, email, is_admin, is_junior_admin, is_trainer, trainee_limit, is_premium, premium_until, ai_enabled, confirmed_at, created_at`

Kein `premium_tier`-Enum, kein `trainer_quota`, kein `ai_access_enabled` — diese Namen tauchten in einem Entwurf auf, sind aber falsch. Bei SQL-Referenzen/Migrationen immer gegen `supabase/migrations/*.sql` verifizieren statt aus dem Gedächtnis zu raten.

## Code-Stil / Token-Effizienz

- Dichte, kompakte Komponenten nach bestehendem Vorbild (`AdminScreen.jsx`, `TrainerScreen.jsx`) — keine neuen Abstraktionsschichten für einmalige Verwendung.
- Vor dem Editieren gezielt lesen (Grep/gezielter Read-Ausschnitt), nicht wiederholt ganze große Dateien neu laden.
- Rückfragen bündeln statt einzeln nachzufragen.
- Nur explizit angefragte Dateien committen. `dokumentation/` (Word/PDF-Geschäftsdokumente) ist bewusst nicht in Git — nicht ungefragt hinzufügen. `supabase/email-templates/invite.html` hat oft einen unabhängigen, gerade in Bearbeitung befindlichen Stand — nicht ungefragt mitcommitten.
- Kleine, nachvollziehbare Commits; keine unbenutzten Imports oder verwaisten Dateien hinterlassen.
- Das Frontend ist reines JSX **ohne Typsystem** — keine TypeScript-Typen ins Frontend einführen. Nur die Edge Functions (`supabase/functions/*/index.ts`) sind TypeScript (Deno); dort vorhandene Typisierung beibehalten und sinnvoll erweitern.

## KI-Verhalten

Bei größeren oder unklaren Änderungen zuerst analysieren, dann implementieren:
1. Architektur/betroffenen Code verstehen.
2. Betroffene Dateien identifizieren.
3. Kurzen Plan formulieren (bei Unklarheit: nachfragen, gebündelt statt einzeln).
4. Erst dann Änderungen vornehmen.

## Referenzen

- Support-Kontakt: `kontakt@it-dart.de`
- `dokumentation/` enthält nummerierte Word/PDF-Geschäftsdokumente (01 Lastenheft, 05 Sicherheitskonzept, 09 Datenschutz, 13 SQL-Notfallreferenz, ...) — bei sicherheits- oder rollenrelevanten Features dort ggf. mit aktualisieren, gleiche Nummerierung fortführen.

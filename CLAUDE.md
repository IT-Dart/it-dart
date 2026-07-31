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
- Jede neue `SECURITY DEFINER`-Funktion braucht `SET search_path = public` (Schutz vor Search-Path-Hijacking) — beim Sicherheitsaudit 2026-07-28 fehlte das bei drei bestehenden Funktionen, per `ALTER FUNCTION ... SET search_path = public` nachgerüstet. Neue Funktionen von Anfang an mit dieser Klausel anlegen.
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
- OpenArt-Bildmodelle befolgen explizite "kein Text"-Anweisungen im Prompt unzuverlässig (bei Tests ca. 25-75% Verstoßrate je nach Modell) — jedes generierte Bild visuell prüfen, nicht dem Prompt vertrauen. Feststehende Fachkürzel (DHCP, VPN, DNS) sind eine vertretbare Ausnahme.
- Beim Herunterladen mehrerer Bilder aus einer OpenArt-Batch-Antwort jedes `url`-Feld einzeln zuordnen, nicht mit `thumbnailUrl`-Fragmenten vermischen — sonst entstehen wenige-Byte-große, korrupte Dateien (Dateigröße nach jedem Download prüfen).
- „Centered single-icon composition" steuert nicht zuverlässig den Füllgrad des Icons relativ zur Leinwand — bei 8 identisch prompt-strukturierten Modul-Icons (IT-Dart-Troubleshooter, 2026-07-27) schwankte der gemessene Füllgrad zwischen 24 % und 73 %, alle mussten nachträglich manuell zugeschnitten werden. Bei Icon-/Einzelobjekt-Prompts zusätzlich einen expliziten Füllgrad fordern, z. B. „the icon shape must occupy at least 55-65% of the image's width and height, not appear as a small object surrounded by large empty background".
- „Centered" heißt auch nicht zuverlässig tatsächlich zentriert (IT-Dart-Logo-Generierung, 2026-07-27): zwei Kandidaten waren trotz „centered"-Anweisung sichtbar Richtung Rand verschoben bzw. überragten die Rahmen-Silhouette. Zusätzlich eine explizite Geometrie-Vorgabe ergänzen: „perfectly centered, equal margin on all four sides, not shifted toward any edge; no element may extend past the shape/canvas boundary" — eine Neugenerierung mit dieser Ergänzung behob beide Fälle.
- CSP `connect-src` mit `https://*.supabase.co` deckt **nicht** automatisch die `wss://`-WebSocket-Verbindung für Supabase Realtime ab — Chrome toleriert das stillschweigend, Firefox blockiert strikt nach Schema und lädt die Seite dann gar nicht mehr. `wss://*.supabase.co` in `vercel.json` immer explizit mit angeben, sobald irgendwo Realtime/`postgres_changes` verwendet wird.
- Ein periodischer Herzschlag (z. B. Sitzungs-Kick-out), der direkt nach einem `claim`/`insert` synchron mitfeuert, kann den eigenen, noch laufenden Schreibvorgang überholen und fälschlich als "abgemeldet"/"ungültig" interpretieren — der erste echte Poll darf erst starten, nachdem der auslösende Schreibvorgang nachweislich abgeschlossen ist (awaiten, nicht nur zeitlich hoffen).

## KI-Bildgenerierung (OpenArt)

- **Kommerzielle Nutzungsrechte seit 2026-07-25 geklärt — aber NICHT rückwirkend:** Account läuft auf **Advanced-Plan** (12.000 Credits/Monat). OpenArt-Support hat schriftlich bestätigt, dass kommerzielle Rechte an Bildern/Videos, die **während eines aktiven, kommerziell-berechtigten Abos** erzeugt wurden, auch nach Kündigung/Downgrade bestehen bleiben. Das gilt nur für Generierungen ab dem Advanced-Upgrade — Essential hatte nie kommerzielle Rechte, ein späteres Upgrade heilt das nicht rückwirkend. Bei jedem Bild vor der Verwendung prüfen, unter welchem Plan es erzeugt wurde. Details: `dokumentation/16_OpenArt_Lizenz_und_Datenschutz_Referenz.docx`.
- **Alle 9 Bilder in `src/assets/` (cover.jpg + 8 Modul-Cover) wurden 2026-07-25 unter dem Advanced-Plan neu generiert**, zur Sicherheit — 7 davon hatten zuvor ungeklärte Erzeugungs-Historie. Bei zusätzlichen künftigen Bildern in `src/assets/` immer das Erzeugungsdatum/den damals aktiven Plan im `GENERATION_LOG.md` nachschlagen, nicht annehmen.
- KI-generierte Bilder dürfen keine echten Marken-Logos/Maskottchen abbilden (z. B. Windows-Logo, OS-Maskottchen) — das ist ein vom OpenArt-Lizenzrecht unabhängiges Markenrecht-Risiko. Bei Prompts für Betriebssystem-/Software-Icons immer abstrakte, generische Symbole anfordern, keine Anlehnung an reale Logos.
- Vollständiger Generierungs-Workflow (gebündelte Freigaben, Bewertungs-/Auswahlsystem, Kreditbudget, Prompt-Architekt-Rolle): `dokumentation/17_OpenArt_Nutzungsrichtlinie_Umsetzung.docx`, im Claude-Gedächtnis als `feedback_openart_generation_protocol` hinterlegt.
- Alle Generierungen (auch verworfene Testkandidaten) landen zuerst in `src/assets/generated/` mit fortlaufendem `GENERATION_LOG.md`; erst nach expliziter Freigabe Übernahme nach `src/assets/` mit gleichem Sichtbarkeitsschutz wie die übrigen Modul-Cover (`user&&<img/>`, nicht für anonyme Besucher).

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

**Compliance-Prüfung:** Berührt eine neue Funktion eine dieser Kategorien — neue Datenerhebung, KI-/Chat-Funktionen, potenziell minderjährige Nutzer, Bild-/Content-Lizenzfragen, Konten/Rollen/Zahlungen — zuerst den Prüfkatalog in [COMPLIANCE.md](COMPLIANCE.md) durchgehen und Befunde benennen, bevor implementiert wird. Bei KI-/Chat-Funktionen zusätzlich [KI-RICHTLINIEN.md](KI-RICHTLINIEN.md) konsultieren (Datenschutz/Jugendschutz/AGG-Prinzipien speziell für KI, inkl. Tabelle aller KI-Einsatzorte — bei neuer KI-Funktion dort ergänzen). Beide Dokumente ersetzen keine anwaltliche Prüfung, bereiten sie nur vor.

## Arbeitsteilung bei mehreren gleichzeitigen Claude-Code-Sessions

Reale Erfahrung 2026-07-25: Zwei gleichzeitige Sessions haben dieselben zwei `dokumentation/*.docx`-Dateien bearbeitet — eine Session behauptete danach im Gedächtnis, eine Korrektur sei bereits erfolgt, was sich beim tatsächlichen Nachlesen der Dateien als falsch herausstellte (ein ganzer Absatz war spurlos verschwunden). Deshalb gilt:

- **Zonen-Trennung (verbindliche Regel, gilt nur für die konkret so benannte Chat-Sitzung, nicht automatisch für jede Sitzung in diesem Repo):** Die Chat-Sitzung **"IT-Dart-Media Tool"** (OpenArt-Bildgenerierung) schreibt **ausschließlich** in `src/assets/generated/`, `GENERATION_LOG.md`, `dokumentation/16_*`/`17_*.docx` und die OpenArt-Gedächtnisdateien — niemals in `src/assets/*.jpg` (Produktions-Bilder), niemals in `src/ITDart.jsx` oder andere App-Quelldateien, keine Commits. Die separate Chat-Sitzung **"IT-Dart-Integrator"** übernimmt Einbindung/Code/Commits exklusiv — für sie gilt die Schreibsperre ausdrücklich NICHT. Da beide Sitzungen dasselbe Projekt-Gedächtnis teilen, muss beim Lesen dieser Regel immer klar sein, welche der beiden Rollen die aktuelle Sitzung gerade hat.
- **Vor jedem Schreiben in eine geteilte Datei: frisch einlesen**, nie auf einen älteren Gesprächsstand verlassen — eine andere Session könnte sie zwischenzeitlich geändert haben.
- **Nach jedem Schreiben in eine geteilte Datei (v. a. nach einem Hintergrund-Agenten): tatsächlich zurücklesen und verifizieren**, nie einem Selbstbericht (Agent-Zusammenfassung, Gedächtnis-Notiz einer anderen Session) blind vertrauen.
- Bei `.docx`-Bearbeitung `python-docx` statt rohem XML-Unzip/Edit/Rezip verwenden — deutlich weniger fehleranfällig bei möglichen Parallel-Zugriffen.
- Bei Verdacht auf einen Konflikt: nicht zurücksetzen/neu anfangen, sondern den tatsächlichen Ist-Zustand lesen, die genaue Lücke identifizieren, gezielt reparieren, dann normal weiterarbeiten.

Details: [[feedback_multi_agent_coordination_protocol]] und [[project_content_producer_integrator_split]] im Claude-Gedächtnis.

## Projekt-Status-Datei

[PROJEKT-STATUS.md](PROJEKT-STATUS.md) ist die kompakte Orientierungsdatei für jede neue Sitzung (eigene oder andere) — max. ~10 Zeilen: was fertig ist, was offen ist, was zuletzt geändert wurde. **Am Ende jeder Session mit sichtbarem Fortschritt aktualisieren** (nicht bei reinen Lese-/Rückfragen), damit eine frisch gestartete Sitzung sofort den Stand kennt, ohne erst Git-Log/Todos/GO_LIVE.md durchsuchen zu müssen. Kurz halten — Details gehören weiter in GO_LIVE.md, COMPLIANCE.md, die `todos`-Tabelle oder das Claude-Gedächtnis, nicht hierher.

## Referenzen

- Support-Kontakt: `kontakt@it-dart.de`
- `dokumentation/` enthält nummerierte Word/PDF-Geschäftsdokumente (01 Lastenheft, 05 Sicherheitskonzept, 09 Datenschutz, 13 SQL-Notfallreferenz, ...) — bei sicherheits- oder rollenrelevanten Features dort ggf. mit aktualisieren, gleiche Nummerierung fortführen.

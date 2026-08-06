# IT-Dart — Compliance-Prüfkatalog

**Kein Ersatz für anwaltliche Prüfung.** Dieser Katalog stellt ausschließlich sicher, dass alle technisch und organisatorisch möglichen Maßnahmen umgesetzt sind, *bevor* eine juristische Fachprüfung erfolgt. Jeder Punkt unten ist eine objektiv nachprüfbare Tatsache (Code/Konfiguration), keine juristische Bewertung. Ziel: „Alle technisch/organisatorisch möglichen Maßnahmen sind umgesetzt — die verbleibende Prüfung ist ausschließlich juristisch."

**Verantwortlich:** Coşkun Bulut, dokumentiert als Compliance-Verantwortlicher in `dokumentation/09_Datenschutz_Referenzdokument.docx` (keine gesetzliche DPO-Pflicht bei aktueller Unternehmensgröße, siehe dort). **Pflege-Rhythmus:** siehe `CLAUDE.md` „KI-Verhalten" — ereignisgetrieben bei jeder neuen Funktion in einer der Kategorien unten, zusätzlich mindestens wöchentlich ein voller Gegencheck gegen den echten Code-Stand.

## Wann dieser Katalog durchzugehen ist

Bevor eine neue Funktion umgesetzt wird, die eine dieser Kategorien berührt (erweitert die bestehende „KI-Verhalten"-Regel in `CLAUDE.md`):

- Neue Erhebung personenbezogener Daten
- KI-/Chat-Funktionen
- Minderjährige potenziell betroffen
- Bilder/Content mit Lizenz- oder Urheberrechtsfragen
- Konten, Rollen oder Zahlungen

→ Prüfkatalog durchgehen, Befunde benennen, **erst dann** umsetzen.

## Prüfkatalog (Stand 2026-08-05, verifiziert per Codeprüfung)

### Datenschutz-technisch

| Punkt | Status | Beleg |
|---|---|---|
| RLS auf allen Tabellen aktiv | ✅ Ja | `CLAUDE.md` Sicherheitsprinzipien, Migrationen geprüft |
| Kein Service-Role-Key im Frontend | ✅ Ja | `grep -rl SERVICE_ROLE src/` → keine Treffer |
| Eigenständiger Lösch-Pfad für Nutzerdaten | ✅ Ja | `DeleteAccountScreen.jsx` + `delete-account` Edge Function |
| Einwilligungs-Checkbox bei Registrierung (AGB/Datenschutz) | ✅ Ja | `AuthScreen.jsx` (Selbstregistrierung, Pflichtfeld, 2026-07-26) **und** `AgbConsentScreen.jsx` (per Einladungslink registrierte Nutzer, nachgerüstet 2026-08-04 — diese Lücke war bis dahin real offen, siehe `dokumentation/29_...`) — E2E-verifiziert, 22/22 grün |
| Eigenständiges AGB/Nutzungsbedingungen-Dokument | ✅ Ja | `LegalPages.jsx` exportiert jetzt auch `AGB` (2026-07-26) |
| Self-Service-Datenexport (Art. 20 DSGVO, Datenübertragbarkeit) | ✅ Ja | `src/lib/dataExport.js` + `StatistikScreen.jsx`, JSON+CSV-Download, kein Premium-Feature (2026-08-03) |

**Zwischenstand: 6/6**

### Sicherheit

| Punkt | Status | Beleg |
|---|---|---|
| `SECURITY DEFINER`-Funktionen mit `search_path`-Härtung | ✅ Ja | `is_admin_user()`/`is_junior_admin_user()` setzen `set search_path = public` |
| Geschütztes Hauptkonto in allen Schreibpfaden abgesichert | ✅ Ja | 4 Fundstellen (`admin-delete-user`, `delete-account`, `trainer-manage-invite`, Migration) |
| CORS/Shared-Secret korrekt je Edge Function | ✅ Ja | 7/9 mit `ALLOWED_ORIGINS`, die übrigen 2 begründet per Shared-Secret (CI/Webhook, kein Browser-Origin) |
| Unit-Tests für sicherheitsrelevante Kernlogik (PDF/Report-Erzeugung) | ✅ Ja | Vitest hinzugefügt (`npm test`), 16 Tests über `lernnachweis.js` (Zonen-/Winkel-/Farb-Logik, echte Log-Berechnung), `websiteCheckReport.js` und `e2eReport.js` (Fehlertoleranz bei fehlenden/fehlgeformten Report-Daten) — 2026-07-27 |
| Automatisierte Abhängigkeits-Sicherheitsüberwachung | ✅ Ja | GitHub Dependabot Vulnerability Alerts + Automated Security Fixes aktiviert, `.github/dependabot.yml` für wöchentliche Versions-PRs (npm + GitHub Actions) — 2026-08-03 |
| CSP-Verstoßmeldungen (blockierte Fremdinhalte) sichtbar statt nur clientseitig verworfen | ✅ Ja | `csp-report` Edge Function + `csp_reports`-Tabelle (RLS: nur Admin liest), `vercel.json` `report-to`/`report-uri`, Panel in `MonitoringScreen.jsx`, Ende-zu-Ende live getestet — 2026-08-03 |
| Protokoll für Rechte-/Rollenänderungen und Kontolöschungen | ✅ Ja | `admin_action_log`-Tabelle + DB-Trigger auf `profiles` (erfasst jeden Schreibpfad automatisch, nicht nur einzeln instrumentierte Stellen), `AuditLogScreen.jsx` — 2026-08-05. Bekannte Grenze: Akteur ist nur bekannt, wenn die Änderung mit einer angemeldeten Sitzung lief, nicht bei rein service-seitigen Vorgängen (z. B. `admin-delete-user`) — das WAS wird trotzdem immer erfasst. |

**Zwischenstand: 7/7**

### Jugendschutz

| Punkt | Status | Beleg |
|---|---|---|
| Altersfeld/Minderjährigen-Erkennung bei Registrierung | ✅ Ja | Geburtsdatum + Eltern-E-Mail-Doppel-Opt-In vollständig implementiert (`BirthdateSetupScreen.jsx`, `ParentConsentConfirmScreen.jsx`, Edge Function `parent-consent`, 2026-08-04) — seit 2026-08-06 scharf geschaltet (`MINOR_CONSENT_ENABLED=true`). Zusätzlich Schutz gegen den naheliegendsten Umgehungsfall ergänzt: `parent-consent` lehnt eine Eltern-E-Mail ab, die mit der eigenen Konto-E-Mail identisch ist. Rechtstexte (Wortlaut der Bestätigungs-Mail) bleiben Platzhalter bis zur anwaltlichen Prüfung, siehe Punkt 12 unten. |
| Explizite Datenschutz-Passage zu (potenziell minderjährigen) Azubis | ✅ Ja | `Datenschutz`, Abschnitt 8 "Minderjährige Nutzer" (2026-07-26, in-Browser verifiziert) |
| Begrenzung der KI-Chat-Nutzung (reduziert Missbrauchs-/Abhängigkeitsrisiko) | ✅ Ja | `CHAT_MAX_QUESTIONS`-Limit vorhanden |
| Explizite KI-Offenlegung bei Sitzungsstart (Anthropic-Nutzungsrichtlinie) | ✅ Ja | `AIDisclosure` in `AIChat.jsx` (KI-Lernassistent, Mock-Interview, Diagnose) + Hinweiszeile in `Pruefung.jsx` (Auswertung), 2026-08-06 — siehe `KI-RICHTLINIEN.md` |

**Zwischenstand: 4/4**

### Content/Lizenzen

| Punkt | Status | Beleg |
|---|---|---|
| Alle produktiv genutzten KI-Bilder mit geklärter kommerzieller Lizenz | ✅ Ja | OpenArt Advanced-Plan bestätigt (`openart_account_get`), alle 9 Bilder 2026-07-25 sicherheitshalber neu generiert |
| Keine echten Marken-Logos/Maskottchen in KI-generierten Bildern | ✅ Ja | Bereits einmal korrigiert (`module-b.jpg`), seither Prompt-Regel dokumentiert |

**Zwischenstand: 2/2**

### Marken-/Urheberrecht

| Punkt | Status | Beleg |
|---|---|---|
| Kein vorzeitiger `®`-Gebrauch (Marke „IT-Dart" ist beim DPMA angemeldet, noch nicht eingetragen) | ✅ Ja | `grep -rn "®|™|©" src/` → keine Treffer im gesamten Code (2026-07-26 geprüft) |
| Copyright-Hinweis (`©`) im Footer/Impressum vorhanden | ✅ Ja | **behoben 2026-07-26** — Footer (`CompanyScreen.jsx`, `ITDart.jsx`) + eigener Abschnitt in `Impressum`, in-Browser verifiziert |
| Markenklassen-Abdeckung für „IT-Dart-Kids" (andere Nizza-Klasse als Software/Bildungsdienstleistung?) geklärt | ❌ Nein | Reine Sachfrage der DPMA-Anmeldung — nur durch die anmeldende Person/Fachperson zu klären, nicht durch Code-Prüfung |

**Zwischenstand: 2/3**

## Gesamt-Score (rein faktenbasiert, kein Rechtsurteil)

**21 / 22 erfüllt ≈ 95 %** (Stand 2026-08-06, neu: Minderjährigen-Erkennung live geschaltet inkl. Umgehungsschutz gegen die eigene E-Mail als Eltern-E-Mail, explizite KI-Offenlegung bei Sitzungsstart als neuer Prüfpunkt ergänzt — beides schließt eigenständige Anthropic-Nutzungsrichtlinien-Pflichten, siehe `KI-RICHTLINIEN.md`. Punkt 12 (Geschäftsfähigkeit 16/17-Jähriger) bleibt offen, wartet auf anwaltliche Prüfung)

Dieser Score ist ein internes Diagnose-Werkzeug. **Er wird nicht extern gegenüber Partnern, Schulen oder Ausbildungsbetrieben als Compliance-Nachweis verwendet** — eine unabhängig geprüfte Aussage wäre etwas anderes als eine selbst erhobene technische Checkliste.

## Konkrete offene Punkte (priorisiert)

1. ~~Einwilligungs-Checkbox bei Registrierung fehlt~~ — **behoben 2026-07-26**, siehe `AuthScreen.jsx`.
2. ~~Kein AGB/Nutzungsbedingungen-Dokument~~ — **behoben 2026-07-26**, siehe `LegalPages.jsx`, Export `AGB`.
3. ~~Keine Minderjährigen-spezifische Passage~~ — **behoben 2026-07-26**, siehe `Datenschutz`, Abschnitt 8.
4. ~~Keine Unit-Tests~~ — **behoben 2026-07-27**, Vitest + 16 Tests über alle drei Dateien, siehe `src/lib/__tests__/`.
5. ~~Kein Copyright-Hinweis (`©`)~~ — **behoben 2026-07-26**, siehe Footer + `Impressum`.
6. **Markenklassen-Frage für „IT-Dart-Kids"** — ob eine „IT-Dart"-Eintragung die Nutzung für Druckerzeugnisse/Malbücher mitabdeckt, ist offen und nur durch die anmeldende Person/Fachperson zu klären, nicht durch uns.
7. ~~Kein Self-Service-Datenexport~~ — **behoben 2026-08-03**, siehe `src/lib/dataExport.js`, Button in `StatistikScreen.jsx`.
8. ~~Keine automatisierte Abhängigkeits-/CSP-Überwachung~~ — **behoben 2026-08-03**, siehe Dependabot + `csp-report` Edge Function oben.
9. ~~Fehlender Zustimmungsmechanismus für Einladungslink-Registrierung~~ — **behoben 2026-08-04**, siehe `AgbConsentScreen.jsx`.
10. ~~Kein Protokoll für Rechte-/Rollenänderungen und Kontolöschungen~~ — **behoben 2026-08-05**, siehe `admin_action_log` + `AuditLogScreen.jsx`.
11. ~~Minderjährigen-Erkennung technisch fertig, aber inaktiv~~ — **live geschaltet 2026-08-06** (`MINOR_CONSENT_ENABLED=true`), siehe Jugendschutz-Tabelle oben. Rechtstexte (Wortlaut) bleiben Platzhalter bis zur anwaltlichen Prüfung.
12. **DSGVO-Einwilligungsalter ≠ Vertrags-Geschäftsfähigkeit:** Die gebaute Altersabfrage prüft ausschließlich Art. 8 DSGVO (`MIN_CONSENT_AGE = 16` in `supabase/functions/parent-consent/index.ts`) — ein 16- oder 17-Jähriger durchläuft sie ohne Eltern-Schritt (jetzt real wirksam, siehe Punkt 11). Für ein **laufendes, kostenpflichtiges Premium-Abo** ist das vermutlich nicht ausreichend: volle Geschäftsfähigkeit nach BGB liegt erst bei 18 (§ 106 ff. BGB), der Taschengeldparagraph (§ 110 BGB) deckt nur sofort vollständig aus eigenen Mitteln bezahlte Einmalkäufe ab, kein Abo. **Korrektur 2026-08-06 (zweite Korrektur):** Die bisherige Einschätzung „entschärft durch ausschließlich einladungsbasierte Registrierung" war **falsch** — per Codeprüfung verifiziert: `AuthContext.jsx`/`AuthScreen.jsx` erlauben offenes Self-Service-`signUp()` ohne Invite-Token, keine Registrierungssperre. Der Punkt war also nie durch fehlenden Self-Service entschärft. Aktuell entschärft ist nur die **Zahlungsseite**: Premium wird weiterhin ausschließlich manuell vergeben, kein Stripe/Checkout im Code (verifiziert, 0 Treffer für „checkout"/„stripe"/„paypal" in `src/`) — das eigentliche Vertragsschluss-Risiko (Kontoerstellung + AGB-Zustimmung selbst) besteht aber unabhängig davon bereits jetzt für 16-/17-Jährige. War bereits seit 2026-08-04 ausführlich in `dokumentation/29_Anwalt_Pruefauftrag_Rechtstexte.docx`, Abschnitt 6, dokumentiert. Ist Teil des bereits an die anwaltliche Prüfung übersandten Materials.
13. **Widerrufsbelehrung/Kündigungsbutton fehlen im Live-Code:** Weder `dokumentation/38_Rechtstext_AGB.docx` noch der Live-Code (`LegalPages.jsx`) enthalten Widerruf/Rücktritt/Fernabsatz (Volltextsuche, 0 Treffer) — konsistent damit, dass Stripe noch nicht live ist. **Korrektur 2026-08-06:** Bei erster Prüfung fälschlich als neuer Fund eingetragen — `dokumentation/29_Anwalt_Pruefauftrag_Rechtstexte.docx`, Abschnitt 6 ("Fehlende Abo-/Widerrufsregelungen für ein zukünftiges automatisiertes Premium-Abo") deckt das bereits seit 2026-08-04 deutlich umfassender ab: § 355 BGB (Widerrufsbelehrung), § 312k BGB (Kündigungsbutton), **§ 356a BGB (eigenständiger Widerrufs-Button, seit 19.06.2026 Pflicht)**, zwei Modellvarianten (A/B) zur Sofortstart-Regelung, § 309 Nr. 9 BGB (Vertragslaufzeit/automatische Verlängerung). Ist Teil des bereits an die anwaltliche Prüfung übersandten Materials — vor dem Live-Gang von Stripe (#43) muss die tatsächliche Umsetzung im Code noch erfolgen, sobald die anwaltliche Einordnung vorliegt.

**Ergänzung 2026-08-06:** `dokumentation/44_Umsetzungskonzept_Minderjaehrige_Widerrufsrecht.pdf` liefert für Punkt 12+13 einen konkreten, fachlich sauberen Umsetzungsvorschlag (Alters-Staffel-Flow, Eltern-Doppel-Opt-in, Checkout-Checkboxen nach §§ 356/357a/312j/312k BGB) — als Diskussionsgrundlage für die anwaltliche Prüfung gedacht, ersetzt sie nicht.

Die Texte zu Punkt 1–3 (AGB, Minderjährigen-Passage) sind erste Entwürfe. **Vor einem tatsächlichen Verlassen darauf sollte weiterhin eine echte anwaltliche Prüfung erfolgen** (Formulierung, Rechtsgrundlage im Detail) — dieser Katalog bereitet das vor, ersetzt es nicht.

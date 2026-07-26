# IT-Dart — Compliance-Prüfkatalog

**Kein Ersatz für anwaltliche Prüfung.** Dieser Katalog stellt ausschließlich sicher, dass alle technisch und organisatorisch möglichen Maßnahmen umgesetzt sind, *bevor* eine juristische Fachprüfung erfolgt. Jeder Punkt unten ist eine objektiv nachprüfbare Tatsache (Code/Konfiguration), keine juristische Bewertung. Ziel: „Alle technisch/organisatorisch möglichen Maßnahmen sind umgesetzt — die verbleibende Prüfung ist ausschließlich juristisch."

## Wann dieser Katalog durchzugehen ist

Bevor eine neue Funktion umgesetzt wird, die eine dieser Kategorien berührt (erweitert die bestehende „KI-Verhalten"-Regel in `CLAUDE.md`):

- Neue Erhebung personenbezogener Daten
- KI-/Chat-Funktionen
- Minderjährige potenziell betroffen
- Bilder/Content mit Lizenz- oder Urheberrechtsfragen
- Konten, Rollen oder Zahlungen

→ Prüfkatalog durchgehen, Befunde benennen, **erst dann** umsetzen.

## Prüfkatalog (Stand 2026-07-26, verifiziert per Codeprüfung)

### Datenschutz-technisch

| Punkt | Status | Beleg |
|---|---|---|
| RLS auf allen Tabellen aktiv | ✅ Ja | `CLAUDE.md` Sicherheitsprinzipien, Migrationen geprüft |
| Kein Service-Role-Key im Frontend | ✅ Ja | `grep -rl SERVICE_ROLE src/` → keine Treffer |
| Eigenständiger Lösch-Pfad für Nutzerdaten | ✅ Ja | `DeleteAccountScreen.jsx` + `delete-account` Edge Function |
| Einwilligungs-Checkbox bei Registrierung (AGB/Datenschutz) | ✅ Ja | `AuthScreen.jsx`, Pflichtfeld, blockiert Absenden bis angehakt (2026-07-26, in-Browser verifiziert) |
| Eigenständiges AGB/Nutzungsbedingungen-Dokument | ✅ Ja | `LegalPages.jsx` exportiert jetzt auch `AGB` (2026-07-26) |

**Zwischenstand: 5/5**

### Sicherheit

| Punkt | Status | Beleg |
|---|---|---|
| `SECURITY DEFINER`-Funktionen mit `search_path`-Härtung | ✅ Ja | `is_admin_user()`/`is_junior_admin_user()` setzen `set search_path = public` |
| Geschütztes Hauptkonto in allen Schreibpfaden abgesichert | ✅ Ja | 4 Fundstellen (`admin-delete-user`, `delete-account`, `trainer-manage-invite`, Migration) |
| CORS/Shared-Secret korrekt je Edge Function | ✅ Ja | 7/9 mit `ALLOWED_ORIGINS`, die übrigen 2 begründet per Shared-Secret (CI/Webhook, kein Browser-Origin) |
| Unit-Tests für sicherheitsrelevante Kernlogik (PDF/Report-Erzeugung) | ✅ Ja | Vitest hinzugefügt (`npm test`), 16 Tests über `lernnachweis.js` (Zonen-/Winkel-/Farb-Logik, echte Log-Berechnung), `websiteCheckReport.js` und `e2eReport.js` (Fehlertoleranz bei fehlenden/fehlgeformten Report-Daten) — 2026-07-27 |

**Zwischenstand: 4/4**

### Jugendschutz

| Punkt | Status | Beleg |
|---|---|---|
| Altersfeld/Minderjährigen-Erkennung bei Registrierung | ❌ Nein | `AuthScreen.jsx` fragt kein Alter/Geburtsdatum ab (bewusst — Datenminimierung, nicht nachgerüstet) |
| Explizite Datenschutz-Passage zu (potenziell minderjährigen) Azubis | ✅ Ja | `Datenschutz`, Abschnitt 8 "Minderjährige Nutzer" (2026-07-26, in-Browser verifiziert) |
| Begrenzung der KI-Chat-Nutzung (reduziert Missbrauchs-/Abhängigkeitsrisiko) | ✅ Ja | `CHAT_MAX_QUESTIONS`-Limit vorhanden |

**Zwischenstand: 2/3**

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

**15 / 17 erfüllt ≈ 88 %** (Stand 2026-07-27, nach Behebung der Punkte 1–3, 4 und 5 unten)

Dieser Score ist ein internes Diagnose-Werkzeug. **Er wird nicht extern gegenüber Partnern, Schulen oder Ausbildungsbetrieben als Compliance-Nachweis verwendet** — eine unabhängig geprüfte Aussage wäre etwas anderes als eine selbst erhobene technische Checkliste.

## Konkrete offene Punkte (priorisiert)

1. ~~Einwilligungs-Checkbox bei Registrierung fehlt~~ — **behoben 2026-07-26**, siehe `AuthScreen.jsx`.
2. ~~Kein AGB/Nutzungsbedingungen-Dokument~~ — **behoben 2026-07-26**, siehe `LegalPages.jsx`, Export `AGB`.
3. ~~Keine Minderjährigen-spezifische Passage~~ — **behoben 2026-07-26**, siehe `Datenschutz`, Abschnitt 8.
4. ~~Keine Unit-Tests~~ — **behoben 2026-07-27**, Vitest + 16 Tests über alle drei Dateien, siehe `src/lib/__tests__/`.
5. ~~Kein Copyright-Hinweis (`©`)~~ — **behoben 2026-07-26**, siehe Footer + `Impressum`.
6. **Markenklassen-Frage für „IT-Dart-Kids"** — ob eine „IT-Dart"-Eintragung die Nutzung für Druckerzeugnisse/Malbücher mitabdeckt, ist offen und nur durch die anmeldende Person/Fachperson zu klären, nicht durch uns.

Die Texte zu Punkt 1–3 (AGB, Minderjährigen-Passage) sind erste Entwürfe. **Vor einem tatsächlichen Verlassen darauf sollte weiterhin eine echte anwaltliche Prüfung erfolgen** (Formulierung, Rechtsgrundlage im Detail) — dieser Katalog bereitet das vor, ersetzt es nicht.

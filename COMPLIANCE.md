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
| Einwilligungs-Checkbox bei Registrierung (AGB/Datenschutz) | ❌ Nein | `AuthScreen.jsx` — Registrierungsformular hat keine Checkbox |
| Eigenständiges AGB/Nutzungsbedingungen-Dokument | ❌ Nein | `LegalPages.jsx` exportiert nur `Impressum`, `Datenschutz`, `Leistungen` |

**Zwischenstand: 3/5**

### Sicherheit

| Punkt | Status | Beleg |
|---|---|---|
| `SECURITY DEFINER`-Funktionen mit `search_path`-Härtung | ✅ Ja | `is_admin_user()`/`is_junior_admin_user()` setzen `set search_path = public` |
| Geschütztes Hauptkonto in allen Schreibpfaden abgesichert | ✅ Ja | 4 Fundstellen (`admin-delete-user`, `delete-account`, `trainer-manage-invite`, Migration) |
| CORS/Shared-Secret korrekt je Edge Function | ✅ Ja | 7/9 mit `ALLOWED_ORIGINS`, die übrigen 2 begründet per Shared-Secret (CI/Webhook, kein Browser-Origin) |
| Unit-Tests für sicherheitsrelevante Kernlogik (PDF/Report-Erzeugung) | ❌ Nein | Kein Vitest/Jest im Projekt, nur E2E |

**Zwischenstand: 3/4**

### Jugendschutz

| Punkt | Status | Beleg |
|---|---|---|
| Altersfeld/Minderjährigen-Erkennung bei Registrierung | ❌ Nein | `AuthScreen.jsx` fragt kein Alter/Geburtsdatum ab |
| Explizite Datenschutz-Passage zu (potenziell minderjährigen) Azubis | ❌ Nein | `Datenschutz`-Text adressiert das nicht separat |
| Begrenzung der KI-Chat-Nutzung (reduziert Missbrauchs-/Abhängigkeitsrisiko) | ✅ Ja | `CHAT_MAX_QUESTIONS`-Limit vorhanden |

**Zwischenstand: 1/3**

### Content/Lizenzen

| Punkt | Status | Beleg |
|---|---|---|
| Alle produktiv genutzten KI-Bilder mit geklärter kommerzieller Lizenz | ✅ Ja | OpenArt Advanced-Plan bestätigt (`openart_account_get`), alle 9 Bilder 2026-07-25 sicherheitshalber neu generiert |
| Keine echten Marken-Logos/Maskottchen in KI-generierten Bildern | ✅ Ja | Bereits einmal korrigiert (`module-b.jpg`), seither Prompt-Regel dokumentiert |

**Zwischenstand: 2/2**

## Gesamt-Score (rein faktenbasiert, kein Rechtsurteil)

**9 / 14 erfüllt ≈ 64 %**

Dieser Score ist ein internes Diagnose-Werkzeug. **Er wird nicht extern gegenüber Partnern, Schulen oder Ausbildungsbetrieben als Compliance-Nachweis verwendet** — eine unabhängig geprüfte Aussage wäre etwas anderes als eine selbst erhobene technische Checkliste.

## Konkrete offene Punkte (priorisiert)

1. **Einwilligungs-Checkbox bei Registrierung fehlt** — einfach umsetzbar, sollte zeitnah nachgerüstet werden.
2. **Kein AGB/Nutzungsbedingungen-Dokument** — Voraussetzung für Punkt 1 (Checkbox braucht ein Ziel-Dokument).
3. **Keine Minderjährigen-spezifische Passage**, obwohl FISI-Azubis real ab 16 Jahren beginnen können — sollte in der Datenschutzerklärung ergänzt werden.
4. **Keine Unit-Tests** für `lernnachweis.js`/`websiteCheckReport.js`/`e2eReport.js`.

Alle vier Punkte: technisch/organisatorisch lösbar, aber **vor Punkt 1 und 3 sollte eine echte anwaltliche Prüfung erfolgen** (welche Formulierung, welche Rechtsgrundlage genau) — dieser Katalog bereitet das vor, ersetzt es nicht.

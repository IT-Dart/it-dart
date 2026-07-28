# IT-Dart — Projekt-Status

Kompakte Orientierung für jede neue Sitzung. Details: GO_LIVE.md, COMPLIANCE.md, `todos`-Tabelle, Claude-Gedächtnis. Regel zur Pflege: siehe CLAUDE.md „Projekt-Status-Datei".

**Fertig:** Kernplattform (8 Module, Prüfungsvorbereitung, KI-Chat, PDF-Lernnachweis) · AGB/Datenschutz/Impressum/Consent · Icon-Set + Hero-Bild + finalisierter Partikeleffekt auf der Unternehmensseite · KI-Kosten-Dashboard, Tool-Register, To-Do-Board mit KI-Lösungsvorschlag · Unit-Tests für PDF-Generatoren · Technischer Sicherheitsaudit vollständig abgeschlossen (search_path gehärtet, 2 verwaiste Edge-Function-Duplikate gelöscht, Leaked-Password-Protection aktiv, Supabase Pro-Upgrade) · E2E-Testsuite läuft vollständig grün (6/6, `e2e/scripts/setup-test-users.mjs` zum Provisionieren).

**Offen:** Beide harten Go-Live-Blocker (Gewerbeanmeldung, Premium-Preis) sind erledigt — offen bleiben nur nicht-blockierende Punkte: IT-Dart-Kids Bildgenerierung + Anwaltsprüfung · Troubleshooter noch nicht live (eigene Free-Tier-Organisation „IT-Dart-Test") · Logo-Redesign bewusst pausiert · Vercel-Tarif (ToS-Frage).

**Zuletzt geändert (2026-07-28):** **Kritischer Bug behoben:** anonyme Besucher hatten über it-dart.de/ keinen sichtbaren Login-Weg — gefunden über die E2E-Testsuite, live gefixt; E2E-Pipeline danach komplett instand gesetzt. Gesamt-Bestandsaufnahme Teil (a)+(b) abgeschlossen. **Gewerbeanmeldung eingereicht** und **Premium-Preis final festgelegt (3,99 €/Monat Einführungspreis, Marktvergleich siehe `dokumentation/03_...docx`)** — damit sind beide harten Go-Live-Blocker erledigt. Kooperationen-Sektion + auffälligere CTAs auf der Startseite, `?login`-Altlast entfernt, neue 404-Seite, Monitoring v1 live (Uptime-Check + DB-Größe im neuen Admin-Screen).

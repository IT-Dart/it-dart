# IT-Dart — Projekt-Status

Kompakte Orientierung für jede neue Sitzung. Details: GO_LIVE.md, COMPLIANCE.md, `todos`-Tabelle, Claude-Gedächtnis. Regel zur Pflege: siehe CLAUDE.md „Projekt-Status-Datei".

**Fertig:** Kernplattform (8 Module, Prüfungsvorbereitung, KI-Chat, PDF-Lernnachweis) · AGB/Datenschutz/Impressum/Consent · Icon-Set + Hero-Bild + finalisierter Partikeleffekt auf der Unternehmensseite · KI-Kosten-Dashboard, Tool-Register, To-Do-Board mit KI-Lösungsvorschlag · Unit-Tests für PDF-Generatoren · Technischer Sicherheitsaudit vollständig abgeschlossen (search_path gehärtet, 2 verwaiste Edge-Function-Duplikate gelöscht, Leaked-Password-Protection aktiv, Supabase Pro-Upgrade) · E2E-Testsuite läuft vollständig grün (6/6, `e2e/scripts/setup-test-users.mjs` zum Provisionieren).

**Offen:** Premium-Preis final festlegen · IT-Dart-Kids: erste Bildgenerierung + Anwaltsprüfung ausstehend · Troubleshooter: kein GitHub-Remote/Domain, noch nicht live (jetzt in eigener Free-Tier-Organisation „IT-Dart-Test") · Logo-Redesign bewusst pausiert.

**Zuletzt geändert (2026-07-28):** **Kritischer Bug behoben:** anonyme Besucher hatten über it-dart.de/ keinen sichtbaren Login-Weg (CompanyScreen ohne Anmelden-Button) — gefunden über die E2E-Testsuite, live gefixt. E2E-Pipeline danach komplett instand gesetzt (Testkonten provisioniert, 6 weitere Locator-/Timing-Bugs in den Testspecs behoben) — läuft jetzt zuverlässig grün. `gh` CLI in dieser Umgebung eingerichtet und authentifiziert für künftige Testläufe.

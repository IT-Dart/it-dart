# IT-Dart Project Knowledge Base

Version: 1.0  
Status: Living Document  
Zweck: Langfristige Wissensbasis für Entwicklung, Architektur und Entscheidungen

---

# 1. Projektübersicht

## Projektname

IT-Dart

## Ziel

IT-Dart ist eine digitale Lernplattform für angehende Fachinformatiker und IT-Lernende.

Die Plattform soll komplexe IT-Themen durch interaktive Lernmethoden verständlicher machen.

Der Fokus liegt auf:

- Prüfungsvorbereitung
- praxisnaher Wissensvermittlung
- interaktiven Übungen
- verständlichen Erklärungen
- KI-gestützter Unterstützung

---

# 2. Produktvision

## Kernidee

IT-Dart verbindet:

- klassische Lerninhalte
- interaktive Tools
- Simulationen
- Prüfungstraining
- KI-Unterstützung

Ziel ist nicht nur Wissensabfrage, sondern Verständnis und praktische Anwendung.

---

# 3. Zielgruppen

Primäre Zielgruppen:

## Auszubildende

**Status: UMGESETZT** (aktive, einzige real bediente Zielgruppe -- alle 8 Module live, kein Schul-/Unternehmenszugang existiert bisher).

Insbesondere:

- Fachinformatiker Systemintegration
- Fachinformatiker Anwendungsentwicklung

Anwendungsfälle:

- Prüfungsvorbereitung
- Verständnis schwieriger Themen
- Übung außerhalb der Berufsschule

---

## Berufsschulen und Bildungseinrichtungen

**Status: IDEE/OPTION** (keine Klassenlizenz-/Lehrkräfte-Funktion existiert im Code).

Mögliche zukünftige Zielgruppe:

- Schulen
- Ausbildungszentren
- Bildungsträger

Mögliche Nutzung:

- Klassenlizenzen
- Lehrkräftezugänge
- Lernfortschrittskontrolle

---

## Unternehmen

**Status: IDEE/OPTION** (kein B2B-Zugang existiert im Code).

Mögliche spätere Zielgruppe:

- Ausbildungsbetriebe
- interne Weiterbildung

---

# 4. Geschäftsmodell

## Aktueller Status

**Freemium: UMGESETZT** (profiles.is_premium, live seit Wochen, echte Preisgestaltung 3,99 EUR/Monat). **B2B-Modell: GEPLANT/IDEE**, nicht begonnen.

---

Mögliche Modelle:

## Freemium

Kostenlose Basisfunktionen:

- ausgewählte Lernmodule
- einfache Übungen

Premium:

- vollständiger Lernpfad
- zusätzliche Tools
- KI-Unterstützung
- Prüfungssimulationen

---

## B2B-Modell

Mögliche Angebote:

- Ausbildungsbetriebe
- Berufsschulen
- Bildungsträger

---

# 5. Lernplattform Module

## Bestehende Modulplanung

**Status: UMGESETZT.** 8 reale Module live (src/lib/modules.js): Grundlagen IT & Hardware, Netzwerktechnik, IT-Sicherheit, Betriebssysteme & Server, Datenbanken & Daten, Skripting & Automatisierung, Beruf & Projekt, Karriere & Bewerbung. Die untenstehenden Beispiel-Themen (Subnetting, Hexadezimal, SQL) sind reale Unterthemen INNERHALB dieser Module, keine eigenen Module.


## Beispiele

### Subnetting

Ziel:

Komplexe Netzwerkberechnungen verständlich vermitteln.

Mögliche Funktionen:

- interaktive Berechnung
- Visualisierung
- Übungen
- Prüfungssimulation


---

### Hexadezimal

Ziel:

Verständnis von Zahlensystemen.

---

### SQL

Ziel:

Datenbankgrundlagen vermitteln.

---

### Beruf & Projekt

Geplante Inhalte:

- Karriere
- Bewerbung
- Lebenslauf
- Vorstellungsgespräch
- KI-gestützte Simulation

---

# 6. Designprinzipien

## Markenidentität

**Status: ENTSCHEIDUNG, umgesetzt.** IT-Dart soll technisch, modern und spielerisch wirken.

---

## Designrichtung

Primär:

- dunkles Design
- moderne SaaS-Optik
- technische Atmosphäre

Farbwelt (korrigiert gegen `src/lib/theme.js`, 2026-08-05):

- Dunkles Navy (`#0f1623`) als Grundfarbe -- trifft zu
- **Kein Orange als Hauptakzent** -- tatsächlicher Hauptakzent ist Cyan (`#38bdf8`), Amber (`#f59e0b`) existiert nur als Warn-/Badge-Farbe, kein durchgängiger Akzent

---

## UX Prinzipien

Priorität:

1. Verständlichkeit
2. geringe Einstiegshürde
3. Motivation durch Fortschritt
4. praktische Anwendung

---

# 7. Entwicklung mit KI

## Grundsatz

KI unterstützt die Entwicklung, ersetzt aber keine technische Prüfung.

---

## Claude Code Nutzung

Claude Code wird eingesetzt für:

- Entwicklung
- Analyse
- Refactoring
- Architekturüberprüfung
- Dokumentation

---

## Arbeitsprinzip

Claude soll:

- zuerst analysieren
- Auswirkungen prüfen
- Änderungen planen
- erst danach implementieren

---

## Keine voreiligen Änderungen

Vor größeren Änderungen:

- aktuellen Zustand prüfen
- Abhängigkeiten analysieren
- Risiken bewerten

---

# 8. Dokumentationsprinzip

Das Projekt trennt:

## CLAUDE.md

Enthält:

- Entwicklungsregeln
- Sicherheitsregeln
- Arbeitsweise


## AGENTS.md

**Status: NICHT UMGESETZT.** Die Datei existiert nicht im Repository. Claude Code liest ausschließlich CLAUDE.md, nicht AGENTS.md (verifiziert, siehe Claude-Gedächtnis `feedback_claude_code_usage_audit`) -- ein AGENTS.md hätte hier keine praktische Wirkung.

Geplant enthielte:

- Agentenrollen
- Verantwortlichkeiten


## IT-DART-PROJECT-KNOWLEDGE.md

Enthält:

- Projektwissen
- Architekturentscheidungen
- historische Entscheidungen
- Begründungen


## docs/

**Status: NICHT UMGESETZT.** Der Ordner existiert nicht. Die reale technische/rechtliche Dokumentation liegt unter `dokumentation/` (durchnummeriert, deutsch), nicht unter `docs/`. Siehe §70/§71 für den Trennungsvorschlag, bewusst noch nicht migriert.

Geplant enthielte:

- technische Dokumentation
- rechtliche Dokumentation
- Fachkonzepte

---

# Ende Teil 1


# 9. Technische Architektur

## Architekturprinzip

IT-Dart wird als moderne Webanwendung entwickelt.

Grundprinzipien:

- Sicherheit vor Bequemlichkeit
- serverseitige Vertrauensgrenzen
- minimale Rechtevergabe
- klare Trennung zwischen Client und Backend
- nachvollziehbare Änderungen

---

# 10. Frontend Architektur

## Status

**UMGESETZT, verifiziert 2026-08-05** (`grep -rl SERVICE_ROLE src/` -> keine Treffer, siehe COMPLIANCE.md).

---

Grundprinzip:

Das Frontend ist nicht vertrauenswürdig.

Der Client darf niemals allein entscheiden:

- ob ein Nutzer Admin ist
- ob ein Nutzer Premium besitzt
- ob Daten gelesen oder verändert werden dürfen

Alle sicherheitsrelevanten Entscheidungen müssen serverseitig abgesichert werden.

---

## Frontend Regeln

Nicht erlaubt:

- Secrets im Frontend
- Service Keys
- privilegierte Datenbankzugriffe
- reine Client-basierte Berechtigungen

---

# 11. Backend Architektur

## Grundprinzip

Privilegierte Aktionen laufen serverseitig.

Beispiele:

- Rollenänderungen
- administrative Aktionen
- Zugriff auf sensible Daten
- kritische Datenänderungen

Mögliche technische Umsetzung:

- Server Routes
- Edge Functions
- SECURITY DEFINER PostgreSQL Funktionen

---

# 12. Supabase Architektur

## Rolle von Supabase

Supabase stellt zentrale Backend-Funktionen bereit:

- Authentifizierung
- PostgreSQL Datenbank
- Row Level Security
- RPC Funktionen

---

# 13. Datenbanksicherheit

## Grundregel

Jede Tabelle benötigt aktiviertes Row Level Security (RLS).

Eine Tabelle gilt erst als produktionsbereit wenn:

- RLS aktiviert
- Policies geprüft
- Zugriffsszenarien getestet

---

# 14. Row Level Security (RLS)

## Ziel

Datenzugriffe werden nicht ausschließlich über das Frontend kontrolliert.

Die Datenbank selbst erzwingt Berechtigungen.

---

## Sicherheitsprinzip

Nicht:

Frontend entscheidet:

"Dieser Nutzer darf Daten sehen."

Sondern:

Datenbank entscheidet:

"Diese Anfrage erfüllt die Bedingungen."

---

# 15. Rollenmodell

## Status

**UMGESETZT, verifiziert 2026-08-05** gegen `profiles`-Tabelle (siehe CLAUDE.md Datenmodell) -- Liste unten ist vollständig und aktuell.

Bekannte Rollenstruktur:

- Nutzer
- Premium Nutzer
- Trainer
- Junior-Admin
- Admin


---

# 16. Rollenquelle

## Verbindliche Regel

Berechtigungen dürfen niemals ausschließlich aus clientkontrollierten Daten stammen.

Nicht verwenden:

- user_metadata für Autorisierung

Bevorzugt:

- app_metadata
- serverseitige Tabellen
- serverseitig geprüfte Claims

---

# 17. Admin Funktionen

## Grundsatz

Administrative Funktionen benötigen:

1. Authentifizierung
2. Autorisierung
3. Auditierbarkeit


---

Beispiele:

- Nutzerverwaltung
- Rollenänderungen
- Premium-Freischaltung
- Datenlöschung
- Zugriff auf sensible Informationen

---

# 18. SECURITY DEFINER Funktionen

## Verwendung

SECURITY DEFINER Funktionen können für privilegierte Operationen eingesetzt werden.

---

## Anforderungen

Jede SECURITY DEFINER Funktion benötigt:

- klare Zweckbeschreibung
- minimale Berechtigungen
- definierte Eingaben
- Berechtigungsprüfung
- sichere SQL-Verwendung

---

## SQL Sicherheit

Dynamische SQL-Abfragen müssen besonders geprüft werden.

Regeln:

- keine ungeprüfte String-Konkatenation
- parametrisierte Queries verwenden
- Eingaben validieren

---

# 19. Audit Logging

## Ziel

Sicherheitsrelevante Aktionen müssen nachvollziehbar sein.

---

## Bereits vorhanden

session_audit_log:

Status:

VORHANDEN

Aktueller Zweck:

- Session-/Verbindungsinformationen

---

## Erweiterung

**Status: UMGESETZT (2026-08-05).** `admin_action_log` + DB-Trigger auf `profiles` -- siehe CLAUDE.md Abschnitt 4. Ursprünglich hier als "geplant" beschrieben:

Beispiele:

- Admin vergibt Rolle
- Admin entzieht Rolle
- Admin löscht Benutzer
- Admin greift auf sensible Daten zu

---

## Audit Daten

Empfohlene Informationen:

- ausführender Benutzer
- Zielobjekt
- Aktion
- Zeitpunkt
- technische Metadaten

---

# 20. Data Masking

## Status

**ENTSCHEIDUNG GEGEN dieses Konzept (2026-08-04).** Das unten beschriebene "Reveal-Prinzip" (Klartext-RPC + eigener Audit-Eintrag) wurde bewusst NICHT gebaut. Stattdessen: Supabase Studios native Spalten-Maskierung aktiviert + eine rein kosmetische `profiles.display_ref`-Spalte (fortlaufende Nummer statt UUID) zur Wiedererkennung, ohne eigene Reveal-Funktion -- einfacher, gleicher Datenschutz-Effekt. Siehe CLAUDE.md Datenmodell-Abschnitt. Ursprüngliches (verworfenes) Konzept unten dokumentiert als historische Idee.

---

## Ziel

Sensible personenbezogene Daten sollen standardmäßig minimiert dargestellt werden.


---

## Reveal Prinzip

Klartextzugriff nur durch:

1. explizite Benutzeraktion
2. serverseitige Berechtigungsprüfung
3. Audit-Eintrag

---

## Architektur

Nicht erlaubt:

Frontend lädt Klartextdaten und maskiert nur die Darstellung.

---

Erforderlich:

Frontend:

Anfrage "Daten anzeigen"

↓

Backend/RPC:

- Rolle prüfen
- Berechtigung prüfen
- Audit schreiben

↓

Klartext zurückgeben

---

# 21. Authentication vs Authorization

## Grundsatz

Eine erfolgreiche Anmeldung bedeutet nicht automatisch Berechtigung.

Immer getrennt prüfen:

Authentication:

"Wer bist du?"

Authorization:

"Was darfst du?"

---

# 22. Sicherheitsgrenze

Vertrauensmodell: Benutzer -- Frontend -- Server -- Datenbank

Jede Stufe muss als potenziell manipuliert betrachtet werden.

---

# Ende Teil 2


# 23. Datenschutz & DSGVO

## Grundprinzip

Datenschutz wird als technische und organisatorische Aufgabe betrachtet.

Nicht nur die Datenschutzerklärung ist relevant, sondern:

- Datenminimierung
- Zugriffskontrolle
- Nachvollziehbarkeit
- sichere Verarbeitung
- Löschkonzepte

---

# 24. Datenschutzprinzipien

## Privacy by Design

Neue Funktionen sollen bereits bei der Entwicklung datenschutzfreundlich geplant werden.

Beispiele:

- nur notwendige Daten speichern
- sensible Daten minimieren
- Berechtigungen früh berücksichtigen


---

## Privacy by Default

Standardmäßig:

- möglichst wenig Daten sichtbar
- möglichst wenig Daten übertragen
- möglichst restriktive Berechtigungen

---

# 25. Personenbezogene Daten

Mögliche personenbezogene Daten:

- Name
- E-Mail-Adresse
- Benutzer-ID
- Zahlungsinformationen
- Nutzungsdaten
- technische Zugriffsdaten


---

# 26. Datenminimierung

Grundregel:

Es werden nur Daten gespeichert, die für den jeweiligen Zweck erforderlich sind.

Vor jeder neuen Datenbankspalte prüfen:

- Warum wird diese Information benötigt?
- Wie lange wird sie benötigt?
- Wer darf darauf zugreifen?


---

# 27. Server-Logfiles

## Status

**TEILWEISE UMGESETZT.** IP-Protokollierung bei Sitzungsstart ist dokumentiert (`session_audit_log`, doc 09 Abschnitt 15). Allgemeine Hosting-Logs (Vercel) sind bisher nicht separat dokumentiert -- weiterhin offen.

---

Bei Nutzung der Plattform können technische Zugriffsdaten entstehen.

Beispiele:

- IP-Adresse
- Datum und Uhrzeit
- Browserinformationen
- Betriebssystem
- aufgerufene Ressourcen

Mögliche Quellen:

- Hostinganbieter
- Backendanbieter
- Sicherheitsdienste

---

## Datenschutzbewertung

Die Verarbeitung technischer Logdaten kann zur:

- Gewährleistung der Sicherheit
- Fehleranalyse
- Stabilität des Betriebs

erforderlich sein.

Mögliche Rechtsgrundlage:

Art. 6 Abs. 1 lit. f DSGVO

(Berechtigtes Interesse)

Die konkrete Ausgestaltung muss anhand der tatsächlich eingesetzten Dienste geprüft werden.

---

# 28. Drittanbieter & externe Dienste

## Grundprinzip

Jeder externe Dienst benötigt eine Prüfung:

- Welche Daten werden übertragen?
- Wohin werden Daten übertragen?
- Gibt es eine geeignete Rechtsgrundlage?
- Gibt es Auftragsverarbeitung?
- Gibt es Datenschutzvereinbarungen?


---

# 29. Bekannte bzw. mögliche Dienste

## Hosting

Beispiel:

- Vercel

Prüfpunkte:

- Serverstandort
- Datenschutzbedingungen
- Übermittlungsgrundlage


---

## Backend

Beispiel:

- Supabase

Verwendung:

- Authentifizierung
- Datenbank
- Backendfunktionen

Prüfpunkte:

- Datenverarbeitung
- Zugriffskontrolle
- RLS


---

## KI-Dienste

Beispiele:

- Anthropic Claude
- andere KI-Dienste

---

Grundsatz:

Es muss geprüft werden:

- Werden personenbezogene Daten übertragen?
- Werden Daten gespeichert?
- Werden Daten zu Trainingszwecken verwendet?
- Besteht eine geeignete Vertragsgrundlage?


---

# 30. EU-U.S. Data Privacy Framework

## Status

Bei US-Dienstleistern prüfen.

---

Grundsatz:

Bei Übermittlung personenbezogener Daten in die USA muss geprüft werden:

- ob der Anbieter unter dem EU-U.S. Data Privacy Framework zertifiziert ist
- ob Standardvertragsklauseln erforderlich sind
- ob zusätzliche Maßnahmen notwendig sind


---

# 31. Passwortsicherheit

## Technische Regel

Passwörter werden nicht verschlüsselt gespeichert.

Grund:

Verschlüsselung wäre grundsätzlich wieder entschlüsselbar.

---

Korrekte technische Beschreibung:

Passwörter werden gehasht.

Beispiele:

- bcrypt
- Argon2


---

Prinzip:

- kein Zugriff auf Klartextpasswörter
- keine Wiederherstellung des Originalpassworts
- nur Passwortprüfung über Hash-Vergleich


---

# 32. Account-Löschung

## Grundprinzip

Nutzerkonten sollen gelöscht werden können.

---

Dabei muss unterschieden werden zwischen:

## normale Nutzerdaten

Mögliche Löschung oder Anonymisierung entsprechend Löschkonzept.


## gesetzlich relevante Daten

Beispiele:

- Rechnungen
- Zahlungsbelege
- Buchungsdaten

Diese können aufgrund gesetzlicher Pflichten weiterhin gespeichert werden müssen.

---

# 33. Steuerliche Aufbewahrungspflichten

## Status

**TEILWEISE UMGESETZT / GEPLANT.** Premium ist live (profiles.is_premium), aber ohne eigenes Zahlungssystem -- Stripe-Anbindung weiterhin offen (To-Do #43). Diese Pflichten werden erst mit echter Zahlungsabwicklung relevant.

---

Bei kostenpflichtigen Leistungen können handels- und steuerrechtliche Aufbewahrungspflichten entstehen.

Beispiele:

- § 147 AO
- § 257 HGB

---

Prinzip:

Nicht benötigte Nutzerdaten löschen.

Aber:

Gesetzlich erforderliche Abrechnungsdaten müssen gegebenenfalls:

- weiter gespeichert
- geschützt
- für normale Nutzung gesperrt

werden.

---

# 34. Zugriff durch Entwickler / Administratoren

## Grundsatz

Interne Zugriffe müssen kontrolliert werden.

Nicht jeder technische Zugriff bedeutet automatische Berechtigung.

---

Maßnahmen:

- Rollenmodell
- Zugriffskontrolle
- Auditierung
- minimale Rechte

---

# 35. Claude Code / KI-Entwicklung

## Grundsatz

KI-Werkzeuge sind Entwicklungswerkzeuge.

---

Nicht automatisch:

- Datenempfänger
- Teil des Produktes
- Nutzer der Plattform

---

Prüfung notwendig:

Wenn echte Nutzerdaten mit KI-Systemen verarbeitet werden:

- Datenschutzprüfung
- Zweckprüfung
- Übermittlungsprüfung

---

# 36. Technische und organisatorische Maßnahmen (TOMs)

**Status: UMGESETZT.** Dokumentiert in `dokumentation/09_Datenschutz_Referenzdokument.docx` (u. a. 2FA/Passwort-Manager, Dependabot, CSP-Monitoring, RLS, Backup). Ursprünglich hier als "geplant" markiert:

- Zugriffskontrolle
- Berechtigungen
- Verschlüsselung
- Backup
- Logging
- Sicherheitsprozesse

---

# Ende Teil 3

# 37. Entwicklungsprozess

## Grundprinzip

Entwicklung erfolgt kontrolliert und nachvollziehbar.

Priorität:

1. Sicherheit
2. Stabilität
3. Wartbarkeit
4. Funktionalität
5. Geschwindigkeit


---

# 38. KI-gestützter Entwicklungsprozess

## Grundsatz

KI unterstützt Entwicklung, ersetzt aber keine technische Bewertung.

---

Arbeitsweise:

Nicht:

Idee → Code → Fertig


Sondern:

Anforderung
↓
Analyse
↓
Architekturprüfung
↓
Umsetzungsplan
↓
Implementierung
↓
Tests
↓
Review
↓
Dokumentation

--- 


---

# 39. Claude Code Arbeitsweise

## Vor Änderungen

Claude soll:

- bestehenden Code analysieren
- Architektur verstehen
- Abhängigkeiten prüfen
- Risiken identifizieren


---

## Bei größeren Änderungen

Vor Implementierung:

- Änderungsplan erstellen
- betroffene Dateien nennen
- Auswirkungen erklären


---

## Keine Blindänderungen

Claude darf nicht:

- Sicherheitsmechanismen entfernen
- bestehende Funktionen ersetzen ohne Prüfung
- Architekturentscheidungen ignorieren
- Annahmen als Fakten behandeln


---

# 40. Sicherheitskritische Änderungen

## Beispiele

Besondere Prüfung erforderlich bei:

- Authentifizierung
- Autorisierung
- RLS
- SECURITY DEFINER Funktionen
- Datenschutz
- Zahlungslogik
- Secrets
- Kryptographie


---

## Regel

Sicherheitskritische Änderungen gelten erst als abgeschlossen nach:

- technischer Verifikation
- Tests
- nachvollziehbarer Prüfung


Die konkrete Form der Prüfung kann variieren.

---

# 41. AGENTS Konzept

**Status: IDEE/OPTION, nicht umgesetzt.** Die reale Arbeitsweise ist eine einzelne CLAUDE.md-geführte Claude-Code-Sitzung, ergänzt um gelegentliche Task-Subagenten (Explore, general-purpose) für einzelne Recherche-Schritte -- keine festen, persistenten Rollen wie unten beschrieben.

## Ziel

Komplexe Aufgaben können durch spezialisierte Rollen geprüft werden.


---

Mögliche Rollen:

## Security Agent

Aufgaben:

- Sicherheitsprüfung
- RLS
- Auth
- Secrets
- Datenschutz


---

## Code Review Agent

Aufgaben:

- Qualität
- Wartbarkeit
- Fehlererkennung


---

## Test Agent

Aufgaben:

- Tests
- Edge Cases
- Regressionen


---

## Design Agent

Aufgaben:

- UI/UX
- Konsistenz
- Benutzerführung


---

## Legal/Compliance Agent

Aufgaben:

- DSGVO
- Datenschutz
- rechtliche Anforderungen


---

# 42. Testing Strategie

## Grundprinzip

Tests müssen reale Fehler verhindern.

Nicht nur:

"Code läuft"

sondern:

"Code verhält sich sicher und korrekt"


---

# 43. E2E Tests

## Ziel

Gesamte Benutzerabläufe prüfen.

Beispiele:

- Registrierung
- Login
- Rollenwechsel
- Premium-Zugriff
- Admin-Funktionen


---

## Umgebung

E2E Tests sollen möglichst gegen getrennte Testumgebungen laufen.

Beispiel:

- Preview-System
- Testdatenbank
- Seed-Daten


---

# 44. Negative Tests

## Wichtiges Sicherheitsprinzip

Nicht nur erlaubte Aktionen testen.

Auch verbotene Aktionen testen.

---

Beispiele:

Ein normaler Nutzer darf nicht:

- Adminseiten öffnen
- Premiumdaten manipulieren
- fremde Nutzerdaten lesen


---

# 45. Datenbanktests

Bei Änderungen prüfen:

- RLS funktioniert
- Policies greifen korrekt
- keine Datenleckage möglich


---

# 46. Git Workflow

## Grundprinzip

Änderungen müssen nachvollziehbar bleiben.


---

Empfohlen:

- kleine Änderungen
- klare Commit-Nachrichten
- keine unnötigen Großänderungen


---

# 47. Änderungen außerhalb des Auftrags

Grundregel:

Keine unnötigen Refactorings.

---

Eine Änderung soll:

- das Ziel erfüllen
- Risiken minimieren
- bestehende Funktionalität erhalten


---

# 48. Dokumentation von Entscheidungen

## Architekturentscheidungen sollen dokumentiert werden.

Beispiel:

Warum wurde Technologie X gewählt?

Nicht nur:

"Wir nutzen X"

sondern:

"Wir nutzen X, weil ..."


---

# 49. Fehleranalyse

## Lessons Learned

Fehler werden dokumentiert.

Format:

Problem:

Was ist passiert?

Ursache:

Warum ist es passiert?

Lösung:

Wie wurde es behoben?

Prävention:

Wie verhindern wir Wiederholung?


---

# 50. Code Qualität

Grundprinzipien:

- verständlicher Code
- kleine Änderungen
- keine unnötige Komplexität
- keine Duplikate
- Sicherheitsbewusstsein


---

# 51. Logging Regeln

## Verboten

Keine Speicherung oder Ausgabe von:

- Passwörtern
- Tokens
- JWTs
- API Keys
- Secrets
- unnötigen personenbezogenen Daten


---

# 52. Secrets Management

Secrets dürfen niemals:

- im Frontend landen
- in Git gespeichert werden
- in Logs erscheinen


---

Verwendung:

- sichere Environment Variables
- Secret Management


---

# Ende Teil 4


# 53. Geschäftsmodell & Produktstrategie

## Grundprinzip

IT-Dart soll langfristig nicht nur eine Lernseite sein, sondern ein digitales Bildungsprodukt mit wiederkehrenden Einnahmen.

Technische Entscheidungen sollen die spätere Skalierung ermöglichen.

---

# 54. Monetarisierung

## Status

**Freemium: UMGESETZT und live.** Echte Zahlungsabwicklung (Stripe) weiterhin **GEPLANT** (To-Do #43).

---

## Freemium Modell

Mögliches Konzept:

Kostenlose Inhalte:

- Einstiegsmodule
- Basisübungen
- einfache Tools

Premium:

- vollständiger Lernpfad
- zusätzliche Übungen
- Prüfungsvorbereitung
- KI-Unterstützung
- erweiterte Funktionen

---

# 55. Premium Accounts

## Technische Anforderungen

Premium-Status muss serverseitig verwaltet werden.

Nicht:

Frontend entscheidet:

"Dieser Nutzer ist Premium"

Sondern:

Backend/Datenbank entscheidet:

"Dieser Nutzer besitzt Premium-Rechte"


---

Mögliche Funktionen:

- Premium Lerninhalte
- zusätzliche Tools
- Fortschrittsanalyse
- KI-Funktionen


---

# 56. B2B Strategie

## Zielgruppe

Mögliche Kunden:

- Ausbildungsbetriebe
- Berufsschulen
- Bildungseinrichtungen


---

Mögliche Modelle:

- Einzelplatzlizenz
- Klassenlizenz
- Firmenzugänge
- Trainerzugänge


---

# 57. Vertriebsidee

## Direkte Präsentationen

Mögliche Strategie:

- Ausbildungsstätten besuchen
- IT-Dart präsentieren
- Feedback sammeln
- Pilotkunden gewinnen


---

Mögliche Materialien:

- Demo-Version
- Präsentation
- 3D-gedruckte Produkte
- Informationsmaterial


---

# 58. 3D-Druck Integration

## Status

**TEILWEISE UMGESETZT.** Subnetting-Würfel real gebaut und druckbar (Blender, 3 Größen), aber pausiert -- noch nicht als Marketingmaterial im Einsatz (siehe Claude-Gedächtnis `project_subnetting_wuerfel_checkpoint`).


---

Vorhandene Hardware:

- Bambu Lab X1 Carbon mit AMS


---

Mögliche Nutzung:

## Marketing

Beispiele:

- kleine IT-Dart Modelle
- Netzwerk-Themen als 3D-Objekt
- Subnetting-Würfel
- Schlüsselanhänger
- Giveaways


---

## Lernmaterial

3D-Druck kann eingesetzt werden für:

- Visualisierung abstrakter IT-Themen
- physische Lernmodelle
- Unterrichtsmaterial


---

# 59. 3D-Druck und Gewerbe

## Grundprinzip

Private Hardware kann in das Gewerbe eingebracht werden.

Dabei dokumentieren:

- Gegenstand
- Zustand
- Einlagezeitpunkt
- realistischer Zeitwert


---

## Steuerliche Dokumentation

Empfohlen:

Einlageverzeichnis mit:

- Hardware
- Filamente
- Zubehör
- Werkzeug


---

# 60. Marketingstrategie

## Ziel

IT-Dart soll als moderne, praxisnahe IT-Lernplattform positioniert werden.


---

Mögliche Kanäle:

- Berufsschulen
- Social Media
- IT-Community
- Ausbildungsbetriebe
- Fachveranstaltungen


---

# 61. Markenidentität

## Zielgruppe

IT-Lernende sollen IT nicht nur auswendig lernen, sondern verstehen.


---

Positionierung:

Nicht:

"Nur Prüfungstrainer"

Sondern:

"Interaktiver Lernbegleiter für IT-Ausbildung"


---

# 62. KI als Produktbestandteil

## Status

**UMGESETZT.** Alle vier KI-Modi live: KI-Lernassistent, Mock-Interview, Diagnose-Dialog, Prüfungsauswertung -- vollständig dokumentiert in KI-RICHTLINIEN.md.


---

Umgesetzte Funktionen:

- KI-Lernassistent
- Erklärungen
- Prüfungssimulation
- Bewerbungstraining (Mock-Interview)
- technische Hilfe (Diagnose-Dialog)


---

## Datenschutzprinzip

Bei KI-Funktionen prüfen:

- welche Daten übertragen werden
- ob personenbezogene Daten enthalten sind
- ob Nutzer informiert werden müssen


---

# 63. Finanzplanung

## Grundprinzip

Investitionen sollen strategisch erfolgen.

Nicht jede Ausgabe ist sinnvoll, nur weil sie steuerlich absetzbar ist.


---

Priorität:

1. Produktentwicklung
2. Nutzergewinnung
3. Stabilität
4. Skalierung


---

# 64. Zeitmanagement

## Rahmenbedingungen

Entwicklung erfolgt nebenberuflich.

Daher:

- Fokus auf wichtige Funktionen
- keine unnötige Komplexität
- kleine iterative Schritte


---

# 65. Produktentscheidungen

## Grundregel

Neue Funktionen müssen bewertet werden nach:

- Nutzen für Nutzer
- Entwicklungsaufwand
- Wartbarkeit
- Kosten
- Datenschutzfolgen


---

# Ende Teil 5


# 66. Entscheidungsmanagement

## Grundprinzip

IT-Dart entwickelt sich kontinuierlich weiter.

Nicht jede Idee wird automatisch umgesetzt.

Entscheidungen sollen nachvollziehbar dokumentiert werden.

---

# 67. Entscheidungsstatus

Jede Information kann einen Status besitzen:

## ENTSCHEIDUNG

Wurde bewusst beschlossen.

Beispiel:

"Rollen werden nicht über user_metadata autorisiert."

---

## UMGESETZT

Technisch vorhanden.

Beispiel:

"RLS ist für Tabelle X aktiviert."

---

## GEPLANT

Zielbild.

Beispiel:

"Data Masking für Admin-Ansichten."

---

## OPTION

Mögliche Idee.

Noch keine Entscheidung.

---

## OFFEN

Benötigt eine zukünftige Entscheidung.

---

# 68. Architekturentscheidungen (ADR Prinzip)

Wichtige Entscheidungen sollten dokumentiert werden.

Format:

## Entscheidung

Was wurde entschieden?

## Kontext

Welches Problem sollte gelöst werden?

## Alternativen

Welche Möglichkeiten wurden betrachtet?

## Konsequenz

Welche Auswirkungen entstehen?


---

# 69. Offene technische Themen

## Audit-System

Status:

**UMGESETZT (2026-08-05)**, siehe §19.

Ursprünglich zu prüfen:

- Erweiterung bestehender Logs
- zentrale Audit-Tabelle
- Ereignisse:
  - Rollenänderung
  - Premiumänderung
  - Accountlöschung
  - Zugriff auf sensible Daten


---

## Data Masking

Status:

**ENTSCHEIDUNG gegen dieses Konzept, siehe §20** -- andere Lösung (display_ref) gewählt.

Ursprüngliche offene Punkte (nicht mehr relevant):

- Maskierungslogik
- Berechtigungsmodell
- Auditierung
- Frontend Integration


---

## Datenschutzdokumentation

Status:

**UMGESETZT, laufend gepflegt** (COMPLIANCE.md, KI-RICHTLINIEN.md, dokumentation/09 -- mindestens wöchentlicher Gegencheck, siehe CLAUDE.md).

Zu prüfen:

- aktuelle Drittanbieter
- Logdaten
- Löschkonzept
- Aufbewahrungspflichten


---

# 70. Repository Struktur

**Status: IDEE/OPTION, nicht umgesetzt.** Auf Nutzerwunsch (2026-08-05) bewusst NICHT automatisch migriert -- nur Analyse/Vorschlag, keine Umsetzung ohne explizite Freigabe.

Empfohlene langfristige Struktur:

/
├── CLAUDE.md
├── AGENTS.md
├── IT-DART-PROJECT-KNOWLEDGE.md
│
├── docs/
│ ├── architecture/
│ ├── security/
│ ├── legal/
│ └── business/
│
├── prompts/
│ ├── security-review.md
│ ├── legal-review.md
│ ├── architecture-review.md
│ └── code-review.md
│
├── src/
├── supabase/
└── tests/


---

# 71. Dokumententrennung

## CLAUDE.md

Enthält:

- Arbeitsweise
- Sicherheitsregeln
- Entwicklungsrichtlinien


---

## AGENTS.md

Enthält:

- Rollen
- Spezialaufgaben
- Zusammenarbeit


---

## PROJECT KNOWLEDGE

Enthält:

- Projektwissen
- Entscheidungen
- Hintergründe


---

## docs/

Enthält:

- ausführliche Dokumentationen


---

## prompts/

Enthält:

- wiederverwendbare Prüfaufträge


---

# 72. Umgang mit diesem Dokument

Dieses Dokument ist eine Wissensbasis.

Es ersetzt nicht:

- aktuellen Code
- aktuelle Datenbankstruktur
- aktuelle Konfiguration

Vor Änderungen prüfen:

1. Ist die Information noch aktuell?
2. Wurde sie technisch umgesetzt?
3. Gibt es neuere Entscheidungen?
4. Gibt es Sicherheitsauswirkungen?

---

# 73. Priorität von Informationen

Bei Konflikten gilt:

1. Aktueller funktionierender Code
2. Aktuelle CLAUDE.md Regeln
3. Aktuelle technische Dokumentation
4. PROJECT KNOWLEDGE
5. Historische Ideen


---

# 74. Grundprinzip für zukünftige Entwicklung

IT-Dart soll langfristig:

- sicher
- wartbar
- skalierbar
- datenschutzkonform
- professionell betreibbar

entwickelt werden.

---

# 75. Abschließende Leitlinie

Bei jeder neuen Funktion prüfen:

## Produkt

Hilft die Funktion dem Nutzer?

## Technik

Passt sie zur Architektur?

## Sicherheit

Entstehen neue Risiken?

## Datenschutz

Werden neue personenbezogene Daten verarbeitet?

## Betrieb

Kann die Funktion langfristig gewartet werden?

---

# Ende IT-Dart Project Knowledge Base

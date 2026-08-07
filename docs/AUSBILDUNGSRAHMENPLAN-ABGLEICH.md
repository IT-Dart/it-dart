# Ausbildungsrahmenplan-Abgleich: IT-Dart vs. offizieller FISI-Rahmenplan

Erstellt 2026-08-05 als Voraussetzung für ein drittes Prüfkriterium im `didaktik-content-review`-Subagenten ("Abdeckung gegen Rahmenlehrplan (KMK) und FIAusbV"). Ohne dieses Dokument wäre eine Abdeckungsprüfung nur die eigene, nicht verifizierbare Erinnerung des Agenten an den Rahmenplan — mit diesem Dokument prüft er gegen eine feste, projektinterne Referenz.

**Begriffsklärung (korrigiert 2026-08-08):** Weder der Rahmenlehrplan noch die FIAusbV sind IHK-Dokumente. Der Rahmenlehrplan (12 Lernfelder, schulische Seite) wird von der Kultusministerkonferenz (KMK) herausgegeben, bundeseinheitlich für alle 16 Länder — keine Bundesland-spezifische Fassung. Die FIAusbV (betriebliche Seite) ist eine Bundesverordnung. Die IHK führt auf Basis dieser beiden Dokumente lediglich die Abschlussprüfung durch, ist aber nicht deren Urheberin. Frühere Formulierungen in diesem Dokument, die von einem "IHK-Ausbildungsrahmenplan" sprachen, waren entsprechend ungenau und wurden korrigiert.

## Quellen (öffentlich, amtlich)

1. **FIAusbV** — Verordnung über die Berufsausbildung zum Fachinformatiker und zur Fachinformatikerin, Anlage (Ausbildungsrahmenplan, betriebliche Fertigkeiten/Kenntnisse mit Zeitrichtwerten in Wochen): [gesetze-im-internet.de/fiausbv](https://www.gesetze-im-internet.de/fiausbv/BJNR025000020.html)
2. **Rahmenlehrplan (KMK)** — die 12 Lernfelder für die Berufsschule, Fachrichtung Systemintegration: [ausbildung-in-der-it.de/fachinformatiker/systemintegration/lernfelder](https://ausbildung-in-der-it.de/fachinformatiker/systemintegration/lernfelder)

Beide Quellen sind komplementär: die FIAusbV regelt die **betriebliche** Ausbildung (Fertigkeiten/Wochen), der Rahmenlehrplan die **schulische** (Lernfelder/Ausbildungsjahr). IT-Dart ist inhaltlich näher am Rahmenlehrplan (thematisch strukturiert wie die Lernfelder), wird aber gegen beide abgeglichen.

## Abgleich: 12 Lernfelder ↔ IT-Dart-Module

| LF | Ausbildungsjahr | Titel (offiziell) | IT-Dart-Abdeckung | Bewertung |
|---|---|---|---|---|
| 1 | 1. | Das Unternehmen und die eigene Rolle im Betrieb beschreiben | Modul `pr`, Thema 1 "Unternehmensstrukturen" | ✅ Abgedeckt |
| 2 | 1. | Arbeitsplätze nach Kundenwunsch ausstatten | Modul `g` (Hardware-Komponenten) + Modul `pr` (Kundenkommunikation/Bedarfsanalyse) | ✅ Abgedeckt (aufgeteilt auf 2 Module) |
| 3 | 1. | Clients in Netzwerke einbinden | Modul `o` (Netzwerktechnik, alle 7 OSI-Themen) | ✅ Abgedeckt |
| 4 | 1. | Schutzbedarfsanalyse im eigenen Arbeitsbereich durchführen | Modul `si`, Thema 1 "Schutzziele" | ✅ Abgedeckt |
| 5 | 1. | Software zur Verwaltung von Daten anpassen | Modul `db` (SQL/Datenbankdesign) + Modul `sk` (Skripte schreiben) | ✅ Abgedeckt (aufgeteilt auf 2 Module) |
| 6 | 2. | Serviceanfragen bearbeiten | Modul `pr`, Thema 3 "Ticketsystem & SLA" | ✅ Abgedeckt |
| 7 | 2. | Cyber-physische Systeme ergänzen (IoT-Integration) | Modul `b`, Thema 9 "Cyber-physische Systeme & IoT" | ✅ Abgedeckt |
| 8 | 2. | Daten systemübergreifend bereitstellen | Modul `db`, Thema 6 "Daten systemübergreifend" (explizit im Untertitel) | ✅ Abgedeckt |
| 9 | 2. | Netzwerke und Dienste bereitstellen | Modul `o` (vertieft: Subnetting, DHCP/DNS, WLAN) | ✅ Abgedeckt |
| 10b | 3. | Serverdienste bereitstellen, Administration automatisieren | Modul `b` (Betriebssysteme & Server) + Modul `sk` (PowerShell-Automatisierung) | ✅ Abgedeckt (aufgeteilt auf 2 Module) |
| 11b | 3. | Betrieb und Sicherheit vernetzter Systeme gewährleisten | Modul `si` (vertiefte Themen) + Modul `b` (RAID/Backup/Virtualisierung) | ✅ Abgedeckt (aufgeteilt auf 2 Module) |
| 12b | 3. | Kundenspezifische Systemintegration durchführen (Abschlussprojekt) | Modul `pr`, durchgehender Projektfall + AP1/AP2-Erklärung | ✅ Abgedeckt |

**Ergebnis: 12 von 12 Lernfeldern werden durch IT-Dart inhaltlich abgedeckt.** Modul `bw` (Karriere & Bewerbung) ordnet sich keinem Lernfeld zu — das ist kein Mangel, sondern bewusster Mehrwert außerhalb des Pflicht-Curriculums (Bewerbungsprozess ist nicht Teil der Lernfelder).

## Ehemalige Lücke (geschlossen 2026-08-06)

**LF7 "Cyber-physische Systeme ergänzen"** (IoT-Integration, 2. Ausbildungsjahr) wurde von keinem der ursprünglich 8 IT-Dart-Module behandelt — ein echter, bisher unbekannter Abdeckungs-Befund (nicht Teil des ursprünglichen Didaktik-Reviews vom 2026-08-05, da dieses nur die 8 vorhandenen Module gegen ihre eigenen Untertitel-Versprechen prüfte, nicht gegen den externen Rahmenplan). Geschlossen durch ein neues Thema 9 "Cyber-physische Systeme & IoT" in Modul `b` (Betriebssysteme & Server) — bewusst kein eigenes 9. Modul, da jedes andere Einzel-Lernfeld ebenfalls als ein Thema in ein bestehendes Modul integriert wurde. Modul `b` gewählt statt `o`/`si`, weil es laut CONTENT-STANDARD.md mit unabhängigen Einzelszenarien pro Thema arbeitet (kein durchgehender Praxisfall-Strang, der künstlich fortgesetzt werden müsste) und inhaltlich als Fortsetzung von Virtualisierung/RAID & Backup passt.

## Ergänzend: FIAusbV-Fertigkeiten (betriebliche Seite, Auszug)

Zeitrichtwerte in Wochen, 1./2. Ausbildungsjahr (M1–18) / 3. Ausbildungsjahr (M19–36):

**Abschnitt A (fachrichtungsübergreifend):** Arbeitsaufgaben planen (12), Kunden informieren/beraten (3+2), IT-Systeme beurteilen (10+5), IT-Lösungen entwickeln (5+7), Qualitätssicherung (4+8), IT-Sicherheit/Datenschutz (6+6), Auftragsabschluss (7), IT-Systeme betreiben (3+3), Speicherlösungen (5, nur Jahr 3), Softwarelösungen programmieren (5+10).

**Abschnitt C (Systemintegration-spezifisch):** IT-Systeme konzipieren/realisieren (8+12), Netzwerke installieren/konfigurieren (5+6), IT-Systeme administrieren (7+14).

Diese Liste bestätigt grob dieselbe Gewichtung wie der Lernfeld-Abgleich oben (Netzwerktechnik, Systemadministration und IT-Sicherheit sind mit Abstand die zeitintensivsten Bereiche) — keine zusätzliche Lücke gegenüber der Lernfeld-Analyse gefunden.

## Nutzungshinweis für den didaktik-content-review-Agenten

Bei einer künftigen Prüfung des dritten Kriteriums ("Abdeckung gegen Rahmenlehrplan (KMK) und FIAusbV") gegen **dieses** Dokument prüfen, nicht gegen eigenes Wissen über den Rahmenplan. Die Tabelle oben ist der Stand 2026-08-06 — bei neuen IT-Dart-Modulen/Themen sollte diese Tabelle mit aktualisiert werden, sonst veraltet sie wie jedes andere Referenzdokument auch.

# IT-Dart — KI-Richtlinien

Konsolidierte Übersicht aller Prinzipien, die IT-Dart beim eigenen Einsatz von KI (Anthropic Claude) auf der Plattform verfolgt — Datenschutz, Jugendschutz und weitere relevante Richtlinien an einem Ort, mit Verweis auf die technische Umsetzung. **Kein Ersatz für anwaltliche Prüfung**, gleiche Einschränkung wie `COMPLIANCE.md`.

**Abgrenzung zu anderen Dokumenten:**
- `COMPLIANCE.md` — allgemeiner Prüfkatalog für *alle* Compliance-relevanten Funktionen (Konten, Zahlungen, Content-Lizenzen, nicht nur KI).
- Dieses Dokument — nur der KI-spezifische Teil, dafür vollständig (alle Einsatzorte, alle Prinzipien).
- `dokumentation/20_KI_Compliance_Modul_Konzept.docx` — eine **unabhängige, unpriorisierte Geschäftsidee** (ein KI-Compliance-Prüfmodul als eigenes verkaufbares Produkt für Drittkunden) — hat nichts mit den eigenen KI-Richtlinien hier zu tun, nicht verwechseln.

**Wann konsultieren:** Vor jeder neuen oder geänderten KI-Funktion (siehe `CLAUDE.md` „KI-Verhalten"), zusätzlich zu `COMPLIANCE.md`.

## Alle KI-Einsatzorte auf der Plattform (Stand 2026-08-01)

| Einsatzort | Datei | Nutzerkreis | Zweck |
|---|---|---|---|
| KI-Lernassistent (Standard-Nachfragen) | `supabase/functions/ai-chat/index.ts`, Modus Default | Free (Module g/o) + Premium | Fachfragen zum aktuellen Thema beantworten |
| Mock-Interview | dto., `mode:"interview"` | Premium | Simuliertes Vorstellungsgespräch |
| Diagnose-Dialog | dto., `mode:"diagnose"` | Premium | Simulierte Netzwerk-Fehlerdiagnose (OSI-Modell) |
| Prüfungsvorbereitung-Auswertung | dto., `mode:"auswertung"` | Premium (50/150-Fragen-Modus) | Kritische Einschätzung der bisherigen Lernzertifikate |
| Admin-Lösungsvorschlag (To-Do-Board) | `supabase/functions/todo-solve/index.ts` | Nur Admin, intern | Lösungsvorschläge inkl. Websuche für interne Aufgaben — verarbeitet keine Nutzerdaten |

## Datenschutz (DSGVO)

- **Datenminimierung beim Versand:** An Anthropic geht nur die konkrete Frage/der Lernkontext (Thema, ggf. eigene Prüfungsstatistik) — nie Konto-, Kontakt- oder Zahlungsdaten. Verifiziert per Codeprüfung von `ai-chat/index.ts`: es wird ausschließlich `ctx`/`question`/`history` an Anthropic übermittelt, niemals `user.email` o. ä.
- **Keine Speicherung des Frage-/Antworttexts bei uns** — er existiert nur clientseitig während der Sitzung. Bei uns gespeichert werden ausschließlich anonyme Nutzungsmetadaten (Modell, Token-Zahl, Kosten) in `ai_usage`, kein Inhalt.
- **Anthropics eigene Aufbewahrung:** API-Ein-/Ausgaben werden bei Anthropic automatisch innerhalb von 30 Tagen gelöscht, keine Nutzung zum Modelltraining (verifiziert per WebFetch gegen `privacy.claude.com`, 2026-07-31 — bei Modell- oder Anbieterwechsel erneut prüfen, nicht aus dem Gedächtnis annehmen).
- **Offenlegung gegenüber Nutzern:** `LegalPages.jsx` → `Datenschutz`, Abschnitt 4 (wer verarbeitet was) und Abschnitt 5 (Speicherdauer) — muss bei jedem neuen KI-Einsatzort (neue Zeile in der Tabelle oben) um einen Satz ergänzt werden, wie bei den bisherigen drei Anwendungsfällen gehandhabt.
- **Rechtsgrundlage:** Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) für Kernfunktionen, die der Nutzer aktiv anfragt — keine Einwilligung nötig, da kein optionales Tracking/Marketing, sondern angefragte Kernleistung.

## Jugendschutz

- **Themenbindung (`SAFETY_CLAUSE`):** Jeder Modus lehnt sexuelle Inhalte, Drogen/Suchtmittel, Gewalt und andere für eine potenziell von Minderjährigen genutzte Plattform ungeeignete Themen ab, unabhängig von der Formulierung der Anfrage. Zentral in `ai-chat/index.ts` definiert, an alle vier Modi angehängt — neue Modi erben das automatisch, sofern die `SAFETY_CLAUSE`-Anhängung nicht vergessen wird (bei jedem neuen System-Prompt gegenprüfen).
- **Themenbindung gilt unabhängig vom Alter für alle Nutzer gleich** — auch nach Aktivierung der Geburtsdatum-Abfrage (`MINOR_CONSENT_ENABLED`, seit 2026-08-06 scharf) baut die `SAFETY_CLAUSE` bewusst nicht auf der Altersangabe auf, sondern gilt themenbezogen für jede Anfrage. Die Geburtsdatum-Abfrage selbst dient DSGVO Art. 8/BGB-Geschäftsfähigkeit und der Anthropic-Altersverifikationspflicht (siehe unten), nicht der Steuerung der KI-Inhalte.
- **Rate-Limit** (`RATE_LIMIT_PER_HOUR = 20`, serverseitig erzwungen) reduziert Abhängigkeits-/Missbrauchsrisiko, gilt für alle Modi gemeinsam.
- **Dialog-Modi (Interview/Diagnose) mit Rundenbegrenzung** (`INTERVIEW_MAX_ROUNDS`/`DIAGNOSE_MAX_ROUNDS = 8`), damit kein endloses, unstrukturiertes Gespräch entsteht.

## Anthropic-Nutzungsrichtlinie — eigene Pflichten als Organisation (Stand 2026-08-06)

Neben unseren eigenen DSGVO-/Jugendschutz-Pflichten verlangt Anthropics Usage Policy (`anthropic.com/legal/aup`, verifiziert per WebFetch, nicht aus einer Sekundärquelle übernommen) von Organisationen wie uns zwei zusätzliche, eigenständige Punkte — deren Nichteinhaltung laut Anthropic zur Suspendierung des API-Zugangs führen kann, unabhängig vom deutschen Recht:

- **KI-Offenlegung bei jedem Chat-Start** ("must disclose … at a minimum at the beginning of each chat session"): Branding/Icon allein reicht nicht. Umgesetzt als expliziter Satz `AIDisclosure` in `AIChat.jsx` (KI-Lernassistent, Mock-Interview, Diagnose-Dialog) und als Hinweiszeile in `Pruefung.jsx` (Prüfungsvorbereitung-Auswertung).
- **Zusätzliche Vorgaben für Organisationen mit Minderjährigen-Nutzerkreis** (Help-Center-Artikel „Responsible use of Anthropic's models: guidelines for organizations serving minors", verlinkt aus der AUP): Altersverifikation, Content-Moderation, Monitoring, Aufklärung, ggf. Kinderschutzrecht-Konformität dokumentieren. Bei uns:
  - Altersverifikation → `MINOR_CONSENT_ENABLED`-Flow (Geburtsdatum + Eltern-Doppel-Opt-in, seit 2026-08-06 scharf geschaltet).
  - Content-Moderation → bereits durch `SAFETY_CLAUSE` oben abgedeckt.
  - Monitoring → Rate-Limit + Rundenbegrenzung (siehe oben), kein dedizierter Melde-Button — als kleinere offene Lücke vermerkt, nicht sicherheitskritisch genug für sofortige Umsetzung.
- **High-Risk-Use-Case-Prüfung:** Mock-Interview/Prüfungsvorbereitung-Auswertung berühren inhaltlich die Kategorien „Employment"/„Academic testing", lösen aber laut Anthropics eigener Definition nur aus, wenn das Ergebnis eine echte Dritt-Entscheidung beeinflusst — bei uns reine Selbstlern-Übung, siehe AGG-Abschnitt unten. Zur Sicherheit trotzdem mit Übungs-/Unverbindlichkeits-Hinweis versehen (siehe oben).

## EU AI Act — Einstufung (Stand 2026-08-08)

Vollständige Recherche/Einschätzung in [docs/EU-AI-ACT-EINSTUFUNG.md](../docs/EU-AI-ACT-EINSTUFUNG.md) (To-Do #131). Kurzfassung: IT-Dart ist für die eigenen KI-Funktionen (Mock-Interview, Diagnose-Dialog, KI-Auswertung) wahrscheinlich **Anbieter** eines eigenen KI-Systems nach Art. 3 Nr. 3 AI Act, nicht nur Betreiber des zugrundeliegenden Anthropic-Modells. Eine Hochrisiko-Einstufung nach Annex III (Bereich Bildung) erscheint nach aktuellem Stand eher nicht einschlägig, mit einer echten Grauzone bei der Trainer-Funktion (B2B) — dort sind Fortschrittsdaten aber reine SQL-Aggregate, kein KI-Output. Die Transparenzpflicht (Art. 50, KI-Offenlegung) ist bereits erfüllt. Endgültige Klärung offen, als konkrete Frage für Anwalt 1 formuliert (siehe verlinktes Dokument, Abschnitt 5).

## Allgemeines Gleichbehandlungsgesetz (AGG) — Einschätzung

**Wahrscheinlich nicht direkt bindend, aber als Prinzip sinnvoll befolgt** (keine anwaltliche Aussage): Das Mock-Interview ist eine Übungssimulation, keine echte Einstellungsentscheidung — die strengen AGG-Vorgaben zu diskriminierungsfreien Fragen in echten Bewerbungsverfahren (§§ 6 ff. AGG) greifen hier rechtlich nicht unmittelbar, da keine reale Beschäftigungsentscheidung getroffen wird. Trotzdem sinnvoll als Vorbild: Der `INTERVIEW_SYSTEM_PROMPT` fragt ausschließlich nach Motivation, Fachwissen und Erfahrung — keine Fragen zu Alter, Herkunft, Religion, Familienstand, Behinderung oder sexueller Orientierung sind vorgesehen. Das entspricht dem, was auch in einem echten, rechtskonformen Bewerbungsgespräch zulässig wäre, und ist bewusst so beizubehalten, wenn der Prompt künftig erweitert wird.

Für den Plattform-Zugang selbst (§ 19 AGG, Massengeschäfte) gilt: Registrierung/Nutzung sind unabhängig von Rasse, ethnischer Herkunft oder Geschlecht zugänglich — es gibt keine entsprechenden Filter- oder Ausschlusskriterien im Code (`AuthScreen.jsx` geprüft).

## Faktentreue-Prinzip — gilt für ALLE KI-Funktionen, nicht nur den Chat

Nicht nur die nutzerseitigen „Chats" (ai-chat, alle vier Modi), auch die interne Admin-„Bearbeitung" (`todo-solve`) muss sich an dasselbe Grundprinzip halten:
- **Nur belegte Informationen verwenden, nichts erfinden.** Bei `mode:"auswertung"` heißt das: nur die übergebenen Zahlen, keine erfundenen Zusatzfakten über die Person. Bei `todo-solve` heißt das: nur was der Aufgabentext oder die Websuche tatsächlich hergibt — bei Unsicherheit das explizit sagen statt zu spekulieren.
- **Ehrlich/kritisch statt beschönigend.** Schwache Ergebnisse klar benennen (Auswertung), unsichere Rechercheergebnisse klar als unsicher kennzeichnen (`todo-solve`) — keine generischen Floskeln statt echter Einschätzung.
- **Verbindlich für jede neue KI-Funktion**, unabhängig davon, ob sie als Chat mit Nutzern oder als interne Bearbeitungshilfe läuft — bei jedem neuen System-Prompt explizit mit aufnehmen, nicht stillschweigend voraussetzen.

Technisch verankert in:
- `ai-chat/index.ts`, `AUSWERTUNG_SYSTEM_PROMPT` ("Nutze ausschließlich diese Zahlen — erfinde keine zusätzlichen Fakten…")
- `todo-solve/index.ts`, `SYSTEM_PROMPT` (Unsicherheits-Hinweis ergänzt statt implizit vorausgesetzt)

## Pflege dieses Dokuments

Bei jeder neuen oder geänderten KI-Funktion: Tabelle oben um den neuen Einsatzort ergänzen, betroffene Abschnitte (Datenschutz/Jugendschutz/AGG) prüfen und bei Bedarf erweitern — nicht erst rückwirkend, siehe `CLAUDE.md` Dokumentenlebenszyklus-Regel.

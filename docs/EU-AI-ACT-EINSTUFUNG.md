# EU AI Act — Einstufung für IT-Dart

Erstellt 2026-08-08 zur Bearbeitung von To-Do #131 ("EU AI Act: Einstufung als KI-Betreiber prüfen"). Reine Recherche/Einschätzung anhand öffentlich zugänglicher Quellen — **kein Ersatz für anwaltliche Prüfung**, gleiche Einschränkung wie `COMPLIANCE.md`/`KI-RICHTLINIEN.md`. Ergebnis unten sollte als konkrete Frage an Anwalt 1 mitgegeben werden (läuft ohnehin bereits, siehe `todos` #128).

## Kurzfassung

- **Die Ausgangsfrage in #131 war zu eng formuliert.** IT-Dart ist nicht nur "Betreiber" — für die selbst gebauten KI-Funktionen (Mock-Interview, Diagnose-Dialog, KI-Auswertung) ist IT-Dart nach Art. 3 Nr. 3 AI Act aller Wahrscheinlichkeit nach **Anbieter eines eigenen KI-Systems**, das intern das GPAI-Modell von Anthropic als Baustein nutzt. Für das GPAI-Modell selbst bleibt Anthropic Anbieter, IT-Dart dort nur Betreiber/Nutzer.
- **Hochrisiko-Einstufung (Annex III, Bildung) nach aktuellem Stand eher nicht einschlägig**, aber mit einer echten Grauzone (Trainer-Funktion) — Details unten.
- **Frist entschärft:** Selbst falls doch Annex III einschlägig wäre, gelten die vollen Hochrisiko-Pflichten laut Digital Omnibus (EU-Rat beschlossen 29.06.2026) erst ab **2. Dezember 2027**, nicht mehr ab August 2026.
- **Bereits erfüllt:** Die Transparenzpflicht nach Art. 50 (KI-Offenlegung bei Chat-Beginn) — unabhängig von der Risikoeinstufung seit August 2026 in Kraft — ist in allen vier KI-Funktionen bereits umgesetzt (`AIDisclosure` in `AIChat.jsx`, Hinweiszeile in `Pruefung.jsx`).

## 1. Rollenverteilung: Anbieter vs. Betreiber

Art. 3 Nr. 3 AI Act definiert "Anbieter" als, wer ein KI-System entwickelt (oder entwickeln lässt) und es unter eigenem Namen/eigener Marke in Verkehr bringt oder in Betrieb nimmt — entgeltlich oder unentgeltlich.

Für die GPAI-Modell-Ebene (Claude selbst) ist die Rollenverteilung klar: Anthropic ist Anbieter des Modells, ein Unternehmen wie IT-Dart, das die API in die eigene Software integriert, ist dort nur Betreiber/Nutzer — genau wie eine Kanzlei, die Claude für Dokumentenanalyse nutzt.

Das betrifft aber nur das Modell. Für die **KI-Systeme, die IT-Dart selbst darüber baut** (System-Prompts, Modus-Routing, Sicherheitsklauseln, Geschäftslogik in `supabase/functions/ai-chat/index.ts`, angeboten unter der eigenen Marke "IT-Dart"/"Bleib am Dart!") greift die Anbieter-Definition direkt: entwickelt (ja, eigene System-Prompts/Logik) + unter eigenem Namen in Betrieb genommen (ja) → IT-Dart ist hier wahrscheinlich **Anbieter**, nicht nur Betreiber. Das gilt für alle vier KI-Einsatzorte aus `KI-RICHTLINIEN.md`.

Praktische Konsequenz, falls bestätigt: Anbieter-Pflichten sind grundsätzlich umfangreicher als Betreiber-Pflichten — relevant wird das aber nur, soweit die einzelnen Funktionen tatsächlich als Hochrisiko-KI eingestuft werden (siehe Abschnitt 2). Für **nicht-hochrisiko** KI-Systeme bleiben die Pflichten unabhängig von Anbieter/Betreiber-Rolle überschaubar (im Wesentlichen die Transparenzpflicht aus Abschnitt 4).

## 2. Hochrisiko-Prüfung (Annex III, Bereich Bildung)

Annex III listet im Bereich Bildung/Berufsbildung vier Unterkategorien als potenziell hochrisikorelevant:
1. Zugang/Zulassung/Zuweisung zu Bildungs- und Berufsbildungseinrichtungen
2. Bewertung von Lernergebnissen, auch wenn diese den weiteren Lernprozess steuern
3. Bewertung des angemessenen Bildungsniveaus einer Person
4. Überwachung/Erkennung unzulässigen Verhaltens während Prüfungen

Entscheidend ist der Anwendungsbereich: die Kategorie gilt laut den ausgewerteten Quellen für Systeme **"im Rahmen von oder innerhalb von Bildungs- und Berufsbildungseinrichtungen"** — nicht pauschal für jedes private Lern-Tool.

**Einschätzung für IT-Dart (B2C, Einzelnutzer):** IT-Dart ist selbst keine Bildungs-/Berufsbildungseinrichtung, sondern ein unabhängiges, freiwillig genutztes Zusatzangebot außerhalb von Berufsschule und Betrieb. Die KI-Auswertung trifft nie eine institutionelle Entscheidung — kein Zugang, keine Note, kein Bestehen/Nichtbestehen der echten IHK-Prüfung. Das ist im Produkt durchgängig abgesichert: expliziter System-Prompt-Guardrail gegen jede Bestehensprognose (`AUSWERTUNG_SYSTEM_PROMPT`), Disclaimer im PDF-Export (`generateAuswertungPdf()`), Haftungsausschluss in den AGB (`LegalPages.jsx`, Punkt 7: "ersetzt keine offizielle Prüfungsvorbereitung durch die zuständige IHK"). Für die reine Selbstlern-Nutzung spricht das klar **gegen** eine Hochrisiko-Einstufung.

**Grauzone: die Trainer-Funktion (B2B).** Ein Ausbildungsbetrieb ist im dualen System rechtlich selbst Teil der Berufsbildung. `TrainerScreen.jsx` zeigt Trainern pro Azubi eine Durchschnittsquote (Ø-Prozent, Modulanzahl, letzte Aktivität) — geprüft: das sind reine SQL-Aggregate aus der `lernnachweise`-Tabelle (`avgPct`, `moduleCount`), **kein KI-Output**. Der eigentliche KI-generierte Auswertungstext (`Pruefung.jsx`, `auswerten()`) wird ausschließlich dem einzelnen Nutzer selbst angezeigt, nie an einen Trainer weitergegeben oder gespeichert — verifiziert per Codeprüfung, keine entsprechende Anzeige/Query in `TrainerScreen.jsx`. Da Annex III sich auf **KI-Systeme** bezieht und die reine Durchschnittsanzeige keine KI ist, dürfte auch die Trainer-Funktion aktuell außerhalb des Anwendungsbereichs liegen. Sollte sich das künftig ändern (z. B. würde der KI-Auswertungstext selbst einem Trainer sichtbar gemacht), wäre die Einschätzung neu zu prüfen.

**Art. 6 Abs. 3 Ausnahme (zusätzliches Sicherheitsnetz, falls die obige Einschätzung falsch läge):** Ein in Annex III gelistetes System gilt trotzdem nicht als hochrisiko, wenn es u. a. nur eine eng gefasste Verfahrensaufgabe erfüllt, ein bereits abgeschlossenes menschliches Ergebnis lediglich verbessert (ohne die zugrunde liegende Bewertung zu ersetzen), oder eine rein vorbereitende Aufgabe für eine anschließend von Menschen durchgeführte Bewertung übernimmt. Die KI-Auswertung (Themenschwächen benennen, keine Bestehensprognose) liegt inhaltlich nahe an "vorbereitende Aufgabe" — aber: diese Ausnahme greift **nicht**, sobald das System natürliche Personen profiliert. Ob die themenweise Auswertung als "Profiling" zählt, ist eine echte Rechtsfrage, keine, die ich hier abschließend beantworten kann.

## 3. Bereits erfüllte Pflicht: Transparenz (Art. 50)

Unabhängig von der Risikoeinstufung gilt seit August 2026 die Pflicht, Nutzer bei Interaktion mit einem KI-System zu informieren, dass sie mit einer KI sprechen. Laut `KI-RICHTLINIEN.md` bereits umgesetzt: expliziter `AIDisclosure`-Hinweis in `AIChat.jsx` (KI-Lernassistent, Mock-Interview, Diagnose-Dialog) und eine Hinweiszeile in `Pruefung.jsx` (KI-Auswertung) — deckt sich zusätzlich mit Anthropics eigener AUP-Pflicht zur KI-Offenlegung, die aus demselben Grund bereits umgesetzt wurde.

## 4. Zeitplan (Digital Omnibus, EU-Rat beschlossen 29.06.2026, unterzeichnet 08.07.2026)

- Verbotene Praktiken: bereits seit Februar 2025 in Kraft, unverändert.
- GPAI-Pflichten (betrifft Anthropic als Modell-Anbieter, nicht IT-Dart direkt): seit August 2025 in Kraft, unverändert.
- Transparenzpflichten (Art. 50, siehe Abschnitt 3): seit August 2026 in Kraft, unverändert — **bei uns bereits erfüllt**.
- Hochrisiko-Pflichten für eigenständige Systeme (Annex III, betrifft die obige Grauzone, falls doch einschlägig): ursprünglich August 2026, durch den Digital Omnibus verschoben auf **2. Dezember 2027**.
- Hochrisiko-Pflichten für sicherheitsrelevante Bauteile in regulierten Produkten (Annex I, für IT-Dart nicht relevant): 2. August 2028.

## 5. Offene Frage für Anwalt 1

Zusammengefasst als eine Frage, die sich direkt in die laufende anwaltliche Prüfung (#128, AGB/Datenschutz/Trainer-Vereinbarung) einreihen lässt:

> Ist IT-Dart für die KI-Funktionen (Mock-Interview, Diagnose-Dialog, KI-Auswertung) Anbieter eines eigenen KI-Systems im Sinne von Art. 3 Nr. 3 AI Act? Fällt insbesondere die KI-Auswertung — auch im Kontext der B2B-Trainer-Funktion, bei der Ausbildungsbetriebe aggregierte (nicht KI-generierte) Fortschrittsdaten ihrer Azubis einsehen können — unter die Hochrisiko-Kategorie "Bewertung von Lernergebnissen" nach Annex III, und wäre die dort beschriebene Themenschwächen-Analyse als "Profiling" im Sinne der Art. 6 Abs. 3-Ausnahme zu werten?

## Quellen (öffentlich, Stand der Recherche 2026-08-08)

- [CERTavia — Was sind Hochrisiko-KI-Systeme? Annex III EU AI Act](https://certavia.org/annex-iii)
- [euai-act.com — Annex III erklärt](https://www.euai-act.com/de/articles/annex-iii-explained)
- [datenschutz-grundverordnung.eu — Art. 6 KI-VO, Einstufungsvorschriften](https://datenschutz-grundverordnung.eu/ai-act/artikel-6-einstufungsvorschriften-fuer-hochrisiko-ki-systeme/)
- [ai-act-law.eu — Art. 6 KI-VO](https://ai-act-law.eu/de/artikel/6/)
- [datenschutz-grundverordnung.eu — Art. 3 KI-VO, Begriffsbestimmungen](https://datenschutz-grundverordnung.eu/ai-act/artikel-3-begriffsbestimmungen/)
- [datenschutz-notizen.de — AI Act: Pflichten für Anbieter von KI-Systemen](https://www.datenschutz-notizen.de/ai-act-pflichten-fuer-anbieter-von-ki-systemen-0949312/)
- [CDT — EU AI Act Brief, GPAI Models](https://cdt.org/insights/eu-ai-act-brief-pt-5-general-purpose-ai-models/)
- [borncity.com — EU-AI-Act: Neue Fristen bis Dezember 2027](https://borncity.com/news/eu-ai-act-neue-fristen-bis-dezember-2027-fuer-hochrisiko-ki/)
- [skill-sprinters.de — Digital Omnibus AI Act 2027: Fristverschiebung](https://skill-sprinters.de/blog/compliance/digital-omnibus-ai-act-fristverschiebung-2027/)

## Nutzungshinweis

Bei jeder neuen KI-Funktion (neue Zeile in der Tabelle in `KI-RICHTLINIEN.md`) diese Einschätzung gegenprüfen — insbesondere, ob die neue Funktion einer Bildungs-/Berufsbildungseinrichtung (auch B2B/Trainer-Kontext) ein KI-generiertes Bewertungsergebnis zugänglich macht, was die Einschätzung in Abschnitt 2 kippen könnte.

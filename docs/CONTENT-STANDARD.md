# IT-Dart Inhaltsstandard: Theorie & Praxisfall

Festgelegt 2026-08-05, ausgelöst durch einen konkreten Qualitätsunterschied innerhalb von Modul `o` (Netzwerktechnik): einzelne Themen wurden im Rahmen des Didaktik-Reviews desselben Tages stark ausgebaut (Vermittlungsschicht, Anwendungsschicht, Bitübertragungsschicht), während Nachbar-Themen (insbesondere Sicherungsschicht) unangetastet blieben — dadurch entstand eine spürbare Ungleichheit in Tiefe und Qualität *innerhalb* eines Moduls, die weder der ursprüngliche Gesamt-Review noch das Follow-up erfasst hatten (beide prüften pro Modul in Summe, nicht Thema-für-Thema-Konsistenz).

**Zweck:** Eine einheitliche, gleichbleibend hohe Qualität für alle Themen aller Module — sowohl beim Verfassen/Überarbeiten von Inhalten als auch bei deren Prüfung (`didaktik-content-review`-Agent, Kriterium 11). Dieser Standard ist die verbindliche Baseline für beides.

## Theorie (`th`) — Struktur

1. **Einleitung + Kernpunkt** (1–2 Sätze): Was ist das Thema, was ist der zentrale Punkt, den man verstehen muss?
2. **Beispiel** (Richtwert: max. 3 Sätze) — ein konkretes, greifbares Beispiel, das den Kernpunkt zeigt, keine bloße Zweit-Definition. **Der Richtwert ist eine Orientierung, keine harte Grenze:** Ein numerisches/technisches Beispiel (z. B. eine Subnetting-Rechnung), das für Vollständigkeit mehr Raum braucht, darf länger sein — Vollständigkeit und fachliche Korrektheit gehen vor Kürze.
3. **Schlusssatz** (1 Satz): Einordnung/Bedeutung — warum das wichtig ist, oder eine Brücke zur Praxis.

## Praxisfall (`pc`) — Struktur

1. **Situationsbenennender Einstieg** — beginnt mit einem kurz benannten Setting (Rolle + Ort + Auslöser), sodass sofort klar ist, worum es geht. Das ist eine **Schreibkonvention innerhalb des bestehenden `pc`-Strings**, kein neues Datenfeld — siehe Hinweis zur Modul-Architektur unten.
2. **Einleitung**: Ausgangssituation.
3. **Erläuterung**: Was passiert, wie wird das Problem angegangen/gelöst.
4. **Schluss mit Tipp**: Fazit + eine explizit gemachte, übertragbare Lehre — nicht nur die Geschichte beenden, sondern die Erkenntnis dahinter benennen.

## Anti-Langweilig-Regel (wichtigste Einzelregel)

Länge ist nicht der eigentliche Grund für einen faden Praxisfall — **fehlende Spannung** ist es. Jeder Praxisfall braucht eines von: ein Problem mit nicht-trivialem Ausgang, eine Entscheidung zwischen Optionen, oder einen Aha-Moment. Eine reine Zustandsbeschreibung ohne Handlung reicht nicht (Negativbeispiel vor der Überarbeitung: *"LED leuchtet, aber keine Verbindung → MAC-Tabelle prüfen, VLAN-Konfiguration checken."* — eine Anweisung, keine Geschichte).

## Modul-Architektur beachten

Module mit **durchgehendem Praxisfall über alle Themen** (`o`, `si`, `sk` — dort das "50-Server-Monitoring"-Motiv —, teilweise `pr`) erzählen bewusst eine einzige, fortlaufende Geschichte — das wurde im Didaktik-Review explizit als Stärke hervorgehoben. Hier **keinen zusätzlichen Pro-Thema-Übertitel** einführen; der situationsbenennende Einstieg (Punkt 1 oben) reicht als leiser Übergang zum nächsten Kapitel derselben Geschichte. Module mit **unabhängigen Einzelszenarien pro Thema** (`g`, `b`, `db`, `bw`) profitieren am meisten von einem klar erkennbaren, eigenständigen Situations-Einstieg pro Thema, da hier keine übergreifende Erzählung existiert, an die angeknüpft werden könnte.

## Ausnahme: Drill-/Übungswerkzeuge

Dieser Standard gilt für Modulinhalte (`th`/`pc` in `moduleContent.js`) — nicht für Drill-Werkzeuge wie den Rechentrainer (`RechentrainerScreen.jsx`, 2026-08-06), die strukturell kein Theorie+Praxisfall+Fragen-Schema haben, sondern unbegrenzt wiederholbare, zufällig generierte Übungsaufgaben mit sofortigem Feedback sind (näher an der Prüfungsvorbereitung als an einem Modul-Thema). Die Theorie/Praxisfall-Struktur und die Anti-Langweilig-Regel oben gelten dafür NICHT direkt. Es gilt aber derselbe Grundsatz übertragen: Feedback muss den vollständigen Rechenweg zeigen, nicht nur „richtig"/„falsch" — eine Erklärung ohne nachvollziehbaren Weg ist für ein Rechenwerkzeug dieselbe Art von Qualitätslücke wie eine reine Zustandsbeschreibung ohne Handlung bei einem Praxisfall.

## Anwendung

Dieser Standard gilt rückwirkend für alle 46 bestehenden Themen (vollständiger Konformitäts-Durchlauf, siehe `todos`) ebenso wie für jedes künftig neu verfasste Thema. Der `didaktik-content-review`-Agent prüft explizit gegen dieses Dokument, nicht gegen eigenes Wissen über "guten Aufbau" — sonst wäre die Prüfung nicht reproduzierbar.

# Simplify-Review (4 parallele Prüf-Winkel): main-Branch

- **Datum:** 2026-08-05
- **Geprüfter Umfang:** `git diff origin/main...HEAD` (9 lokale Commits, 18 Dateien) — Branch-Kosten-Tracking + IT-Dart-Compliance-Feature dieser Sitzung
- **Ausgeführt von:** 4 parallele `general-purpose`-Agenten, je ein Winkel: Reuse, Simplification, Efficiency, Altitude
- **Auftrag:** nur Qualität (Wiederverwendung, Vereinfachung, Effizienz, richtige Abstraktionstiefe) — explizit kein Bug-Fokus, das deckt `/ultrareview` ab. Auf Nutzerwunsch zunächst nur analysiert und vorgeschlagen, dann Punkt für Punkt einzeln bestätigt und umgesetzt.

## Befunde und Ergebnis

| # | Winkel | Befund | Status |
|---|---|---|---|
| 1 | Altitude + Simplification (übereinstimmend) | Rechte-Spaltenliste in `admin_action_log` an 5 Stellen von Hand dupliziert — hatte bereits zweimal echt zugeschlagen | **Behoben** |
| 2 | Efficiency | Trigger feuert bei jedem `profiles`-Update, nicht nur bei Rechteänderungen | **Behoben** |
| 3 | Efficiency | `branch-cost-sync` macht 2 DB-Aufrufe statt 1 (eigener Code-Kommentar zur `ON CONFLICT`-Einschränkung war falsch) | **Behoben, nach eigener Verifikation** |
| 4 | Efficiency | Neuer CI-Schritt läuft blockierend vor der Bereitschaftsprüfung | **Bewusst übersprungen** |
| 5 | Simplification | `PROJEKT-STATUS.md` verstößt gegen die eigene CLAUDE.md-Vorgabe (~10 Zeilen) | **Behoben** |
| 6 | Reuse | `timingSafeEqual()` 1:1 aus `e2e-report-ingest` kopiert statt geteilt | **Behoben** |
| 7 | Reuse | `.claude/agents/security-review.md` dupliziert eine bereits eingebaute, gleichnamige Skill | **Behoben (Datei entfernt)** |
| 8 | Simplification | Zwei CI-Schritte wiederholen fast identischen curl-Code | **Bewusst übersprungen** |

## Details zu den behobenen Punkten

### 1+2 — Single Source of Truth + WHEN-Klausel (`admin_action_log`)

Neue Helper-Funktion `admin_action_log_tracked_columns()` liefert die Spaltenliste einmalig; `log_profile_privilege_change()`/`log_profile_deletion()` bauen ihre jsonb-Snapshots jetzt per Schleife über diese Liste statt hartkodierter `jsonb_build_object`-Aufrufe. Trigger bekam zusätzlich eine `WHEN`-Klausel, sodass die Funktion bei irrelevanten Updates (Nutzername, AGB-Zustimmung, …) gar nicht mehr aufgerufen wird.

**Ehrliche Grenze:** die `WHEN`-Klausel selbst muss ein statischer SQL-Ausdruck sein (kein Array-Loop möglich) — die Spaltenliste taucht deshalb weiterhin an zwei Stellen auf (Array-Literal + `WHEN`-Klausel), nicht mehr an fünf. `FIELD_LABELS` in `AuditLogScreen.jsx` bleibt eine dritte, unvermeidbare Stelle (Anzeige-Texte kennt nur das Frontend).

Migration: `supabase/migrations/20260805070000_admin_action_log_single_source.sql`. Live verifiziert: unbeobachtete Spaltenänderung (`confirmed_at`) erzeugt korrekt **keinen** Log-Eintrag mehr, beobachtete Spalte (`ai_enabled`) weiterhin korrekt.

### 3 — `branch-cost-sync`: ein Aufruf statt zwei

Verifiziert (nicht nur übernommen): `ON CONFLICT (branch_id) WHERE status='active' DO UPDATE` funktioniert tatsächlich gegen den partiellen Unique-Index — mein ursprünglicher Code-Kommentar dazu war falsch. Neue Funktion `branch_cost_log_start()` kapselt das (supabase-js' getyptes `.upsert()` kann die `WHERE`-Klausel selbst nicht ausdrücken). Migration: `20260805080000_branch_cost_log_start_upsert.sql`. Live verifiziert: zwei Aufrufe mit derselben `branch_id` ergeben genau 1 Zeile.

### 5 — `PROJEKT-STATUS.md` zurückgestutzt

Nur die **in dieser Sitzung neu hinzugefügten** zehn Absätze (Teil 19–28) zu einem kurzen Absatz konsolidiert, mit Verweisen auf die eigentlichen Detailquellen (`docs/reviews/`, Migrationsdateien, CLAUDE.md-Abschnitte). Ältere, bereits bestehende Historie bewusst nicht angerührt — das wäre ein eigener, hier nicht beauftragter Umfang.

### 6 — `timingSafeEqual()` geteilt

Neue Datei `supabase/functions/_shared/timingSafeEqual.ts`, beide Funktionen importieren jetzt von dort. **Beide neu deployt und verifiziert:** `branch-cost-sync` mit echtem Testaufruf (200, Zeile korrekt angelegt), `e2e-report-ingest` mit absichtlich falschem Secret (sauberes 401 statt eines Absturzes — bestätigt, dass der Import korrekt auflöst).

### 7 — Doppelte Subagenten-Definition entfernt

`.claude/agents/security-review.md` gelöscht — dupliziert die bereits eingebaute Skill `security-review`. CLAUDE.md verweist jetzt stattdessen darauf. `.claude/agents/datenschutz-review.md` bleibt (keine eingebaute Entsprechung, echte Ergänzung laut Reuse-Prüfung).

## Bewusst übersprungene Punkte (mit Begründung, nicht einfach ignoriert)

**4 — CI-Schritt-Reihenfolge:** Der Vorschlag war, "Branch-Kosten: Start melden" nach der Bereitschaftsprüfung laufen zu lassen. Das würde aber den erfassten `started_at`-Zeitpunkt um die Wartezeit (~20–40s) nach hinten verschieben — die tatsächliche Kostenerfassung würde ungenauer, nicht genauer. Der CI-Zeitgewinn (ein einzelner curl-Aufruf, deutlich unter 1s) steht in keinem sinnvollen Verhältnis zu diesem Genauigkeitsverlust. Übersprungen.

**8 — Duplizierter curl-Code in zwei CI-Schritten:** Eine Zusammenfassung bräuchte eine GitHub-Actions-Composite-Action — neue Datei, neue Indirektion, für ca. 10 gesparte Zeilen in einem Skript, das selten geändert wird. Nicht im Verhältnis zum Nutzen. Übersprungen.

## Geänderte/neue Dateien in diesem Nachgang

- `supabase/migrations/20260805070000_admin_action_log_single_source.sql` (neu)
- `supabase/migrations/20260805080000_branch_cost_log_start_upsert.sql` (neu)
- `supabase/functions/_shared/timingSafeEqual.ts` (neu)
- `supabase/functions/branch-cost-sync/index.ts` (vereinfacht)
- `supabase/functions/e2e-report-ingest/index.ts` (vereinfacht)
- `.claude/agents/security-review.md` (entfernt)
- `CLAUDE.md`, `PROJEKT-STATUS.md` (angepasst)

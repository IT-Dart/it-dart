# Security-Review: Admin-Aktions-Protokoll

- **Datum:** 2026-08-05
- **Geprüfter Commit:** `2f62b2d` — "IT-Dart-Compliance aufgebaut: Admin-Aktions-Protokoll + Zugriffsmodell"
- **Ausgeführt von:** `general-purpose`-Agent als Ersatz für `.claude/agents/security-review.md` (der eigentliche Subagent stand in der laufenden Sitzung noch nicht zur Verfügung, da er erst in derselben Sitzung angelegt wurde — ab der nächsten Sitzung greift er direkt)
- **Auftrag:** Unabhängige Prüfung von `supabase/migrations/20260805040000_admin_action_log.sql`, `src/AuditLogScreen.jsx` und der zugehörigen `ITDart.jsx`-Verdrahtung gegen CLAUDE.md „Sicherheitsprinzipien"/„Sicherheits- & Datenschutzrichtlinien"

## Ergebnis

**Keine ausnutzbaren Schwachstellen gefunden.**

## Geprüfte Punkte

1. **RLS auf `admin_action_log`** — ✅ Sicher. Nur eine SELECT-Policy (`using (is_admin_user())`), keine INSERT/UPDATE/DELETE-Policy existiert (gegen alle Migrationen geprüft) — Default-Deny für `anon`/`authenticated` bei jeder Schreiboperation. Nur die beiden `SECURITY DEFINER`-Trigger-Funktionen (umgehen RLS als Funktionsbesitzer) können schreiben.

2. **SECURITY-DEFINER-Härtung** — ✅ Alle drei neuen Funktionen (`log_profile_privilege_change`, `log_profile_deletion`, `get_admin_action_log`) haben `set search_path = public`. Der `is_admin_user()`-Check in `get_admin_action_log()` ist **tragend, nicht nur kosmetisch**: ohne ihn könnte jeder eingeloggte Nutzer die komplette Tabelle über die RPC lesen, da SECURITY DEFINER die RLS bewusst umgeht. `revoke all ... from public` + `grant execute ... to authenticated` korrekt gesetzt.
   - Kleiner, nicht ausnutzbarer Hinweis: die beiden Trigger-Funktionen selbst haben kein explizites `revoke ... from public` — Postgres verweigert die Ausführung einer Trigger-Rückgabefunktion außerhalb des Trigger-Kontexts aber ohnehin unabhängig von EXECUTE-Rechten, rein kosmetisch.

3. **Trigger-Korrektheit** — ✅ `AFTER UPDATE ... FOR EACH ROW` feuert bei jeder Profil-Änderung; `IS DISTINCT FROM`-Vergleich auf die sechs relevanten Spalten ist NULL-sicher, filtert korrekt. Kaskadierte Löschung (`auth.users` → `profiles`, genutzt von `admin-delete-user`) löst den `AFTER DELETE`-Trigger ebenfalls korrekt aus. Trigger lässt sich nicht über eine exponierte RPC/Edge-Function deaktivieren (braucht Tabellenbesitzer-/DDL-Rechte).

4. **Datenleck-Prüfung** — ✅ Kein Leck an Junior-Admins: `is_admin_user()` prüft spezifisch `is_admin`, nicht `is_junior_admin`. `anon`-Rolle hat keine passende Policy (nur `to authenticated`) → Default-Deny.

5. **Frontend (`AuditLogScreen.jsx`)** — ✅ Keine clientseitige Vertrauensannahme. Ruft nur die RPC auf und rendert das Ergebnis; die `isAdmin`-Gating in `ITDart.jsx` ist reiner UI-Komfort, konsistent mit allen anderen Admin-Screens in diesem Projekt — die eigentliche Durchsetzung liegt serverseitig in der RPC.

## Nicht-sicherheitskritische Beobachtungen

- `actor_email`/`target_email` sind Live-Snapshots zum Abfragezeitpunkt (aktueller `profiles.email`-Stand), keine historischen Snapshots — bei späterer E-Mail-Änderung zeigt ein alter Log-Eintrag die neue Adresse. Nur der Löschpfad snapshotet die E-Mail (`before`-Feld), Frontend fängt das korrekt mit einem Fallback ab.
- Hinweis des Agents, die Migration könnte noch manuell angewendet werden müssen (übliches Deployment-Risiko laut CLAUDE.md) — **bereits erledigt**: Migration wurde diese Sitzung per `apply_migration` angewendet und live mit einem echten Toggle-Test verifiziert (Trigger feuert korrekt, siehe PROJEKT-STATUS.md Teil 21).

## Nachtrag (2026-08-05, nach Nutzer-Rückfrage): Vollständigkeitslücke gefunden

Der Nutzer fragte gezielt nach, ob "RLS auf `admin_action_log`" allein ausreicht, oder ob wichtige Konfigurationen zur **Erfassung aller relevanten Daten** fehlen — eine andere Frage als Zugriffskontrolle, die dieser Review nicht abgedeckt hatte. Nachprüfung ergab zwei echte, verifizierte Lücken (kein Bypass-Risiko, aber unvollständige Protokollierung):

1. **`premium_until` wurde nicht verglichen.** `AdminScreen.jsx`s "+1 Monat"-Button (`grantMonth()`) setzt ausschließlich `premium_until`, nie `is_premium` — eine befristete Premium-Vergabe blieb dadurch komplett unprotokolliert.
2. **`interview_enabled` wurde nicht verglichen.** Die RPC `set_interview_enabled()` sperrt/entsperrt den Zugriff aufs KI-Mock-Interview, ebenfalls unprotokolliert.

Zusätzlich geprüft und **ausgeschlossen**: ob neue Konten direkt mit Rechten angelegt werden können (würde den reinen `AFTER UPDATE`-Trigger umgehen) — `handle_new_user()` setzt beim Anlegen nie Rechte-Spalten direkt, jede Vergabe läuft über ein nachträgliches UPDATE, das der Trigger erfasst.

**Behoben** durch `supabase/migrations/20260805050000_admin_action_log_fix_coverage.sql` — beide Spalten in `log_profile_privilege_change()` ergänzt, live per echtem Toggle-Test auf `premium_until` verifiziert (Log-Eintrag mit korrektem before/after entstand). `AuditLogScreen.jsx`s `FIELD_LABELS` ebenfalls ergänzt, CLAUDE.md-Spaltenliste um `interview_enabled` korrigiert (fehlte dort ebenfalls).

**Lehre:** ein Security-Review, der nur auf Zugriffskontrolle/Bypass prüft, findet keine Vollständigkeits-/Abdeckungslücken bei einem Audit-Log — das braucht eine eigene, gezielte Frage ("erfasst dieser Trigger wirklich jede relevante Spalte, gegen die volle Spaltenliste geprüft").

## Geprüfte Dateien

- `supabase/migrations/20260805040000_admin_action_log.sql` (vollständig, neu)
- `src/AuditLogScreen.jsx` (vollständig, neu)
- `src/ITDart.jsx` (Diff-Ausschnitt)
- `supabase/migrations/20260719060000_admin_fix_recursion.sql` (bestehende `is_admin_user()`-Definition, zur Umgehungs-Prüfung)
- `supabase/migrations/20260719000000_init.sql`, `20260719050000_admin.sql`, `20260721000000_trainer_view.sql`, `20260722010000_junior_admin.sql` (bestehende `profiles`-RLS-Policies, auf widersprüchliche/überschreibende Policy geprüft)
- `supabase/functions/admin-delete-user/index.ts` (zur Verifikation des kaskadierten Löschpfads)
- `CLAUDE.md`, `COMPLIANCE.md` (Doku-Diffs, auf Konsistenz geprüft, keine Sicherheitsbedenken)

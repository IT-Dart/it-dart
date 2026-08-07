import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { credentialsFor } from "../roles.config.js";

// Audit-Befund M9 (2026-08-06): die bisherigen roleA-F-Suiten prüfen nur den
// UI-Pfad einer Rolle (rendert der jeweilige Screen/Button überhaupt?), nie
// die serverseitige Durchsetzung direkt -- ob ein niedrig-privilegierter
// Zugangstoken auch dann abgelehnt wird, wenn man die UI komplett umgeht
// und direkt gegen REST/RPC/Edge Functions feuert. Genau das ist der real
// relevante Angriffsweg (eine Rechteausweitung läuft nie über einen
// Button-Klick, sondern über einen manuellen API-Aufruf) und war bisher
// ungetestet.
//
// Feuert bewusst per Playwright `request` (reines HTTP), NICHT über
// page/den Browser -- kein UI-Login, kein Rendern, nur der nackte
// REST/RPC/Edge-Function-Aufruf mit dem echten Zugangstoken des Trainee-
// Testkontos (keine Admin-/Trainer-/Junior-Admin-Rechte). Erwartung überall:
// 401/403 bzw. leere Ergebnisse -- unabhängig davon, ob die UI diesen Pfad
// überhaupt anbietet.

if (!process.env.BRANCH_URL || !process.env.ANON_KEY) {
  throw new Error('BRANCH_URL/ANON_KEY fehlen -- .github/workflows/e2e-tests.yml, Schritt "Tests ausführen" prüfen.');
}
const BRANCH_URL = process.env.BRANCH_URL;
const ANON_KEY = process.env.ANON_KEY;

// Gleicher Platzhalter wie roleD.junior-admin.spec.js/seed-e2e-users.js --
// existiert auf jedem frischen E2E-Branch mit exakt dieser UUID (fest im
// App-Code als PROTECTED_USER_ID verdrahtet), unabhängig von den vier
// eigentlichen Rollen-Testkonten. Dient hier nur als bekanntes, garantiert
// FREMDES Konto-Ziel -- alle admin-only Functions unten lehnen den Aufruf
// bereits an der Rollenprüfung ab, bevor userId/target_id je ausgewertet
// wird (verifiziert: admin-delete-user, trainer-manage-invite,
// website-check prüfen is_admin/is_trainer VOR dem Body-Parsing), daher
// besteht auch bei einem Fehlschlag dieser Prüfung keine reale Gefahr für
// dieses Konto.
const PROTECTED_USER_ID = "33271bc9-6b8a-456f-9cf1-a5c564218b07";

let traineeToken;
test.beforeAll(async () => {
  const { email, password } = credentialsFor("trainee");
  const supabase = createClient(BRANCH_URL, ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`Trainee-Login für roleG fehlgeschlagen: ${error?.message}`);
  traineeToken = data.session.access_token;
});

function authHeaders() {
  return { apikey: ANON_KEY, Authorization: `Bearer ${traineeToken}` };
}

test("REST: Trainee sieht per Zeilen-RLS keine fremde profiles-Zeile", async ({ request }) => {
  const res = await request.get(`${BRANCH_URL}/rest/v1/profiles?select=id,email&id=eq.${PROTECTED_USER_ID}`, {
    headers: authHeaders(),
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toHaveLength(0);
});

test("REST: parent_email/parent_consent_token bleiben per Spalten-Grant gesperrt (K2-Regression)", async ({ request }) => {
  const res = await request.get(`${BRANCH_URL}/rest/v1/profiles?select=parent_email,parent_consent_token`, {
    headers: authHeaders(),
  });
  expect(res.status()).toBe(403);
  const body = await res.json();
  expect(body.message ?? "").toMatch(/permission denied/i);
});

test("RPC: set_ai_enabled für ein fremdes Konto wird abgelehnt", async ({ request }) => {
  const res = await request.post(`${BRANCH_URL}/rest/v1/rpc/set_ai_enabled`, {
    headers: authHeaders(),
    data: { target_id: PROTECTED_USER_ID, enabled: true },
  });
  expect(res.ok()).toBeFalsy();
  const body = await res.json();
  expect(body.message ?? "").toMatch(/Berechtigung/i);
});

// M5-Regression (heute im selben Durchlauf behoben): fire_uptime_check(),
// collect_uptime_checks() und cleanup_old_csp_reports() hatten kein eigenes
// is_admin_user()-Guard im Funktionskörper und waren nur durch das
// (versehentlich fehlende) EXECUTE-Recht ungeschützt -- genau diese
// REVOKE-Migration hier gegenprüfen.
test("RPC: fire_uptime_check/collect_uptime_checks/cleanup_old_csp_reports bleiben für authenticated gesperrt (M5-Regression)", async ({ request }) => {
  for (const fn of ["fire_uptime_check", "collect_uptime_checks", "cleanup_old_csp_reports"]) {
    const res = await request.post(`${BRANCH_URL}/rest/v1/rpc/${fn}`, { headers: authHeaders(), data: {} });
    expect(res.status(), fn).toBe(403);
  }
});

test.describe("Edge Functions: rollen-exklusive Functions lehnen den Trainee-Token ab", () => {
  const cases = [
    { fn: "invite-user", body: { email: "sollte-nie-ankommen@example.com" } },
    { fn: "todo-solve", body: { todoId: 1 } },
    { fn: "admin-delete-user", body: { userId: PROTECTED_USER_ID } },
    { fn: "website-check", body: {} },
    { fn: "trainer-manage-invite", body: { action: "resend", userId: PROTECTED_USER_ID } },
    { fn: "e2e-trigger-run", body: { suite: "roleA" } },
  ];
  for (const { fn, body } of cases) {
    test(`${fn} lehnt Trainee-Token ab (403)`, async ({ request }) => {
      const res = await request.post(`${BRANCH_URL}/functions/v1/${fn}`, { headers: authHeaders(), data: body });
      expect(res.status(), fn).toBe(403);
    });
  }
});

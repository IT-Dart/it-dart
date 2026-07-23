// Liest Playwrights JSON-Reporter-Ausgabe (results.json) und übersetzt sie
// in das von supabase/functions/e2e-report-ingest erwartete Schema
// (report.json). Läuft als letzter Schritt vor dem curl-Upload in
// .github/workflows/e2e-tests.yml — bewusst ein eigenes, kleines Skript
// statt Logik im Workflow-YAML, damit es lokal testbar bleibt.
//
// Muss unter allen Umständen ein gültiges report.json schreiben, auch wenn
// results.json fehlt, leer, oder kaputt ist (z. B. bei einem Absturz des
// Playwright-Laufs vor Testbeginn) — sonst hat der nachfolgende curl-Schritt
// nichts zum Hochladen (CURLE_READ_ERROR, exit 26) und der Testlauf bleibt
// ohne sichtbaren Grund ohne Ergebnis. Deshalb: alles in try/catch, jeder
// Fehler wird selbst zu einem Befund im Bericht statt zum Absturz des Skripts.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { ROLES } from "../roles.config.js";

const ROLE_LABELS = {
  free: "Rolle A – Eingeladener User ohne Premium",
  trainee: "Rolle B – Trainee",
  trainer: "Rolle C – Trainer",
  juniorAdmin: "Rolle D – Junior-Admin",
};

// specs/roleA.free.spec.js -> "free", etc. — ordnet einen Playwright-
// Dateipfad der Rolle zu, deren Ergebnisse er beisteuert.
function roleForFile(filePath) {
  if (filePath.includes("roleA")) return "free";
  if (filePath.includes("roleB")) return "trainee";
  if (filePath.includes("roleC")) return "trainer";
  if (filePath.includes("roleD")) return "juniorAdmin";
  return null;
}

function collectTests(suites, out = []) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const lastResult = t.results?.[t.results.length - 1];
        out.push({
          file: suite.file || spec.file,
          title: spec.title,
          status: lastResult?.status || "unknown",
          error: lastResult?.error?.message || null,
        });
      }
    }
    collectTests(suite.suites, out);
  }
  return out;
}

function buildPayload() {
  const resultsPath = "results.json";
  let raw = { suites: [] };
  let readError = null;
  if (existsSync(resultsPath)) {
    try {
      raw = JSON.parse(readFileSync(resultsPath, "utf-8"));
    } catch (e) {
      readError = `results.json konnte nicht gelesen werden: ${e.message}`;
    }
  }

  const tests = collectTests(raw.suites);

  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status !== "passed").length;
  const total = tests.length;

  const findings = tests
    .filter((t) => t.status !== "passed")
    .map((t, i) => ({
      id: i + 1,
      symptom: t.title,
      ursache: t.error || "Siehe Playwright-Trace/Screenshot im Actions-Artefakt.",
      fix: "Noch nicht behoben — dieser Lauf hat den Fehler zuerst gemeldet.",
      status: "FEHLER",
    }));

  const byRole = {};
  for (const t of tests) {
    const role = roleForFile(t.file || "");
    if (!role) continue;
    byRole[role] ??= { role: ROLE_LABELS[role] || role, passed: 0, failed: 0 };
    if (t.status === "passed") byRole[role].passed++;
    else byRole[role].failed++;
  }

  const testAccounts = Object.entries(ROLES)
    .filter(([role]) => byRole[role])
    .map(([role, cfg]) => ({ role: ROLE_LABELS[role] || role, email: process.env[cfg.emailEnv] || "(nicht gesetzt)" }));

  const openItems = [];
  if (total === 0) openItems.push("Keine Tests ausgeführt — Suite oder Konfiguration prüfen.");
  if (readError) openItems.push(readError);

  const overallStatus = total === 0 ? "error" : failed === 0 ? "success" : "failure";

  const report = {
    report_version: 1,
    summary: {
      total,
      passed,
      failed,
      status: total === 0 ? "OFFEN" : failed === 0 ? "OK" : "FEHLER",
    },
    findings,
    results_by_role: Object.values(byRole),
    incidents: [],
    open_items: openItems,
    test_accounts: testAccounts,
  };

  return {
    run_id: Number(process.env.E2E_RUN_ID),
    gh_run_id: process.env.GITHUB_RUN_ID ? Number(process.env.GITHUB_RUN_ID) : null,
    gh_workflow_url:
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    status: overallStatus === "error" ? "failure" : overallStatus,
    report,
  };
}

function buildFallbackPayload(errorMessage) {
  return {
    run_id: Number(process.env.E2E_RUN_ID),
    gh_run_id: process.env.GITHUB_RUN_ID ? Number(process.env.GITHUB_RUN_ID) : null,
    gh_workflow_url:
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    status: "failure",
    report: {
      report_version: 1,
      summary: { total: 0, passed: 0, failed: 0, status: "FEHLER" },
      findings: [
        {
          id: 1,
          symptom: "build-report.js konnte den Testbericht nicht erzeugen.",
          ursache: errorMessage,
          fix: "Noch offen.",
          status: "FEHLER",
        },
      ],
      results_by_role: [],
      incidents: [],
      open_items: ["GitHub-Actions-Log dieses Laufs prüfen."],
      test_accounts: [],
    },
  };
}

let payload;
try {
  payload = buildPayload();
} catch (e) {
  payload = buildFallbackPayload(e.message);
}

writeFileSync("report.json", JSON.stringify(payload, null, 2));
console.log(`report.json geschrieben: ${payload.report.summary.passed}/${payload.report.summary.total} bestanden.`);

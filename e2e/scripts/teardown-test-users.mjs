// ÜBERHOLT seit 2026-08-02, bewusst als manueller Fallback im Repo belassen
// (siehe setup-test-users.mjs, gleiche Begründung, Revision in 30 Tagen).
//
// Löscht die vier E2E-Testkonten wieder (Gegenstück zu setup-test-users.mjs).
// Ebenfalls bewusst ein Skript, das DU selbst ausführst.
//
// Aufruf:
//   SUPABASE_SERVICE_ROLE_KEY=... node e2e/scripts/teardown-test-users.mjs
//
// Hartes Löschen (shouldSoftDelete:false-Äquivalent über die Admin-API) —
// entfernt auch die profiles-Zeile (FK cascade), damit ein späteres
// setup-test-users.mjs wirklich frisch anlegt statt auf Leichen zu treffen.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_ENV_PATH = path.join(__dirname, "..", "..", ".env.local");

function loadRootEnvVar(name) {
  try {
    const content = readFileSync(ROOT_ENV_PATH, "utf-8");
    const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || loadRootEnvVar("VITE_SUPABASE_URL");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("SUPABASE_URL nicht gefunden (weder env noch VITE_SUPABASE_URL in .env.local).");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error(
    "Bitte SUPABASE_SERVICE_ROLE_KEY beim Aufruf setzen, z. B.:\n" +
    "  SUPABASE_SERVICE_ROLE_KEY=... node e2e/scripts/teardown-test-users.mjs"
  );
  process.exit(1);
}

const EMAILS = [
  "e2e-free@it-dart-e2e.test",
  "e2e-trainee@it-dart-e2e.test",
  "e2e-trainer@it-dart-e2e.test",
  "e2e-junioradmin@it-dart-e2e.test",
];

async function adminFetch(pathSuffix, options = {}) {
  return fetch(`${SUPABASE_URL}${pathSuffix}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });
}

async function findUserByEmail(email) {
  const res = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const users = data.users || data;
  return Array.isArray(users) ? users.find((u) => u.email === email) || null : null;
}

async function main() {
  for (const email of EMAILS) {
    const user = await findUserByEmail(email);
    if (!user) {
      process.stdout.write(`${email}: nicht gefunden, überspringe.\n`);
      continue;
    }
    const res = await adminFetch(`/auth/v1/admin/users/${user.id}?should_soft_delete=false`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error(`${email}: Löschen fehlgeschlagen: ${await res.text()}`);
      continue;
    }
    process.stdout.write(`${email}: gelöscht.\n`);
  }
  process.stdout.write(
    "\nHinweis: die zugehörigen GitHub-Secrets bleiben stehen (zeigen dann auf ungültige Zugangsdaten) " +
    "— vor dem nächsten Testlauf entweder erneut setup-test-users.mjs ausführen oder Secrets manuell entfernen.\n"
  );
}

main().catch((e) => {
  console.error("Fehler:", e.message);
  process.exit(1);
});

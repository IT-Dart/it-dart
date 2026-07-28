// Einmaliges Setup-Skript für die vier E2E-Testkonten (Rollen A-D).
//
// Bewusst als eigenständiges Skript, das DU selbst ausführst — nicht Claude
// Code. Generiert zufällige Passwörter, legt vier dedizierte Testkonten
// (synthetische @it-dart-e2e.test-Adressen, kein echter Mail-Empfang nötig
// dank email_confirm:true) über die Supabase-Admin-API an, setzt die
// passenden Rollen-Flags/Trainer-Zuordnung, und trägt die acht GitHub-
// Secrets direkt per `gh secret set` ein. Kein Passwort wird je ausgegeben
// oder in eine Datei geschrieben.
//
// Aufruf (SUPABASE_SERVICE_ROLE_KEY nur inline setzen, nie in eine Datei
// schreiben):
//   SUPABASE_SERVICE_ROLE_KEY=... node e2e/scripts/setup-test-users.mjs
//
// Voraussetzung: `gh auth status` ist bereits erfolgreich (siehe README/
// CLAUDE.md), sonst schlägt der secret-set-Schritt fehl.

import { randomBytes } from "crypto";
import { spawnSync } from "child_process";
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
    "  SUPABASE_SERVICE_ROLE_KEY=... node e2e/scripts/setup-test-users.mjs"
  );
  process.exit(1);
}

const GITHUB_REPO = "IT-Dart/it-dart";

const ROLES = [
  { key: "free", email: "e2e-free@it-dart-e2e.test", secretPrefix: "E2E_TEST_FREE", flags: {} },
  { key: "trainee", email: "e2e-trainee@it-dart-e2e.test", secretPrefix: "E2E_TEST_TRAINEE", flags: {} },
  { key: "trainer", email: "e2e-trainer@it-dart-e2e.test", secretPrefix: "E2E_TEST_TRAINER", flags: { is_trainer: true } },
  { key: "juniorAdmin", email: "e2e-junioradmin@it-dart-e2e.test", secretPrefix: "E2E_TEST_JUNIORADMIN", flags: { is_junior_admin: true } },
];

function randomPassword() {
  // 24 Zufallsbytes + feste Suffix-Zeichen, damit übliche Passwort-Policies
  // (Groß-/Kleinbuchstabe, Ziffer, Symbol) sicher erfüllt sind.
  return randomBytes(24).toString("base64url") + "-Aa1!";
}

async function adminFetch(pathSuffix, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${pathSuffix}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });
  return res;
}

async function findUserByEmail(email) {
  const res = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const users = data.users || data;
  return Array.isArray(users) ? users.find((u) => u.email === email) || null : null;
}

async function createOrUpdateUser(email, password) {
  const createRes = await adminFetch("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (createRes.ok) {
    return await createRes.json();
  }
  // Konto existiert schon (z. B. Skript-Wiederholung) — Passwort aktualisieren.
  const existing = await findUserByEmail(email);
  if (!existing) {
    const detail = await createRes.text();
    throw new Error(`Anlegen von ${email} fehlgeschlagen und kein bestehendes Konto gefunden: ${detail}`);
  }
  const updateRes = await adminFetch(`/auth/v1/admin/users/${existing.id}`, {
    method: "PUT",
    body: JSON.stringify({ password }),
  });
  if (!updateRes.ok) {
    throw new Error(`Passwort-Update für ${email} fehlgeschlagen: ${await updateRes.text()}`);
  }
  return existing;
}

async function patchProfile(userId, flags) {
  if (Object.keys(flags).length === 0) return;
  const res = await adminFetch(`/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(flags),
  });
  if (!res.ok) {
    throw new Error(`Profil-Update für ${userId} fehlgeschlagen: ${await res.text()}`);
  }
}

async function linkTrainerTrainee(trainerId, traineeId) {
  const res = await adminFetch("/rest/v1/trainer_trainees", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ trainer_id: trainerId, trainee_id: traineeId }),
  });
  if (!res.ok) {
    throw new Error(`Trainer-Trainee-Verknüpfung fehlgeschlagen: ${await res.text()}`);
  }
}

function ghSecretSet(name, value) {
  const result = spawnSync(
    "gh",
    ["secret", "set", name, "--repo", GITHUB_REPO],
    { input: value, encoding: "utf-8" }
  );
  if (result.status !== 0) {
    throw new Error(`gh secret set ${name} fehlgeschlagen: ${result.stderr}`);
  }
}

async function main() {
  const createdUsers = {};

  for (const role of ROLES) {
    const password = randomPassword();
    process.stdout.write(`Lege Testkonto für Rolle "${role.key}" an (${role.email})...\n`);
    const user = await createOrUpdateUser(role.email, password);
    await patchProfile(user.id, role.flags);
    ghSecretSet(`${role.secretPrefix}_EMAIL`, role.email);
    ghSecretSet(`${role.secretPrefix}_PASSWORD`, password);
    createdUsers[role.key] = user;
  }

  process.stdout.write("Verknüpfe Trainee mit Trainer...\n");
  await linkTrainerTrainee(createdUsers.trainer.id, createdUsers.trainee.id);

  process.stdout.write("\nFertig. E2E-Testkonten (nur E-Mails, Passwörter wurden nie angezeigt):\n");
  for (const role of ROLES) {
    process.stdout.write(`  ${role.key.padEnd(12)} ${role.email}\n`);
  }
  process.stdout.write("\nAlle 8 GitHub-Secrets sind gesetzt. Testlauf kann jetzt ausgelöst werden.\n");
}

main().catch((e) => {
  console.error("Fehler:", e.message);
  process.exit(1);
});

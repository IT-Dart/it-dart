// Legt auf einem frischen Supabase-Branch (siehe .github/workflows/e2e-tests.yml)
// vier Test-Accounts an -- je einen pro E2E-Rolle (free/trainee/trainer/
// juniorAdmin) -- mit zufaelligen Einmal-Passwoertern, statt wie frueher
// dauerhafte Test-Accounts in der Produktivdatenbank zu pflegen (die manuell
// aufgeraeumt werden mussten, siehe To-Do #74). Der Branch wird nach dem Lauf
// ohnehin komplett geloescht, daher reichen wegwerfbare Zugangsdaten.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.BRANCH_URL;
const serviceKey = process.env.SERVICE_KEY;
if (!url || !serviceKey) {
  console.error("BRANCH_URL/SERVICE_KEY fehlen.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const randomPassword = () => crypto.randomBytes(18).toString("base64url");

// ACTIVE_HEALTHY (siehe .github/workflows/e2e-tests.yml, "Auf Branch-
// Bereitschaft warten") bestaetigt nur, dass die Postgres-Instanz des neuen
// Branches laeuft -- PostgREST (die REST-Schicht, ueber die supabase-js
// .from()-Aufrufe laufen) braucht danach noch ein paar Sekunden, um seinen
// Schema-Cache neu zu laden und die gerade per Migrations-Replay neu
// entstandenen Tabellen ueberhaupt zu kennen. Ohne diese Wartefunktion
// schlaegt der allererste .from()-Aufruf zuverlaessig mit "Could not find
// the table 'public.profiles' in the schema cache" fehl (real aufgetreten,
// erster scharfer Testlauf dieser Pipeline 2026-08-02).
async function waitForPostgrestSchema(maxAttempts = 10, delayMs = 3000) {
  for (let i = 1; i <= maxAttempts; i++) {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (!error) return;
    console.log(`PostgREST-Schema-Cache noch nicht bereit (Versuch ${i}/${maxAttempts}): ${error.message}`);
    if (i < maxAttempts) await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("PostgREST-Schema-Cache wurde nach mehreren Versuchen nicht bereit.");
}
await waitForPostgrestSchema();

async function createTestUser(localPart, profileUpdates = null) {
  const email = `e2e-${localPart}-${Date.now()}@sandbox.it-dart.de`;
  const password = randomPassword();
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`createUser(${localPart}) fehlgeschlagen: ${error.message}`);
  const userId = data.user.id;
  if (profileUpdates) {
    const { error: updErr } = await supabase.from("profiles").update(profileUpdates).eq("id", userId);
    if (updErr) throw new Error(`profiles-Update(${localPart}) fehlgeschlagen: ${updErr.message}`);
  }
  return { email, password, userId };
}

const free = await createTestUser("free");
const trainer = await createTestUser("trainer", { is_trainer: true });
const trainee = await createTestUser("trainee");
const juniorAdmin = await createTestUser("junioradmin", { is_junior_admin: true });

// Rolle B (roleB.trainee.spec.js) prueft die "Dein Trainer"-Ansicht im
// Hilfe-Bereich -- braucht dafuer eine echte trainer_trainees-Zuordnung.
const { error: linkErr } = await supabase
  .from("trainer_trainees")
  .insert({ trainer_id: trainer.userId, trainee_id: trainee.userId });
if (linkErr) throw new Error(`trainer_trainees-Verknuepfung fehlgeschlagen: ${linkErr.message}`);

// Reine key=value-Zeilen auf stdout -- der Workflow-Schritt liest sie ein und
// exportiert sie als maskierte GITHUB_ENV-Variablen fuer die Playwright-Tests
// (dieselben Variablennamen, die roles.config.js ohnehin erwartet).
const out = {
  E2E_TEST_FREE_EMAIL: free.email,
  E2E_TEST_FREE_PASSWORD: free.password,
  E2E_TEST_TRAINEE_EMAIL: trainee.email,
  E2E_TEST_TRAINEE_PASSWORD: trainee.password,
  E2E_TEST_TRAINER_EMAIL: trainer.email,
  E2E_TEST_TRAINER_PASSWORD: trainer.password,
  E2E_TEST_JUNIORADMIN_EMAIL: juniorAdmin.email,
  E2E_TEST_JUNIORADMIN_PASSWORD: juniorAdmin.password,
};
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);

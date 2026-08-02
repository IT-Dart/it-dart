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
// Branches laeuft -- der gesamte uebrige Stack (PostgREST-Schema-Cache,
// Connection-Pooler) bootet daneben offenbar noch nach und ist kurz danach
// noch nicht vollstaendig konsistent. Real durchlaufene Fehlerbilder direkt
// nacheinander: "Could not find the table 'public.profiles'", dann "Could
// not find the 'is_trainer' column", dann eine Fremdschluessel-Verletzung
// bei einem Insert auf eine gerade erst erstellte Zeile (vermutlich
// Pooler-Verzoegerung, kein Schema-Cache-Fehlerbild im engeren Sinn). Daher
// hier bewusst NICHT auf eine bestimmte Fehlermeldung filtern, sondern jeden
// .from()-Aufruf in dieser fruehen Bootstrap-Phase pauschal wiederholen.
async function withStartupRetry(label, fn, maxAttempts = 8, delayMs = 3000) {
  let lastResult;
  for (let i = 1; i <= maxAttempts; i++) {
    lastResult = await fn();
    if (!lastResult.error) return lastResult;
    if (i === maxAttempts) return lastResult;
    console.log(`${label}: noch fehlgeschlagen, vermutlich Branch-Bootstrap-Verzögerung (Versuch ${i}/${maxAttempts}): ${lastResult.error.message}`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return lastResult;
}

async function createTestUser(localPart, profileUpdates = null) {
  const email = `e2e-${localPart}-${Date.now()}@sandbox.it-dart.de`;
  const password = randomPassword();
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`createUser(${localPart}) fehlgeschlagen: ${error.message}`);
  const userId = data.user.id;
  if (profileUpdates) {
    const { error: updErr } = await withStartupRetry(
      `profiles-Update(${localPart})`,
      () => supabase.from("profiles").update(profileUpdates).eq("id", userId)
    );
    if (updErr) throw new Error(`profiles-Update(${localPart}) fehlgeschlagen: ${updErr.message}`);
  }
  return { email, password, userId };
}

const free = await createTestUser("free");
const trainer = await createTestUser("trainer", { is_trainer: true });
const trainee = await createTestUser("trainee");
const juniorAdmin = await createTestUser("junioradmin", { is_junior_admin: true });

// roleD.junior-admin.spec.js prueft die zentrale Sicherheitsgrenze des
// geschuetzten Hauptkontos (is_protected_account() in den Migrationen,
// PROTECTED_USER_ID in den Edge Functions) -- dessen UUID ist fest im
// Code verdrahtet, nicht rollenbasiert. Auf einem frischen Branch gibt es
// dieses Konto nicht (Branches kopieren bewusst keine echten Nutzerdaten),
// deshalb hier ein Platzhalter mit EXAKT derselben UUID + E-Mail, damit der
// Test die reale Schutzregel trotzdem sinnvoll pruefen kann -- keine
// echten Zugangsdaten, nur die ID stimmt ueberein.
const PROTECTED_USER_ID = "33271bc9-6b8a-456f-9cf1-a5c564218b07";
const { error: protectedErr } = await supabase.auth.admin.createUser({
  id: PROTECTED_USER_ID,
  email: "coskunselimbulut@gmail.com",
  password: randomPassword(),
  email_confirm: true,
});
if (protectedErr) throw new Error(`Platzhalter fuer geschuetztes Hauptkonto fehlgeschlagen: ${protectedErr.message}`);

// Rolle B (roleB.trainee.spec.js) prueft die "Dein Trainer"-Ansicht im
// Hilfe-Bereich -- braucht dafuer eine echte trainer_trainees-Zuordnung.
const { error: linkErr } = await withStartupRetry(
  "trainer_trainees-Verknuepfung",
  () => supabase.from("trainer_trainees").insert({ trainer_id: trainer.userId, trainee_id: trainee.userId })
);
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

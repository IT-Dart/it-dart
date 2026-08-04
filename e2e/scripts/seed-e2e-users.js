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
// trainee_limit:2 statt des Standards 5 -- die Kontingent-Tests in
// roleC.trainer.spec.js brauchen dafuer nur eine einzige echte Einladung
// (der Trainee unten zaehlt schon als 1/2), nicht vier.
const trainer = await createTestUser("trainer", { is_trainer: true, trainee_limit: 2 });
// is_premium:true -- roleB.trainee.spec.js testet damit auch Pfade, die ohne
// Premium gar nicht erreichbar sind (BW-Modul, Netzwerktechnik-Thema 7,
// echter Lernnachweis-PDF-Download).
const trainee = await createTestUser("trainee", { is_premium: true });
const juniorAdmin = await createTestUser("junioradmin", { is_junior_admin: true });
const admin = await createTestUser("admin", { is_admin: true });
// Rein passives Ziel-Konto fuer roleE.admin.spec.js (Premium/Trainer/
// Junior-Admin vergeben+entziehen, am Ende loeschen) -- niemals eines der
// vier Rollen-Konten selbst dafuer verwenden, sonst gibt es einen echten
// Race gegen deren EIGENE, parallel laufende Tests (z. B. wuerde ein
// Premium-Toggle auf "free" waehrend roleA.free.spec.js noch dessen
// Free-Status prueft, dort zufaellig fehlschlagen).
const adminTarget = await createTestUser("admintarget");

// --- To-Do #105: Registrierung/Passwort-Reset/Magic-Link -------------------
// Kein echter E-Mail-Versand/-Empfang noetig: generateLink() erzeugt exakt
// denselben Bestaetigungs-/Reset-/Einladungslink, der sonst per E-Mail
// verschickt wuerde (dasselbe Muster wie supabase/functions/invite-user/
// index.ts fuer den manuell teilbaren Link). Playwright navigiert direkt
// dorthin und testet damit die echte App-Seite (Session-Aufbau, Passwort
// setzen, Hash-Handling) -- die reine Zustellung ist Supabase/SMTP-Sache,
// nicht App-Logik.
//
// Muss zu BASE_URL im Workflow (.github/workflows/e2e-tests.yml, "Tests
// ausfuehren") passen -- die Seed-Phase hat kein window.location, daher
// hier fest verdrahtet statt hergeleitet.
const REDIRECT_TO = "http://localhost:5173";

// generateLink(type:"signup") legt den (unbestaetigten) Nutzer direkt an,
// genau wie ein echter supabase.auth.signUp()-Aufruf aus der App -- kein
// vorheriges createUser() noetig.
const { data: signupLinkData, error: signupLinkErr } = await withStartupRetry(
  "generateLink(signup)",
  () => supabase.auth.admin.generateLink({
    type: "signup",
    email: `e2e-regconfirm-${Date.now()}@sandbox.it-dart.de`,
    password: randomPassword(),
    options: { redirectTo: REDIRECT_TO },
  })
);
if (signupLinkErr) throw new Error(`generateLink(signup) fehlgeschlagen: ${signupLinkErr.message}`);
const signupConfirmLink = signupLinkData.properties.action_link;

const resetTarget = await createTestUser("resettarget");
const { data: recoveryLinkData, error: recoveryLinkErr } = await supabase.auth.admin.generateLink({
  type: "recovery",
  email: resetTarget.email,
  options: { redirectTo: REDIRECT_TO },
});
if (recoveryLinkErr) throw new Error(`generateLink(recovery) fehlgeschlagen: ${recoveryLinkErr.message}`);
const passwordResetLink = recoveryLinkData.properties.action_link;

// type:"invite" (nicht "magiclink") -- AuthContext.jsx prueft explizit
// "type=invite" im URL-Hash (src/lib/AuthContext.jsx, inviteFromUrl), das
// ist der einzige Linktyp ohne eigenes Supabase-Auth-Event.
const { data: inviteLinkData, error: inviteLinkErr } = await supabase.auth.admin.generateLink({
  type: "invite",
  email: `e2e-invitetarget-${Date.now()}@sandbox.it-dart.de`,
  options: { redirectTo: REDIRECT_TO },
});
if (inviteLinkErr) throw new Error(`generateLink(invite) fehlgeschlagen: ${inviteLinkErr.message}`);
// KEIN ?mode=einladung-Wrapping hier (anders als im echten Einladungs-Flow,
// invite-user/index.ts): App.jsx validiert einen solchen Link gegen
// SUPABASE_VERIFY_PREFIX, das fest auf die PRODUKTIONS-Projekt-URL verdrahtet
// ist (vukqjpqawzhfvpjjpipp.supabase.co) -- auf dem wegwerfbaren E2E-Branch
// hat der generierte Link zwangsläufig eine andere Projekt-URL und würde die
// Prüfung nie bestehen. EinladungScreen.jsx selbst bleibt dadurch bewusst
// ungetestet (siehe To-Do-Notiz unten) -- der rohe Link testet aber weiterhin
// den eigentlichen, custom gebauten type=invite-Verarbeitungspfad danach.
const inviteLink = inviteLinkData.properties.action_link;

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
  E2E_TEST_ADMIN_EMAIL: admin.email,
  E2E_TEST_ADMIN_PASSWORD: admin.password,
  // Kein Passwort -- adminTarget loggt sich nie selbst ein, nur
  // roleE.admin.spec.js sucht per E-Mail danach.
  E2E_TEST_ADMINTARGET_EMAIL: adminTarget.email,
  // To-Do #105: resettarget braucht seine E-Mail fuer den LIVE-Teil des
  // Tests ("Passwort vergessen"-Formular ausfuellen) -- das ORIGINAL-
  // Passwort wird nie gebraucht, der Test setzt ueber den Recovery-Link ein
  // neues. Die drei *_LINK-Variablen sind echte Auth-Token und werden vom
  // Workflow genau wie *_PASSWORD maskiert.
  E2E_TEST_RESETTARGET_EMAIL: resetTarget.email,
  E2E_TEST_SIGNUP_CONFIRM_LINK: signupConfirmLink,
  E2E_TEST_PASSWORD_RESET_LINK: passwordResetLink,
  E2E_TEST_INVITE_LINK: inviteLink,
};
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);

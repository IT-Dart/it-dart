import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

// To-Do #105: Registrierung/Passwort-Reset/Magic-Link. Kein echter
// E-Mail-Versand/-Empfang nötig -- generateLink() erzeugt exakt denselben
// Bestätigungs-/Reset-/Einladungslink, der sonst per E-Mail verschickt
// würde (dasselbe Muster wie invite-user/index.ts für den manuell
// teilbaren Link). Playwright navigiert direkt dorthin und testet damit
// die echte App-Seite (Session-Aufbau, Passwort setzen, Hash-Handling) --
// die reine Zustellung ist Supabase/SMTP-Sache, nicht App-Logik.
//
// To-Do #109: die Links werden bewusst HIER, direkt im Test unmittelbar
// vor Gebrauch generiert, NICHT im Seed-Skript -- ein erster Versuch mit
// Vorgenerierung im Seed-Skript scheiterte, weil die Links Minuten später
// (nachdem roleA-E schon gelaufen waren) bereits abgelaufen/ungültig waren.
//
// Bewusst NICHT getestet: die ?mode=einladung-Zwischenseite
// (EinladungScreen.jsx) selbst -- App.jsx validiert deren Link gegen die
// fest verdrahtete PRODUKTIONS-Projekt-URL, die auf dem wegwerfbaren
// E2E-Branch nie zutrifft. Der rohe Einladungslink danach ist trotzdem
// abgedeckt (Test 3).

// Diagnose (Run 51) zeigte: der generierte Link enthielt "redirect_to=
// https://it-dart.de" statt localhost, obwohl explizit localhost angegeben
// wurde -- generateLink() ignorierte den Wert offenbar, weil er nicht exakt
// gegen den konfigurierten Redirect-URL-Eintrag (localhost:5173/** mit
// abschliessendem Slash vor dem Wildcard) passte. Mit Slash statt bar.
const REDIRECT_TO = "http://localhost:5173/"; // muss zum Redirect-URL-Eintrag passen
if (!process.env.BRANCH_URL || !process.env.SERVICE_KEY) {
  throw new Error("BRANCH_URL/SERVICE_KEY fehlen -- .github/workflows/e2e-tests.yml, Schritt \"Tests ausführen\" prüfen.");
}
const admin = createClient(process.env.BRANCH_URL, process.env.SERVICE_KEY);
const randomPassword = () => crypto.randomBytes(18).toString("base64url");

// Beide Screens (Recovery und Invite) landen auf derselben
// ResetPasswordScreen.jsx ("Neues Passwort setzen") -- gemeinsamer Helper.
async function setNewPasswordAndExpectSuccess(page, newPassword) {
  // Großzügiges Timeout -- nach der Umleitung muss supabase-js erst den
  // Hash-Fragment-Token verarbeiten und die Sitzung aufbauen, bevor
  // ResetPasswordScreen überhaupt rendert.
  await expect(page.getByRole("heading", { name: "Neues Passwort setzen" })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Neues Passwort").fill(newPassword);
  await page.getByPlaceholder("Passwort bestätigen").fill(newPassword);

  // To-Do #108: auch bei Recovery-Links (nicht nur Invite, wie ursprünglich
  // angenommen) kann supabase-js die Sitzung im Hintergrund noch nicht
  // fertig persistiert haben, obwohl ResetPasswordScreen schon rendert --
  // ein sofortiges Abschicken (schneller als ein Mensch) liefert dann
  // einmalig "Auth session missing!" statt Erfolg. 3x1s reichte nicht immer
  // (Run 52), jetzt großzügiger. ResetPasswordScreen.jsx bleibt bei einem
  // Fehler unverändert stehen (Formularwerte bleiben erhalten), ein
  // erneuter Klick reicht, sobald die Sitzung tatsächlich steht.
  for (let attempt = 1; attempt <= 6; attempt++) {
    await page.getByRole("button", { name: "Passwort ändern →" }).click();
    const success = await page.getByRole("heading", { name: "Passwort geändert" }).isVisible({ timeout: 3_000 }).catch(() => false);
    if (success) break;
    if (attempt === 6) throw new Error("Passwort-Änderung nach 6 Versuchen weiterhin fehlgeschlagen.");
    await page.waitForTimeout(2_000);
  }
  // ResetPasswordScreen.jsx lädt 1200ms nach Erfolg automatisch neu.
  await page.waitForTimeout(1_800);
}

test("Registrierung: Formular zeigt korrekt die deaktivierten Signups + Bestätigungslink funktioniert trotzdem", async ({ page }) => {
  test.setTimeout(30_000);
  const freshEmail = `e2e-liveregister-${Date.now()}@sandbox.it-dart.de`;

  await page.goto("/?mode=register");
  await page.getByPlaceholder("E-Mail").fill(freshEmail);
  await page.getByPlaceholder("Passwort", { exact: true }).fill("SicheresE2E-Passwort1!");
  await page.getByPlaceholder("Passwort bestätigen").fill("SicheresE2E-Passwort1!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Konto erstellen →" }).click();
  // To-Do #107: Supabase Auth hat "Enable email signups" projektweit
  // deaktiviert (von der Produktion geerbt) -- das öffentliche Formular
  // kann aktuell nie wirklich ein Konto anlegen. Dieser Test dokumentiert
  // bewusst den aktuellen (nicht den ursprünglich beabsichtigten) Zustand.
  await expect(page.getByText("Signups not allowed for this instance", { exact: false })).toBeVisible();

  // Der Bestätigungs-KLICK selbst bleibt unabhängig davon testbar: die
  // Admin-API (generateLink) legt das Konto direkt an, ohne über das
  // (deaktivierte) öffentliche signUp() zu laufen.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: `e2e-regconfirm-${Date.now()}@sandbox.it-dart.de`,
    password: randomPassword(),
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw new Error(`generateLink(signup) fehlgeschlagen: ${error.message}`);
  await page.goto(data.properties.action_link);
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });
});

test("Passwort-Reset: Formular live + Reset-Link setzt ein neues, dauerhaft gültiges Passwort", async ({ page }) => {
  test.setTimeout(60_000);
  const email = process.env.E2E_TEST_RESETTARGET_EMAIL;
  if (!email) throw new Error("E2E_TEST_RESETTARGET_EMAIL fehlt -- seed-e2e-users.js prüfen.");

  // Teil 1: das echte Formular anstoßen (live, kein Bypass) -- bewusst MIT
  // einer anderen, beliebigen Adresse: ein zweiter echter
  // resetPasswordForEmail()-Aufruf für resetTarget selbst würde den gleich
  // danach per generateLink() erzeugten Recovery-Link sofort wieder
  // ungültig machen (real aufgetreten: "Link ungültig oder abgelaufen").
  // Die Erfolgsmeldung verrät ohnehin bewusst nicht, ob die Adresse
  // wirklich existiert.
  await page.goto("/?mode=login");
  await page.getByRole("button", { name: "Passwort vergessen?" }).click();
  await page.getByPlaceholder("E-Mail").fill(`e2e-livereset-${Date.now()}@sandbox.it-dart.de`);
  await page.getByRole("button", { name: "Link senden →" }).click();
  await expect(page.getByText("Falls diese E-Mail bei uns registriert ist", { exact: false })).toBeVisible();

  // Teil 2: der eigentliche Reset-Klick, Link unmittelbar vor Gebrauch
  // generiert (To-Do #109 -- vorgenerierte Links liefen sonst ab).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw new Error(`generateLink(recovery) fehlgeschlagen: ${error.message}`);
  const newPassword = "NeuesE2E-Passwort2!";
  await page.goto(data.properties.action_link);
  await setNewPasswordAndExpectSuccess(page, newPassword);
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });

  // Teil 3: zusätzliche Sicherheit, dass das neue Passwort wirklich
  // dauerhaft (nicht nur für die laufende Sitzung) gilt -- abmelden und mit
  // dem neuen Passwort frisch einloggen.
  await page.getByRole("button", { name: "Abmelden" }).click();
  await page.goto("/?mode=login");
  await page.getByPlaceholder("E-Mail").fill(email);
  await page.getByPlaceholder("Passwort", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Anmelden →" }).click();
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });
});

test("Magic-Link/Einladung: roher Link führt zur Passwort-Setzen-Seite und danach ins Konto", async ({ page }) => {
  test.setTimeout(60_000);
  // type:"invite" (nicht "magiclink") -- AuthContext.jsx prüft explizit
  // "type=invite" im URL-Hash, das ist der einzige Linktyp ohne eigenes
  // Supabase-Auth-Event.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: `e2e-invitetarget-${Date.now()}@sandbox.it-dart.de`,
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw new Error(`generateLink(invite) fehlgeschlagen: ${error.message}`);

  await page.goto(data.properties.action_link);
  await setNewPasswordAndExpectSuccess(page, "EingeladenE2E-Passwort3!");
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });
});

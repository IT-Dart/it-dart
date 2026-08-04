import { test, expect } from "@playwright/test";

// To-Do #105: Registrierung/Passwort-Reset/Magic-Link. Kein echter
// E-Mail-Versand/-Empfang nötig -- seed-e2e-users.js generiert die
// Bestätigungs-/Reset-/Einladungslinks direkt über die Supabase Admin-API
// (generateLink), exakt dasselbe Muster wie invite-user/index.ts für den
// manuell teilbaren Link. Playwright navigiert direkt dorthin und testet
// damit die echte App-Seite (Session-Aufbau, Passwort setzen, Hash-
// Handling) -- die reine Zustellung ist Supabase/SMTP-Sache, nicht
// App-Logik.
//
// Bewusst NICHT getestet: die ?mode=einladung-Zwischenseite
// (EinladungScreen.jsx) selbst -- App.jsx validiert deren Link gegen die
// fest verdrahtete PRODUKTIONS-Projekt-URL, die auf dem wegwerfbaren
// E2E-Branch nie zutrifft (siehe Kommentar in seed-e2e-users.js). Der rohe
// Einladungslink danach ist trotzdem abgedeckt (Test 3).

// Beide Screens (Recovery und Invite) landen auf derselben
// ResetPasswordScreen.jsx ("Neues Passwort setzen") -- gemeinsamer Helper.
async function setNewPasswordAndExpectSuccess(page, newPassword) {
  // Großzügiges Timeout -- nach der Umleitung muss supabase-js erst den
  // Hash-Fragment-Token verarbeiten und die Sitzung aufbauen, bevor
  // ResetPasswordScreen überhaupt rendert.
  await expect(page.getByRole("heading", { name: "Neues Passwort setzen" })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Neues Passwort").fill(newPassword);
  await page.getByPlaceholder("Passwort bestätigen").fill(newPassword);

  // To-Do #108: bei Einladungslinks (type=invite) wird recoveryMode
  // synchron aus dem URL-Hash gesetzt (AuthContext.jsx), unabhängig davon
  // ob supabase-js die Sitzung aus demselben Hash im Hintergrund schon
  // fertig aufgebaut hat. Ein sofortiges Abschicken (hier bewusst schneller
  // als ein Mensch) kann dadurch einmalig "Auth session missing!" statt
  // Erfolg liefern -- ResetPasswordScreen.jsx bleibt danach unverändert
  // stehen (Formularwerte bleiben erhalten), ein erneuter Klick reicht,
  // sobald die Sitzung tatsächlich steht.
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.getByRole("button", { name: "Passwort ändern →" }).click();
    const success = await page.getByRole("heading", { name: "Passwort geändert" }).isVisible({ timeout: 3_000 }).catch(() => false);
    if (success) break;
    if (attempt === 3) throw new Error("Passwort-Änderung nach 3 Versuchen weiterhin fehlgeschlagen.");
    await page.waitForTimeout(1_000);
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
  // Admin-API (generateLink in seed-e2e-users.js) legt das Konto direkt
  // an, ohne über das (deaktivierte) öffentliche signUp() zu laufen.
  const confirmLink = process.env.E2E_TEST_SIGNUP_CONFIRM_LINK;
  if (!confirmLink) throw new Error("E2E_TEST_SIGNUP_CONFIRM_LINK fehlt -- seed-e2e-users.js prüfen.");
  await page.goto(confirmLink);
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });
});

test("Passwort-Reset: Formular live + Reset-Link setzt ein neues, dauerhaft gültiges Passwort", async ({ page }) => {
  test.setTimeout(30_000);
  const email = process.env.E2E_TEST_RESETTARGET_EMAIL;
  const resetLink = process.env.E2E_TEST_PASSWORD_RESET_LINK;
  if (!email || !resetLink) throw new Error("E2E_TEST_RESETTARGET_EMAIL/E2E_TEST_PASSWORD_RESET_LINK fehlen -- seed-e2e-users.js prüfen.");

  // Teil 1: das echte Formular anstoßen (live, kein Bypass) -- bewusst MIT
  // einer anderen, beliebigen Adresse: ein zweiter echter
  // resetPasswordForEmail()-Aufruf für resetTarget selbst würde den im
  // Seed-Skript bereits vorgenerierten Recovery-Link ungültig machen,
  // bevor Teil 2 unten ihn nutzt (real aufgetreten: "Link ungültig oder
  // abgelaufen"). Die Erfolgsmeldung verrät ohnehin bewusst nicht, ob die
  // Adresse wirklich existiert.
  await page.goto("/?mode=login");
  await page.getByRole("button", { name: "Passwort vergessen?" }).click();
  await page.getByPlaceholder("E-Mail").fill(`e2e-livereset-${Date.now()}@sandbox.it-dart.de`);
  await page.getByRole("button", { name: "Link senden →" }).click();
  await expect(page.getByText("Falls diese E-Mail bei uns registriert ist", { exact: false })).toBeVisible();

  // Teil 2: der eigentliche Reset-Klick über den vorbereiteten Link.
  const newPassword = "NeuesE2E-Passwort2!";
  await page.goto(resetLink);
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
  test.setTimeout(30_000);
  const inviteLink = process.env.E2E_TEST_INVITE_LINK;
  if (!inviteLink) throw new Error("E2E_TEST_INVITE_LINK fehlt -- seed-e2e-users.js prüfen.");

  await page.goto(inviteLink);
  await setNewPasswordAndExpectSuccess(page, "EingeladenE2E-Passwort3!");
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });
});

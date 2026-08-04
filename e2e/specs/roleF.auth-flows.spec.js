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
//
// To-Do #108: updateUser() lieferte hier zuverlässig "Auth session missing!"
// -- sowohl bei Recovery- als auch bei Invite-Links. Per interaktivem
// Browser-Debugging (2026-08-04) gefunden: die frische Recovery-Session
// wurde durch den eigenen Session-Kickout-Mechanismus (Realtime-Kanal
// reagiert auf die eigene claim_session()-Änderung) noch vor dem Absenden
// des Formulars wieder abgemeldet. Fix in AuthContext.jsx: der
// Heartbeat/Kickout-Effect läuft jetzt nicht mehr während recoveryMode.
// Dieser Test prüft, ob der Fix wirkt (kein test.fail() mehr).
async function setNewPasswordAndExpectSuccess(page, newPassword) {
  // Großzügiges Timeout -- nach der Umleitung muss supabase-js erst den
  // Hash-Fragment-Token verarbeiten und die Sitzung aufbauen, bevor
  // ResetPasswordScreen überhaupt rendert.
  await expect(page.getByRole("heading", { name: "Neues Passwort setzen" })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Neues Passwort").fill(newPassword);
  await page.getByPlaceholder("Passwort bestätigen").fill(newPassword);
  // Weder "Passwort geändert" (nur ~1200ms sichtbar) noch page.waitForEvent
  // ("load", scheiterte real am 2026-08-04 -- feuert für den
  // window.location.reload() hier offenbar nicht zuverlässig als
  // Playwright-Event) sind brauchbare Zwischen-Prüfungen. Echt reproduziert:
  // der Nutzer war in allen drei Testläufen bereits erfolgreich eingeloggt
  // ("Angemeldet als ..." im Accessibility-Snapshot), obwohl beide
  // Zwischen-Prüfungen das nicht erkannten. Playwright-Locators lösen sich
  // bei jedem Retry gegen das aktuelle Dokument auf und überleben damit
  // einen zwischenzeitlichen Reload von selbst -- kein Zwischenschritt
  // nötig, der Aufrufer-seitige "Lernpfad starten"-Check direkt danach
  // ist die eigentliche, robuste Erfolgsprüfung.
  await page.getByRole("button", { name: "Passwort ändern →" }).click();
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

// To-Do #108: siehe Kommentar bei setNewPasswordAndExpectSuccess oben --
// testet den Fix (Kickout-Effect pausiert während recoveryMode).
test("Passwort-Reset: Formular live + Reset-Link setzt ein neues, dauerhaft gültiges Passwort", async ({ page }) => {
  test.setTimeout(30_000);
  const email = process.env.E2E_TEST_RESETTARGET_EMAIL;
  if (!email) throw new Error("E2E_TEST_RESETTARGET_EMAIL fehlt -- seed-e2e-users.js prüfen.");

  // Teil 1: das echte Formular anstoßen (live UI-Code-Pfad, kein Bypass der
  // App-Logik) -- die zugrunde liegende Supabase-Auth-Anfrage selbst wird
  // aber gemockt: ein echter resetPasswordForEmail()-Aufruf würde einen
  // realen Zustellversuch an eine garantiert nicht existierende Adresse
  // auslösen (E-Mail-Bounce, siehe echter Supabase-Warnhinweis zu
  // Bounce-Raten 2026-08-04) -- und die Erfolgsmeldung verrät ohnehin
  // bewusst nicht, ob die Adresse wirklich existiert, der Test braucht die
  // echte Zustellung also gar nicht. resetTarget selbst NICHT verwenden:
  // ein zweiter echter Aufruf würde den gleich danach per generateLink()
  // erzeugten Recovery-Link sofort wieder ungültig machen (real
  // aufgetreten: "Link ungültig oder abgelaufen").
  await page.route("**/auth/v1/recover*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.goto("/?mode=login");
  await page.getByRole("button", { name: "Passwort vergessen?" }).click();
  await page.getByPlaceholder("E-Mail").fill(`e2e-livereset-${Date.now()}@sandbox.it-dart.de`);
  await page.getByRole("button", { name: "Link senden →" }).click();
  await expect(page.getByText("Falls diese E-Mail bei uns registriert ist", { exact: false })).toBeVisible();
  await page.unroute("**/auth/v1/recover*");

  // Teil 2: der eigentliche Reset-Klick, Link unmittelbar vor Gebrauch
  // generiert (To-Do #109 -- vorgenerierte Links liefen sonst ab).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw new Error(`generateLink(recovery) fehlgeschlagen: ${error.message}`);
  // Zufällig statt fest -- ein Retry (Playwright retries:1) startet den
  // kompletten Test neu und würde mit einem festen Passwort auf ein Konto
  // treffen, das es aus dem vorherigen (fehlgeschlagenen) Versuch bereits
  // trägt: "Das neue Passwort muss sich vom bisherigen unterscheiden."
  const newPassword = randomPassword();
  await page.goto(data.properties.action_link);
  await setNewPasswordAndExpectSuccess(page, newPassword);
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });

  // Teil 3: zusätzliche Sicherheit, dass das neue Passwort wirklich
  // dauerhaft (nicht nur für die laufende Sitzung) gilt -- abmelden und mit
  // dem neuen Passwort frisch einloggen.
  // Der Klick löst signOut() nur asynchron aus (Playwright wartet nicht auf
  // dessen Abschluss) -- ohne diese Bestätigung navigiert page.goto() manchmal
  // los, BEVOR AuthContext.jsx die Sitzung wirklich aus localStorage entfernt
  // hat. Die neu geladene Seite würde dann die noch nicht gelöschte ALTE
  // Sitzung wiederherstellen, die kurz darauf mit der frischen Neuanmeldung
  // um dieselbe Konto-Sitzung kollidiert (reproduziert 2026-08-04: die neue
  // Anmeldung kickte sich dadurch selbst wieder raus).
  await page.getByRole("button", { name: "Abmelden" }).click();
  // Nach Abmelden bleibt App.jsx auf page="app" (kein Reset auf "company"),
  // ein anonymer Nutzer landet dort direkt auf dem Anmelden-Screen -- NICHT
  // auf WartungScreen (das gilt nur für page==="company"). Live per Snapshot
  // verifiziert 2026-08-04.
  await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible({ timeout: 10_000 });
  await page.goto("/?mode=login");
  await page.getByPlaceholder("E-Mail").fill(email);
  await page.getByPlaceholder("Passwort", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Anmelden →" }).click();
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });
});

// To-Do #108: testet denselben Fix wie der Passwort-Reset-Test oben, nur
// für den Invite-Link-Pfad.
test("Magic-Link/Einladung: roher Link führt zur Passwort-Setzen-Seite und danach ins Konto", async ({ page }) => {
  test.setTimeout(30_000);
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

// Regressionstest für einen real vom Nutzer gemeldeten Bug (2026-08-04): ein
// bereits angemeldeter Nutzer, der auf dem Cover-Screen "Über IT-Dart"
// anklickt (onOpenLegal("company") -> App.jsx), landete wegen WARTUNGSMODUS
// auf WartungScreen.jsx statt der echten CompanyScreen -- inklusive deren
// eigenem "Hier anmelden"-Link. Ein zweiter, erfolgreicher Login-Versuch
// dort hätte per Single-Session-Enforcement (claim-session) die eigene,
// noch aktive Sitzung hinausgeworfen (App.jsx zeigte WartungScreen
// unabhängig vom Login-Status; ITDart.jsx zeigte view "auth" rein aus dem
// URL-Parameter, ebenfalls unabhängig vom Login-Status). Fix: beide Stellen
// prüfen jetzt zusätzlich !user.
test('Angemeldeter Nutzer bleibt nach Klick auf "Über IT-Dart" eingeloggt', async ({ page }) => {
  test.setTimeout(30_000);
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: `e2e-ueberitdart-${Date.now()}@sandbox.it-dart.de`,
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw new Error(`generateLink(invite) fehlgeschlagen: ${error.message}`);
  await page.goto(data.properties.action_link);
  await setNewPasswordAndExpectSuccess(page, "UeberItDartE2E-Passwort4!");
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Über IT-Dart" }).click();
  // Muss die echte CompanyScreen zeigen, NICHT WartungScreen.
  await expect(page.getByRole("heading", { name: "Vision" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Wir sind gerade im Aufbau.")).toHaveCount(0);

  // Zurück in die App -- muss weiterhin angemeldet sein, nicht erneut das
  // Login-Formular sehen.
  await page.getByRole("button", { name: /Zum Lerntool/ }).click();
  await expect(page.getByRole("button", { name: /Lernpfad starten/ })).toBeVisible({ timeout: 10_000 });
});

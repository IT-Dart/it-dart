import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers.js";

// Rolle E — Voll-Admin. Deckt To-Do #103: bisher gab es kein admin-
// Testkonto, AdminScreen.jsx (Nutzerverwaltung) und die sechs admin-
// exklusiven Unterwerkzeuge waren komplett ungetestet. Läuft nur unter der
// "full"-Suite mit (kein eigener Eintrag in playwright.config.js/
// e2eSuites.js/ALLOWED_SUITES -- bewusst schlank gehalten, kann bei Bedarf
// später ergänzt werden).
//
// adminTarget (E2E_TEST_ADMINTARGET_EMAIL, siehe seed-e2e-users.js) ist ein
// rein passives Ziel-Konto ohne eigenes Login -- NIE eines der vier
// Rollen-Konten selbst für Premium/Rechte-Toggles verwenden, sonst Race
// gegen deren eigene, parallel laufende Tests.

test("Admin: Nutzer verwalten (Premium/Trainer/Junior-Admin vergeben+entziehen, aktives Konto löschen)", async ({ page }) => {
  test.setTimeout(30_000);
  const targetEmail = process.env.E2E_TEST_ADMINTARGET_EMAIL;
  if (!targetEmail) throw new Error("E2E_TEST_ADMINTARGET_EMAIL fehlt -- seed-e2e-users.js prüfen.");

  await loginAs(page, "admin");
  await page.getByRole("button", { name: "⚙️ Admin" }).click();
  await expect(page.getByText("⚙️ Admin")).toBeVisible();

  await page.getByPlaceholder("E-Mail suchen...").fill(targetEmail);
  await page.getByRole("button", { name: "Suchen" }).click();
  // "🗑 Löschen" statt eines Text-Badges ("Free" etc.) zum Eingrenzen --
  // Badges ändern sich im Testverlauf, der Löschen-Button ist von Anfang
  // bis Ende immer genau einmal pro Zeile vorhanden (AdminScreen.jsx,
  // canDeleteThis gilt für Admins immer). .last(), da sowohl die äußere
  // Zeile als auch ihr innerer Header-Container die E-Mail enthalten,
  // aber nur die äußere auch den Löschen-Button (gleiches Muster wie
  // roleD.junior-admin.spec.js).
  const deleteButton = page.getByRole("button", { name: "🗑 Löschen" });
  const row = page.locator("div").filter({ hasText: targetEmail }).filter({ has: deleteButton }).last();
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Dauerhaft freischalten" }).click();
  await expect(row.getByText("⭐ Dauerhaft")).toBeVisible();

  await row.getByRole("button", { name: "🎓 Zum Trainer machen" }).click();
  await expect(row.getByText("🎓 Trainer")).toBeVisible();

  await row.getByRole("button", { name: "🧑‍💼 Zum Junior-Admin machen" }).click();
  await expect(row.getByText("🧑‍💼 Junior-Admin")).toBeVisible();

  // revoke() in AdminScreen.jsx nimmt Premium, Trainer UND Junior-Admin
  // gleichzeitig zurück -- ein Klick genügt für alle drei Badges.
  await row.getByRole("button", { name: "Zugang entziehen" }).click();
  await expect(row.getByText("⭐ Dauerhaft")).toHaveCount(0);
  await expect(row.getByText("🎓 Trainer")).toHaveCount(0);
  await expect(row.getByText("🧑‍💼 Junior-Admin")).toHaveCount(0);

  // Löschen eines AKTIVEN (bestätigten) Kontos ist admin-exklusiv --
  // Junior-Admins dürfen laut roleD.junior-admin.spec.js nur ausstehende
  // Einladungen löschen. deleteUser() nutzt window.confirm() vor dem
  // eigentlichen Request.
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "🗑 Löschen" }).click();
  await expect(page.getByText(targetEmail)).toHaveCount(0);
});

// Leichte Rendering-Prüfung der sechs admin-exklusiven Unterwerkzeuge --
// bewusst ohne Klick auf echte Schreib-/Kosten-Aktionen (z. B. "▶ Testlauf
// starten" in E2ETestScreen würde einen ECHTEN, rekursiven E2E-Lauf
// auslösen; "🔍 Lösung suchen" in TodoScreen einen echten Anthropic-
// Aufruf). Es geht nur darum, dass jeder Screen überhaupt lädt, nicht um
// seine volle Funktionalität.
test("Admin: alle sechs Unterwerkzeuge öffnen sich fehlerfrei", async ({ page }) => {
  test.setTimeout(30_000);
  await loginAs(page, "admin");

  const tools = [
    { button: "🧪 E2E-Tests", heading: "🧪 E2E-Tests" },
    { button: "🌐 Website-Check", heading: "🌐 Website-Check" },
    { button: "💰 Kosten", heading: "💰 Kosten" },
    { button: "🩺 Monitoring", heading: "🩺 Monitoring" },
    { button: "✅ To-Do", heading: "✅ To-Do" },
    { button: "💬 Feedback", heading: "💬 Feedback" },
  ];

  for (const tool of tools) {
    await page.getByRole("button", { name: tool.button }).click();
    await expect(page.getByText(tool.heading)).toBeVisible();
    await page.getByRole("button", { name: "← Zurück" }).click();
  }
});

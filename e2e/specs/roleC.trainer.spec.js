import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers.js";

// Rolle C — Trainer. Prüft die Trainer-Ansicht (Trainee-Liste, KI-Steuerung
// je Trainee) — die eigentliche Verwaltungsfläche, in der der reale Bug
// dieser Session (fehlende Auto-Zuordnung bei Trainer+Junior-Admin) gefunden
// wurde.

test("Trainer-Ansicht zeigt zugeordnete Trainees mit KI-Steuerung", async ({ page }) => {
  await loginAs(page, "trainer");
  await page.getByRole("button", { name: /Trainer-Ansicht/ }).click();
  await expect(page.getByText(/Testende:/)).toBeVisible();
  await expect(page.getByRole("button", { name: /KI (sperren|freischalten)/ }).first()).toBeVisible();
});

// Der Trainer-Testaccount hat seit dem Seed-Skript (2026-08-04) bewusst nur
// trainee_limit:2 statt der Standard-5 -- der Trainee aus dem Seed zählt
// bereits als 1/2, eine einzige echte Einladung reicht also, um sowohl die
// Zuweisungsaktion (#98) als auch die Kontingent-Grenze (#97) zu testen,
// statt vier zusätzliche E-Mails an sandbox.it-dart.de zu verschicken.
test("Neuen Trainee einladen (#98) und Kontingent-Grenze wird durchgesetzt (#97)", async ({ page }) => {
  test.setTimeout(30_000);
  await loginAs(page, "trainer");
  await page.getByRole("button", { name: /Trainer-Ansicht/ }).click();
  await expect(page.getByText("Testende: 1 / 2")).toBeVisible();

  const inviteEmail = `e2e-invited-${Date.now()}@sandbox.it-dart.de`;
  await page.getByPlaceholder("schueler@beispiel.de").fill(inviteEmail);
  await page.getByRole("button", { name: "Einladen" }).click();
  await expect(page.getByText(`Einladung an ${inviteEmail} verschickt und dir zugeordnet.`)).toBeVisible({ timeout: 20_000 });

  // Nach dem erfolgreichen Einladen laedt TrainerScreen.jsx die Trainee-
  // Liste automatisch neu (load()) -- Kontingent steht jetzt bei 2/2,
  // atCapacity greift, das Formular verschwindet zugunsten der Sperrmeldung.
  await expect(page.getByText("Kontingent voll (2/2)", { exact: false })).toBeVisible();
  await expect(page.getByPlaceholder("schueler@beispiel.de")).toHaveCount(0);
});

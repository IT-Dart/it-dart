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

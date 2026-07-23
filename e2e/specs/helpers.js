import { expect } from "@playwright/test";
import { credentialsFor } from "../roles.config.js";

// Meldet eine frische Playwright-Browser-Session (kein bestehendes Login)
// über den Cover-Screen an — Feldbeschriftungen/Button-Texte spiegeln
// src/AuthScreen.jsx exakt (placeholder="E-Mail"/"Passwort", Button
// "Anmelden →").
export async function loginAs(page, role) {
  const { email, password } = credentialsFor(role);
  await page.goto("/");
  await page.getByRole("button", { name: /Anmelden \/ Registrieren/ }).click();
  await page.getByPlaceholder("E-Mail").fill(email);
  await page.getByPlaceholder("Passwort").fill(password);
  await page.getByRole("button", { name: /^Anmelden/ }).click();
  await expect(page.getByText(email, { exact: false })).toBeVisible({ timeout: 10_000 });
}

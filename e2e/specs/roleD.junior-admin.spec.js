import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers.js";

// Rolle D — Junior-Admin. Prüft die zentrale Sicherheitsgrenze dieser Rolle:
// das geschützte Hauptkonto darf über keinen Schreibpfad veränderbar sein.

test("Eingeschränkter Zugang wird kommuniziert", async ({ page }) => {
  await loginAs(page, "juniorAdmin");
  await page.getByRole("button", { name: /Junior-Admin/ }).click();
  await expect(page.getByText("Eingeschränkter Zugang", { exact: false })).toBeVisible();
});

test("Geschütztes Hauptkonto: keine Aktion ist auslösbar", async ({ page }) => {
  await loginAs(page, "juniorAdmin");
  await page.getByRole("button", { name: /Junior-Admin/ }).click();
  await page.getByPlaceholder("E-Mail suchen...").fill("coskunselimbulut@gmail.com");
  await page.getByRole("button", { name: "Suchen" }).click();

  const row = page.locator("div").filter({ hasText: "coskunselimbulut@gmail.com" }).last();
  await expect(row.getByRole("button", { name: /KI (sperren|freischalten)/ })).toBeDisabled();
});

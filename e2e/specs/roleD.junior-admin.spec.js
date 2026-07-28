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

  // .last() allein greift auf den falschen verschachtelten Div — sowohl die
  // äußere Zeile als auch ihr innerer Header-Container enthalten den
  // E-Mail-Text, aber nur die äußere Zeile enthält auch die Buttons. Zweiter
  // Filter (has: KI-Button) erzwingt den richtigen, äußeren Container.
  const kiButton = page.getByRole("button", { name: /KI (sperren|freischalten)/ });
  const row = page.locator("div").filter({ hasText: "coskunselimbulut@gmail.com" }).filter({ has: kiButton }).last();
  await expect(row.getByRole("button", { name: /KI (sperren|freischalten)/ })).toBeDisabled();
});

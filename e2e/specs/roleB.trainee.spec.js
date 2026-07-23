import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers.js";

// Rolle B — Trainee (einem Trainer zugeordnet). Ergänzt Rolle A um die
// trainee-spezifische Sicht im Hilfe-Bereich.

test("Hilfe-Bereich zeigt den zugeordneten Trainer", async ({ page }) => {
  await loginAs(page, "trainee");
  await page.getByRole("button", { name: /❓ Hilfe/ }).click();
  await expect(page.getByText("Dein Trainer", { exact: false })).toBeVisible();
});

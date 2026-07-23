import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers.js";

// Rolle A — eingeladener User ohne Premium. Übersetzt die manuelle
// Checkliste dieser Session (Freemium-Modulgrenzen, Premium-Gate beim
// Lernnachweis-Download) in wiederholbare Prüfungen.

test("Free-Konto zeigt korrekten Status und Freemium-Grenzen", async ({ page }) => {
  await loginAs(page, "free");
  await expect(page.getByText("Free", { exact: false })).toBeVisible();
  await expect(page.getByText("Grundlagen IT")).toBeVisible();
  await expect(page.getByText("Verfügbar").first()).toBeVisible();
  await expect(page.getByText("🔒 Premium").first()).toBeVisible();
});

test("Lernnachweis-Download bleibt ohne Premium gesperrt (Regressionstest)", async ({ page }) => {
  await loginAs(page, "free");
  await page.getByRole("button", { name: /Prüfungsvorbereitung/i }).click();
  await page.getByRole("button", { name: /^Schnelltest/i }).click();

  // Schnelltest (20 Fragen) zügig mit der jeweils ersten Antwortoption
  // durchklicken, bis das Ergebnis erscheint — Korrektheit ist hier
  // irrelevant, es geht nur um die Sperre am Ende, nicht um ein bestimmtes
  // Prozentergebnis. Jede Frage rendert genau 4 Options-Buttons (siehe
  // src/Pruefung.jsx, q.o.map) ohne Navigations-Buttons wie "Neu"/"Zur App".
  const navButtonNames = /Neu|Zur App|Nächste Frage|Ergebnis anzeigen/;
  for (let i = 0; i < 20; i++) {
    const resultHeading = page.getByRole("heading", { name: /richtig — \d+%/ });
    if (await resultHeading.isVisible().catch(() => false)) break;
    const optionButtons = page.locator("button").filter({ hasNotText: navButtonNames });
    await optionButtons.first().waitFor({ state: "visible" });
    await optionButtons.first().click();
    await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/i }).click();
  }

  await expect(page.getByText("Lernnachweis-Download ist ein Premium-Feature", { exact: false })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /Lernnachweis herunterladen/i })).toHaveCount(0);
});

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
  // 20 echte Interaktionsrunden gegen die Live-Seite sprengen leicht das
  // globale 30s-Timeout (playwright.config.js) — nur dieser Test bekommt
  // mehr Luft, statt das Timeout für alle anderen, schnelleren Tests
  // pauschal anzuheben.
  test.setTimeout(90_000);
  await loginAs(page, "free");
  await page.getByRole("button", { name: /Prüfungsvorbereitung/i }).click();
  // Kein ^-Anker: der Button rendert die Zahl (20) in einem eigenen <div>
  // VOR dem Label, der zugängliche Name lautet also "20Schnelltest", nicht
  // "Schnelltest..." (src/Pruefung.jsx, Start-Buttons).
  await page.getByRole("button", { name: /Schnelltest/i }).click();

  // Schnelltest (20 Fragen) zügig mit der jeweils ersten Antwortoption
  // durchklicken, bis das Ergebnis erscheint — Korrektheit ist hier
  // irrelevant, es geht nur um die Sperre am Ende, nicht um ein bestimmtes
  // Prozentergebnis. Jede Frage rendert genau 4 Options-Buttons (siehe
  // src/Pruefung.jsx, q.o.map) ohne Navigations-Buttons wie "Neu"/"Zur App".
  const navButtonNames = /Neu|Zur App|Nächste Frage|Ergebnis anzeigen/;
  for (let i = 0; i < 20; i++) {
    const resultHeading = page.getByRole("heading", { name: /richtig — \d+%/ });
    if (await resultHeading.isVisible().catch(() => false)) break;
    // "button:visible", nicht nur "button" — App.jsx hält ITDart.jsx beim
    // Prüfungs-Screen dauerhaft im DOM (nur per CSS display:none versteckt,
    // nie unmounted), sonst greift .first() auf einen dort verstecken,
    // niemals sichtbar werdenden Button (z. B. "📊 Statistik") statt auf
    // eine echte Antwortoption.
    const optionButtons = page.locator("button:visible").filter({ hasNotText: navButtonNames });
    await optionButtons.first().waitFor({ state: "visible" });
    await optionButtons.first().click();
    await page.getByRole("button", { name: /Nächste Frage|Ergebnis anzeigen/i }).click();
  }

  // Die "Premium-Feature"-Sperrmeldung rendert in src/Pruefung.jsx nur bei
  // mindestens 50% richtig (pct>=50) — bei "immer erste Option" ist das
  // nicht garantiert. Die eigentliche Regression (Download-Button darf für
  // Free-Konten NIE erscheinen) gilt unabhängig vom Ergebnis und wird immer
  // geprüft; die Sperrmeldung nur, wenn die Schwelle tatsächlich erreicht wurde.
  const resultText = await page.getByText(/richtig — \d+%/).textContent();
  const pct = parseInt(resultText?.match(/(\d+)%/)?.[1] ?? "0", 10);
  if (pct >= 50) {
    await expect(page.getByText("Lernnachweis-Download ist ein Premium-Feature", { exact: false })).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole("button", { name: /Lernnachweis herunterladen/i })).toHaveCount(0);
});

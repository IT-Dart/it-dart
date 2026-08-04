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

// Deckt den Rendering-Pfad ab, den keine der vier Rollen-Specs bisher
// anfasst: ein Modul tatsächlich öffnen (view==="mod"). Damit werden
// Hdr/Pips/Scene/AIChat/Quiz erstmals überhaupt automatisiert ausgeführt --
// bewusst ohne echten KI-Aufruf (kein Klick auf "Fragen"/"→" im
// AIChat-Panel), um keine Anthropic-API-Kosten pro CI-Lauf zu erzeugen.
test("Modul G: Lernpfad-Themen bis Quiz-Ergebnis (Scene/Hdr/Pips/AIChat)", async ({ page }) => {
  test.setTimeout(90_000);
  await loginAs(page, "free");
  await page.getByRole("button", { name: /Grundlagen IT/ }).click();
  await page.getByRole("button", { name: /Lernpfad starten/ }).click();

  // Erstes Thema: Hdr (Zurück-Button), Scene (SVG mit viewBox "0 0 680 …",
  // src/Scene.jsx) und das AIChat-Panel müssen sichtbar sein, ohne dass
  // irgendetwas davon angeklickt wird.
  await expect(page.getByRole("button", { name: /Übersicht/ })).toBeVisible();
  await expect(page.locator('svg[viewBox^="0 0 680"]')).toBeVisible();
  await expect(page.getByText("KI-Lernassistent")).toBeVisible();
  await expect(page.getByPlaceholder("Eigene Frage...")).toBeVisible();

  // Alle 6 Themen von Modul G durchklicken (n:6 in src/lib/modules.js) --
  // letzter Klick heißt "🎯 Zum Quiz →" statt "Weiter →" (src/ITDart.jsx).
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: /Weiter →|Zum Quiz →/ }).click();
  }

  // Quiz.jsx: FREE_QUIZ_N=5 Fragen für Free-Konten. Options-Buttons von
  // "← Übersicht" (Hdr, bleibt während des Quiz sichtbar) abgrenzen.
  const navNames = /Übersicht|Nächste Frage|Ergebnis →/;
  for (let i = 0; i < 6; i++) {
    const resultText = page.getByText(/richtig — \d+%/);
    if (await resultText.isVisible().catch(() => false)) break;
    const optionButtons = page.locator("button:visible").filter({ hasNotText: navNames });
    await optionButtons.first().waitFor({ state: "visible" });
    await optionButtons.first().click();
    await page.getByRole("button", { name: /Nächste Frage →|Ergebnis →/ }).click();
  }
  await expect(page.getByText(/richtig — \d+%/)).toBeVisible();
  // Regressionsschutz wie im Prüfungsvorbereitung-Test: Free-Konten dürfen
  // den Lernnachweis-Download auch am Modul-Quiz nie sehen.
  await expect(page.getByRole("button", { name: /Lernnachweis herunterladen/i })).toHaveCount(0);
});

test("Modul O: OSI-Übersicht auf der Intro-Seite + Freemium-Sperre nach 2 Themen", async ({ page }) => {
  await loginAs(page, "free");
  await page.getByRole("button", { name: "Netzwerktechnik" }).click();
  // OSIOverview (src/ModuleUi.jsx) rendert nur auf der Intro-Seite von
  // Modul O, nirgends sonst.
  await expect(page.getByText("Die 7 Schichten im Überblick")).toBeVisible();
  await page.getByRole("button", { name: /Lernpfad starten/ }).click();

  // FREE_TOPIC_LIMITS={o:2}: Thema 1 und 2 frei, ab Thema 3 kommt die Sperre
  // statt des "Weiter →"-Buttons (src/ITDart.jsx, topicLocked).
  await page.getByRole("button", { name: /Weiter →/ }).click();
  await page.getByRole("button", { name: /Weiter →/ }).click();
  await expect(page.getByText("Ab hier geht's mit Premium weiter")).toBeVisible();
  await expect(page.getByRole("button", { name: /Weiter →/ })).toHaveCount(0);
});

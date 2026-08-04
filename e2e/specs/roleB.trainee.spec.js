import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers.js";
import { GQ } from "../../src/lib/moduleContent.js";

// Rolle B — Trainee (einem Trainer zugeordnet). Ergänzt Rolle A um die
// trainee-spezifische Sicht im Hilfe-Bereich.

test("Hilfe-Bereich zeigt den zugeordneten Trainer", async ({ page }) => {
  await loginAs(page, "trainee");
  await page.getByRole("button", { name: /❓ Hilfe/ }).click();
  await expect(page.getByText("Dein Trainer", { exact: false })).toBeVisible();
});

// Der Trainee-Testaccount ist seit dem Seed-Skript (2026-08-04) is_premium.
// Damit lassen sich hier erstmals Pfade testen, die für Free-Konten gar
// nicht erreichbar sind: der volle Modul-Quiz (10 statt 5 Fragen), der
// echte Lernnachweis-PDF-Download, das BW-Modul und Netzwerktechnik-Thema
// 7 (beide außerhalb der Freemium-Vorschau).

// Fragen- UND Antwortreihenfolge werden pro Quiz-Durchlauf gemischt
// (src/Quiz.jsx, useState(shuffled)) -- "einfach immer die erste Option
// klicken" träfe im Schnitt nur ~25% (4 Optionen), weit unter der 50%-
// Schwelle für den Lernnachweis-Download, und "Nochmal" würde daran nichts
// ändern (dieselbe Shuffle bleibt im Component-State bestehen, solange
// Quiz nicht neu gemountet wird). Stattdessen wird über den echten Text
// jeder Frage (bleibt bei jedem Durchlauf gleich, nur die Reihenfolge
// wechselt) in GQ nachgeschlagen, welche Options-TEXT korrekt ist, und
// genau dieser Button geklickt -- unabhängig von seiner zufälligen
// Position. Ergebnis ist deterministisch 10/10, kein Rate-Zufall.
async function answerQuizCorrectly(page, quizData, maxRounds) {
  for (let i = 0; i < maxRounds; i++) {
    if (await page.getByText(/richtig — \d+%/).isVisible().catch(() => false)) return;
    let matched = null;
    for (const entry of quizData) {
      if (await page.getByText(entry.q, { exact: false }).isVisible().catch(() => false)) {
        matched = entry;
        break;
      }
    }
    if (!matched) throw new Error("Aktuell angezeigte Quizfrage nicht in GQ gefunden -- Frage-Text in moduleContent.js geändert?");
    await page.getByRole("button", { name: matched.o[matched.c], exact: false }).first().click();
    await page.getByRole("button", { name: /Nächste Frage →|Ergebnis →/ }).click();
  }
}

test("Modul G als Premium: volles Quiz (10 Fragen, alle korrekt) + echter Lernnachweis-PDF-Download", async ({ page }) => {
  test.setTimeout(90_000);
  await loginAs(page, "trainee");
  await page.getByRole("button", { name: /Grundlagen IT/ }).click();
  await page.getByRole("button", { name: /Lernpfad starten/ }).click();
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: /Weiter →|Zum Quiz →/ }).click();
  }
  await answerQuizCorrectly(page, GQ, GQ.length);
  await expect(page.getByText("Sehr gut!")).toBeVisible();
  await expect(page.getByText(/10 von 10 richtig — 100%/)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Lernnachweis herunterladen/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/IT-Dart-Lernnachweis.*\.pdf$/);
});

test("Bewerbungshilfe-KI: Mock-Interview-Dialog startet und antwortet echt", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAs(page, "trainee");
  // BW ("Karriere & Bewerbung") ist nicht in FREE_MODULE_IDS -- nur mit
  // Premium überhaupt öffenbar (src/ITDart.jsx, canOpen).
  await page.getByRole("button", { name: /Karriere/ }).click();
  await page.getByRole("button", { name: /Lernpfad starten/ }).click();
  // BW hat kein Quiz -- "Weiter →" bis Thema 4 "Das Vorstellungsgespräch"
  // (dialogMode:"interview", src/lib/moduleContent.js).
  await page.getByRole("button", { name: /Weiter →/ }).click();
  await page.getByRole("button", { name: /Weiter →/ }).click();
  await page.getByRole("button", { name: /Weiter →/ }).click();
  await page.getByRole("button", { name: "Interview starten" }).click();
  // Erste echte KI-Frage: der Runden-Zähler erscheint erst, sobald die
  // erste Antwort tatsächlich zurückgekommen ist (history.length>0).
  await expect(page.getByText(/1 \/ 8 Runden/)).toBeVisible({ timeout: 30_000 });
});

test("Fehleranalysesystem: Diagnose-Dialog (Netzwerktechnik Thema 7) startet und antwortet echt", async ({ page }) => {
  test.setTimeout(60_000);
  await loginAs(page, "trainee");
  await page.getByRole("button", { name: "Netzwerktechnik" }).click();
  await page.getByRole("button", { name: /Lernpfad starten/ }).click();
  // Thema 7 "Anwendungsschicht" (dialogMode:"diagnose") -- mit Premium sind
  // alle 7 Themen frei zugänglich, kein FREE_TOPIC_LIMITS-Stop mehr.
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: /Weiter →/ }).click();
  }
  await page.getByRole("button", { name: "Diagnose starten" }).click();
  await expect(page.getByText(/1 \/ 8 Runden/)).toBeVisible({ timeout: 30_000 });
});

test("Statistik zeigt echten Modulfortschritt", async ({ page }) => {
  await loginAs(page, "trainee");
  await page.getByRole("button", { name: /Statistik/ }).click();
  await expect(page.getByText("Modulfortschritt")).toBeVisible();
  // Aus dem vorherigen Test in dieser Datei bereits abgeschlossen. .first()
  // noetig -- "Grundlagen IT" matcht zwei Elemente auf StatistikScreen.jsx
  // (Emoji-Badge-Span und der eigentliche Modulname-Span daneben).
  await expect(page.getByText("Grundlagen IT", { exact: false }).first()).toBeVisible();
});

import { expect } from "@playwright/test";
import { credentialsFor } from "../roles.config.js";

// Meldet eine frische Playwright-Browser-Session (kein bestehendes Login)
// über den Cover-Screen an — Feldbeschriftungen/Button-Texte spiegeln
// src/AuthScreen.jsx exakt (placeholder="E-Mail"/"Passwort", Button
// "Anmelden →").
export async function loginAs(page, role) {
  const { email, password } = credentialsFor(role);
  // Direkt zum Login-Screen statt über den "Anmelden / Registrieren"-Button
  // auf der Unternehmensseite -- solange WARTUNGSMODUS in App.jsx aktiv ist
  // (aktuell der Fall), zeigt "/" für anonyme Besucher WartungScreen.jsx
  // statt CompanyScreen.jsx, die dort keinen solchen Button hat. ?mode=login
  // ist derselbe Weg, den auch der reale "Hier anmelden"-Link auf der
  // Wartungsseite nutzt.
  await page.goto("/?mode=login");
  await page.getByPlaceholder("E-Mail").fill(email);
  await page.getByPlaceholder("Passwort").fill(password);
  await page.getByRole("button", { name: /^Anmelden/ }).click();
  await expect(page.getByText(email, { exact: false })).toBeVisible({ timeout: 10_000 });

  // Nach dem Login landet man auf dem Cover-Screen (Marketing-Text,
  // "Lernpfad starten →"-Button) -- die eigentliche Übersicht mit
  // Modulliste und den rollenspezifischen Kopfzeilen-Buttons (Trainer-
  // Ansicht, Junior-Admin, Admin, ...) erscheint erst nach diesem Klick
  // (src/ITDart.jsx, setView("overview")). Alle Rollen-Spezifikationen
  // brauchen das, deshalb zentral hier statt in jedem Test einzeln.
  await page.getByRole("button", { name: /Lernpfad starten/ }).click();
}

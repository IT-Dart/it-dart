import { defineConfig } from "@playwright/test";

// Welche Spec-Datei(en) laufen, hängt von E2E_SUITE ab — config-driven statt
// vier separate Workflow-Jobs. "full" deckt alle vier Rollen ab, jeder
// andere Wert nur die zugehörige Datei. Muss mit den `choice`-Optionen in
// .github/workflows/e2e-tests.yml und src/lib/e2eSuites.js übereinstimmen.
const SUITE_TO_SPEC = {
  full: "specs/**/*.spec.js",
  roleA: "specs/roleA.free.spec.js",
  roleB: "specs/roleB.trainee.spec.js",
  roleC: "specs/roleC.trainer.spec.js",
  roleD: "specs/roleD.junior-admin.spec.js",
};
const suite = process.env.E2E_SUITE || "full";

export default defineConfig({
  testDir: ".",
  testMatch: SUITE_TO_SPEC[suite] || SUITE_TO_SPEC.full,
  timeout: 30_000,
  retries: 1,
  reporter: [["json", { outputFile: "results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "https://www.it-dart.de",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});

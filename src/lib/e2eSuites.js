// Ein Ort für die Testsuiten-Auswahl im Admin-Dashboard (E2ETestScreen.jsx).
// Muss mit den `choice`-Optionen in .github/workflows/e2e-tests.yml und der
// ALLOWED_SUITES-Liste in supabase/functions/e2e-trigger-run übereinstimmen
// — bei einer neuen Suite an allen drei Stellen ergänzen.
export const E2E_SUITES = [
  { key: "full", label: "Alle Rollen" },
  { key: "roleA", label: "Rolle A – Eingeladener User ohne Premium" },
  { key: "roleB", label: "Rolle B – Trainee" },
  { key: "roleC", label: "Rolle C – Trainer" },
  { key: "roleD", label: "Rolle D – Junior-Admin" },
];

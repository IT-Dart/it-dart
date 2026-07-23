// Eine Stelle, die Rollen auf die Namen ihrer GitHub-Actions-Secrets
// abbildet — Zugangsdaten stehen nie als Literal in einer Spec-Datei.
// Welches reale Testkonto (z. B. coskunselimbulut+test9@gmail.com) hinter
// welcher Rolle steckt, entscheidet sich ausschließlich über den Wert des
// jeweiligen GitHub-Secrets, nie über Code hier — neue/andere Testkonten
// bedeuten also nur einen Secret-Wert-Wechsel, keine Code-Änderung.
export const ROLES = {
  free: { emailEnv: "E2E_TEST_FREE_EMAIL", passwordEnv: "E2E_TEST_FREE_PASSWORD" },
  trainee: { emailEnv: "E2E_TEST_TRAINEE_EMAIL", passwordEnv: "E2E_TEST_TRAINEE_PASSWORD" },
  trainer: { emailEnv: "E2E_TEST_TRAINER_EMAIL", passwordEnv: "E2E_TEST_TRAINER_PASSWORD" },
  juniorAdmin: { emailEnv: "E2E_TEST_JUNIORADMIN_EMAIL", passwordEnv: "E2E_TEST_JUNIORADMIN_PASSWORD" },
};

export function credentialsFor(role) {
  const cfg = ROLES[role];
  if (!cfg) throw new Error(`Unbekannte Rolle: "${role}"`);
  const email = process.env[cfg.emailEnv];
  const password = process.env[cfg.passwordEnv];
  if (!email || !password) {
    throw new Error(`Zugangsdaten fehlen für Rolle "${role}" (Secrets ${cfg.emailEnv}/${cfg.passwordEnv} nicht gesetzt).`);
  }
  return { email, password };
}

// Supabase Auth liefert seine Fehlermeldungen standardmäßig auf Englisch --
// bekannte, häufig auftretende Meldungen hier auf Deutsch übersetzen.
// Reihenfolge ist ohne Bedeutung, .includes() statt exaktem Vergleich, da
// sich Supabase-Meldungen in Details leicht unterscheiden können.
const KNOWN_TRANSLATIONS = [
  [/invalid login credentials/i, "E-Mail oder Passwort ist falsch."],
  [/email not confirmed/i, "Diese E-Mail-Adresse ist noch nicht bestätigt. Bitte den Bestätigungslink in deinem Postfach öffnen."],
  [/user already registered/i, "Für diese E-Mail-Adresse existiert bereits ein Konto."],
  [/password should be at least/i, "Das Passwort ist zu kurz."],
  [/new password should be different/i, "Das neue Passwort muss sich vom bisherigen unterscheiden."],
  [/for security purposes.*after \d+ seconds/i, "Aus Sicherheitsgründen bitte kurz warten, bevor du das erneut versuchst."],
  [/email rate limit exceeded/i, "Zu viele Anfragen — bitte kurz warten und erneut versuchen."],
  [/token has expired or is invalid/i, "Dieser Link ist abgelaufen oder ungültig — bitte fordere einen neuen an."],
  // To-Do #111: @supabase/gotrue-js verwirft clientseitig jede URL-Session,
  // deren Token laut "iat"-Claim älter als 120s ist ("Session as retrieved
  // from URL was issued over 120s ago"), lautlos ohne eigenen Error-Code --
  // die Session wird dann nie aufgebaut, updateUser() wirft stattdessen
  // dieses generische "Auth session missing!". In ResetPasswordScreen.jsx/
  // PasswordSetupScreen.jsx (die einzigen Aufrufer von updatePassword())
  // kann das nur bedeuten: der Link ist zu alt oder bereits verbraucht.
  [/auth session missing/i, "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an."],
];

function translate(message) {
  if (!message) return null;
  const hit = KNOWN_TRANSLATIONS.find(([pattern]) => pattern.test(message));
  return hit ? hit[1] : null;
}

// Fehlgeschlagene Magic-Links/OTP-Logins landen als `error_code` im
// URL-Hash statt als geworfener Error (siehe authError in AuthContext.jsx)
// -- eigene, kleine Übersetzungstabelle statt describeError() oben, das auf
// Error-Objekte mit .message zugeschnitten ist. Andere von Supabase für
// diesen Redirect-Fall bekannte error_code-Werte (z.B. bei manuell
// zurückgezogenen Links) landen im generischen Fallback unten.
const HASH_ERROR_CODE_TRANSLATIONS = {
  otp_expired: "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.",
};

export function describeHashError(errorCode) {
  return HASH_ERROR_CODE_TRANSLATIONS[errorCode] || "Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.";
}

// Turns whatever Supabase (or a network failure) hands back into a
// readable German message, and always logs the raw error so the real
// cause is visible in devtools instead of getting lost.
export function describeError(error, fallback = "Unbekannter Fehler — bitte kurz später erneut versuchen.") {
  if (!error) return fallback;
  console.error("[IT-Dart] error:", error);
  const raw = error.message || error.error_description || error.msg || error.hint || error.details;
  return translate(raw) || raw || fallback;
}

// Turns whatever Supabase (or a network failure) hands back into a
// readable German message, and always logs the raw error so the real
// cause is visible in devtools instead of getting lost.
export function describeError(error, fallback = "Unbekannter Fehler — bitte kurz später erneut versuchen.") {
  if (!error) return fallback;
  console.error("[IT-Dart] error:", error);
  return error.message || error.error_description || error.msg || error.hint || error.details || fallback;
}

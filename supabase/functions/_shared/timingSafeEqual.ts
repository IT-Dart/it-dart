// Konstantzeit-Stringvergleich für Shared-Secret-Prüfungen (CI-Runner ->
// Edge Function, kein Supabase-JWT verfügbar) -- vermeidet Seitenkanal-
// Timing-Angriffe, die ein simples !== erlauben würde. Bisher in
// e2e-report-ingest/index.ts und branch-cost-sync/index.ts unabhängig
// dupliziert (gefunden per /simplify-Review, 2026-08-05, Reuse-Winkel),
// jetzt einmalige Quelle für beide.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

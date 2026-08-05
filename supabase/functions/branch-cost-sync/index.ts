// Protokolliert Start/Ende eines Supabase-Preview-Branches in
// branch_cost_log (siehe Migration 20260805020000_branch_cost_tracking.sql).
// Bewusst ein reiner Push-Empfänger statt eines Pollers gegen die Supabase-
// Management-API: ein Management-API-Personal-Access-Token ist laut
// Supabase-Doku ("PATs carry the same privileges as your user account",
// keine Scopes, kein eingebautes Ablaufdatum) faktisch ein Konto-weiter
// Vollzugriffs-Schlüssel -- für dieses reine Kosten-Dashboard ein unnötig
// hohes Risiko, verworfen nach Rückmeldung des Nutzers (2026-08-05).
// Aufgerufen von .github/workflows/e2e-tests.yml direkt nach Branch-Anlage
// ("start") und direkt vor/bei Branch-Löschung ("end") -- dasselbe
// Shared-Secret-Muster wie e2e-report-ingest (X-E2E-Ingest-Secret), nicht
// die Supabase-JWT-Prüfung, da der CI-Runner keinen Supabase-JWT mitschickt.
// Ad-hoc-Debug-Branches, die über die Supabase-MCP-Verbindung während einer
// Claude-Code-Sitzung entstehen (z. B. "debug-username-schema",
// 2026-08-04/05), werden NICHT automatisch erfasst -- die Sitzung, die einen
// solchen Branch anlegt, muss denselben Aufruf selbst nachziehen.
import { createClient } from "jsr:@supabase/supabase-js@2";

// Gleiches Muster wie e2e-report-ingest: timingSafeEqual statt eines
// simplen !==, um Seitenkanal-Timing-Angriffe auf den Shared Secret zu
// vermeiden.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405 });

  const expectedSecret = Deno.env.get("BRANCH_COST_SECRET");
  const providedSecret = req.headers.get("X-Branch-Cost-Secret");
  if (!expectedSecret || !providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
    return new Response(JSON.stringify({ error: "Nicht autorisiert." }), { status: 401 });
  }

  let body: { branch_id?: string; branch_name?: string; event?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ungültiger Request-Body." }), { status: 400 });
  }
  const { branch_id, branch_name, event } = body;
  if (!branch_id || !branch_name || (event !== "start" && event !== "end")) {
    return new Response(JSON.stringify({ error: "branch_id, branch_name und event ('start'|'end') sind erforderlich." }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event === "start") {
    // Kein .upsert() mit ON-CONFLICT-Inferenz -- branch_cost_log_active_branch_idx
    // ist ein PARTIELLER Unique-Index (nur status='active'), den Postgres für
    // ON CONFLICT nicht ohne explizite WHERE-Klausel auflösen kann. Expliziter
    // Select-dann-Insert stattdessen (ein doppelter "start" für dieselbe
    // branch_id ist ohnehin nur bei einem echten Step-Retry innerhalb desselben
    // Laufs denkbar, da branch_id pro Branch-Anlage eine frische UUID ist).
    const { data: existing } = await supabase
      .from("branch_cost_log")
      .select("id")
      .eq("branch_id", branch_id)
      .eq("status", "active")
      .maybeSingle();
    const { error } = existing
      ? await supabase.from("branch_cost_log").update({ last_seen_at: new Date().toISOString() }).eq("id", existing.id)
      : await supabase.from("branch_cost_log").insert({
          branch_id,
          branch_name,
          status: "active",
          started_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        });
    if (error) {
      console.error("[branch-cost-sync] start-Insert fehlgeschlagen:", error.message);
      return new Response(JSON.stringify({ error: "Speichern fehlgeschlagen." }), { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("branch_cost_log")
      .update({ status: "closed", ended_at: new Date().toISOString() })
      .eq("branch_id", branch_id)
      .eq("status", "active");
    if (error) {
      console.error("[branch-cost-sync] end-Update fehlgeschlagen:", error.message);
      return new Response(JSON.stringify({ error: "Speichern fehlgeschlagen." }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
});

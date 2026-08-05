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
import { timingSafeEqual } from "../_shared/timingSafeEqual.ts";

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
    // Ein Aufruf statt zwei sequenziellen (SELECT dann INSERT/UPDATE) --
    // branch_cost_log_start() kapselt "INSERT ... ON CONFLICT (branch_id)
    // WHERE status='active' DO UPDATE" (siehe Migration
    // 20260805080000_branch_cost_log_start_upsert.sql; supabase-js'
    // getyptes .upsert() kann diese partielle WHERE-Klausel nicht selbst
    // ausdrücken).
    const { error } = await supabase.rpc("branch_cost_log_start", {
      p_branch_id: branch_id,
      p_branch_name: branch_name,
    });
    if (error) {
      console.error("[branch-cost-sync] start-Upsert fehlgeschlagen:", error.message);
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

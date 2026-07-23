// Supabase Edge Function: receives the final result of an E2E test run from
// the GitHub Actions workflow (.github/workflows/e2e-tests.yml, last step)
// and writes it onto the matching supabase.e2e_runs row. The caller is a CI
// runner, not a logged-in user — there is no Supabase JWT to check, so this
// endpoint is authenticated with a long shared secret instead. It can only
// update a row that e2e-trigger-run already created (by run_id); it cannot
// create new rows or touch any other table.
import { createClient } from "jsr:@supabase/supabase-js@2";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  // Kein Origin-basiertes CORS hier — der Aufrufer ist ein CI-Runner ohne
  // sinnvollen Browser-Origin-Header. Die eigentliche Schutzgrenze ist der
  // Shared Secret unten, nicht CORS (das schützt ohnehin nur Browser, nie
  // Server-zu-Server-Aufrufe).
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const expectedSecret = Deno.env.get("E2E_INGEST_SECRET");
    const providedSecret = req.headers.get("X-E2E-Ingest-Secret");
    if (!expectedSecret || !providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
      return json({ error: "Nicht autorisiert." }, 401);
    }

    const body = await req.json();
    const runId = Number(body?.run_id);
    if (!Number.isInteger(runId) || runId <= 0) {
      return json({ error: "run_id fehlt oder ist ungültig." }, 400);
    }
    const status = body?.status === "success" || body?.status === "failure" ? body.status : null;
    if (!status) {
      return json({ error: "status muss 'success' oder 'failure' sein." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await supabase.from("e2e_runs").select("id").eq("id", runId).maybeSingle();
    if (!existing) return json({ error: "Unbekannter Testlauf." }, 404);

    const { error: updateErr } = await supabase.from("e2e_runs").update({
      status,
      gh_run_id: body?.gh_run_id ?? null,
      gh_workflow_url: body?.gh_workflow_url ?? null,
      report: body?.report ?? null,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);

    if (updateErr) {
      console.error("[e2e-report-ingest] update failed:", JSON.stringify(updateErr));
      return json({ error: "Ergebnis konnte nicht gespeichert werden." }, 500);
    }

    return json({ ok: true }, 200);
  } catch (e) {
    console.error("[e2e-report-ingest] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

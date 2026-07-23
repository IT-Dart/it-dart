// Supabase Edge Function: lets an Admin trigger a real end-to-end browser
// test run (GitHub Actions + Playwright — this repo has no way to run a
// browser automation engine itself, neither in this Deno function nor in
// the Vite/React frontend). Admin-only: no is_junior_admin_user() path,
// this is more sensitive than the invite/AI-toggle actions Junior-Admins
// already have (it triggers real writes against production via real test
// accounts).
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://it-dart.vercel.app",
  "https://it-dart.de",
  "https://www.it-dart.de",
  "http://localhost:5173",
]);

// Muss mit den `choice`-Optionen in .github/workflows/e2e-tests.yml und den
// Einträgen in src/lib/e2eSuites.js übereinstimmen. Serverseitig geprüft,
// bevor der Wert in den GitHub-API-Aufruf eingebettet wird — der Client
// darf nie unvalidierte Werte bis zur GitHub API durchreichen.
const ALLOWED_SUITES = new Set(["full", "roleA", "roleB", "roleC", "roleD"]);

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht angemeldet." }, 401, cors);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) return json({ error: "Nicht angemeldet." }, 401, cors);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) {
      return json({ error: "Nur für Admins." }, 403, cors);
    }

    const { suite } = await req.json();
    if (!suite || !ALLOWED_SUITES.has(suite)) {
      return json({ error: "Ungültige Testsuite." }, 400, cors);
    }

    const { data: run, error: insertErr } = await supabase
      .from("e2e_runs")
      .insert({ status: "queued", suite, triggered_by: user.id })
      .select("id")
      .single();
    if (insertErr || !run) {
      console.error("[e2e-trigger-run] insert failed:", JSON.stringify(insertErr));
      return json({ error: "Testlauf konnte nicht angelegt werden." }, 500, cors);
    }

    const githubPat = Deno.env.get("GITHUB_PAT");
    const githubRepo = Deno.env.get("GITHUB_REPO"); // z. B. "IT-Dart/it-dart"
    if (!githubPat || !githubRepo) {
      await supabase.from("e2e_runs").update({
        status: "error",
        error_text: "GITHUB_PAT/GITHUB_REPO ist auf dem Server nicht konfiguriert.",
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      return json({ error: "Testlauf-Auslösung ist serverseitig nicht konfiguriert." }, 500, cors);
    }

    // workflow_dispatch selbst liefert keine Run-ID zurück (nur 204) — die
    // eigene Zeilen-ID wird deshalb als Input mitgegeben, der letzte
    // Workflow-Schritt meldet sie über e2e-report-ingest wieder zurück.
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/e2e-tests.yml/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${githubPat}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main", inputs: { suite, run_id: String(run.id) } }),
      }
    );

    if (!dispatchRes.ok) {
      const detail = await dispatchRes.text();
      console.error("[e2e-trigger-run] GitHub dispatch failed:", dispatchRes.status, detail);
      await supabase.from("e2e_runs").update({
        status: "error",
        error_text: `GitHub-Auslösung fehlgeschlagen (Status ${dispatchRes.status}).`,
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      return json({ error: "Testlauf konnte bei GitHub nicht ausgelöst werden." }, 502, cors);
    }

    return json({ ok: true, id: run.id }, 200, cors);
  } catch (e) {
    console.error("[e2e-trigger-run] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

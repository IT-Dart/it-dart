// Supabase Edge Function: nimmt Content-Security-Policy-Verstoßmeldungen
// entgegen, die Browser automatisch senden, wenn eine Ressource durch die
// CSP blockiert wurde (siehe vercel.json "report-to"/"report-uri"). Bisher
// unsichtbar -- landete nur in der Konsole des jeweiligen Nutzers.
//
// Kein Authorization-Header nötig: Browser senden diese Berichte über einen
// eigenen, von CORS unabhängigen Mechanismus (Reporting API bzw. das
// veraltete report-uri), nicht über einen von der Seite ausgelösten
// fetch()-Aufruf. Deshalb hier bewusst kein ALLOWED_ORIGINS-Check wie bei
// den anderen Functions -- es gibt keinen Origin-Header, gegen den geprüft
// werden könnte, und es findet kein Zugriff auf Nutzerdaten statt (reiner
// Einwurf-Pfad, kein Read). Größe/Rate absichtlich eng begrenzt, damit die
// Function nicht als Kosten-/Speicher-Angriffsfläche missbraucht werden kann.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_BODY_BYTES = 20_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const bodyText = await req.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return new Response(null, { status: 204 });
  }

  // Zwei mögliche Formate: alte "report-uri" ({ "csp-report": {...} }) oder
  // neue Reporting API (Array von { type: "csp-violation", body: {...} }).
  const items: Array<Record<string, unknown>> = [];
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      const body = (entry as Record<string, unknown>)?.body as Record<string, unknown> | undefined;
      if (body) items.push(body);
    }
  } else if (parsed && typeof parsed === "object" && "csp-report" in (parsed as Record<string, unknown>)) {
    items.push((parsed as Record<string, unknown>)["csp-report"] as Record<string, unknown>);
  }

  if (items.length === 0) {
    return new Response(null, { status: 204 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const rows = items.slice(0, 20).map((r) => ({
    document_uri: (r["documentURL"] ?? r["document-uri"] ?? null) as string | null,
    blocked_uri: (r["blockedURL"] ?? r["blocked-uri"] ?? null) as string | null,
    violated_directive: (r["violatedDirective"] ?? r["violated-directive"] ?? null) as string | null,
    effective_directive: (r["effectiveDirective"] ?? r["effective-directive"] ?? null) as string | null,
    source_file: (r["sourceFile"] ?? r["source-file"] ?? null) as string | null,
    line_number: (r["lineNumber"] ?? r["line-number"] ?? null) as number | null,
    disposition: (r["disposition"] ?? null) as string | null,
    raw: r,
  }));

  await supabase.from("csp_reports").insert(rows);

  return new Response(null, { status: 204 });
});

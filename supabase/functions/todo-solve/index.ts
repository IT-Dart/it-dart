// Supabase Edge Function: "Lösung suchen" auf dem Admin-To-Do-Dashboard.
// Admin-only — holt den echten To-Do-Datensatz serverseitig (nicht aus dem
// Request-Body vertraut), fragt Claude mit aktivierter Websuche, protokolliert
// echte Token- und Suchkosten in ai_usage (module_id "admin-todo-solve").
import { createClient } from "jsr:@supabase/supabase-js@2";

const MODEL_ID = "claude-haiku-4-5";
const PRICE_PER_MILLION_INPUT_USD = 1.0;
const PRICE_PER_MILLION_OUTPUT_USD = 5.0;
const PRICE_PER_WEB_SEARCH_USD = 0.01; // $10 / 1000 Suchen
const MAX_WEB_SEARCHES_PER_CALL = 3;

// Faktentreue-Prinzip (KI-RICHTLINIEN.md, gilt für alle KI-Funktionen,
// nicht nur den Chat): auch dieser interne Bearbeitungs-Assistent darf
// nichts erfinden, was weder im Aufgabentext noch in der Websuche belegt ist.
const SYSTEM_PROMPT =
  "Du hilfst dem Betreiber von IT-Dart, offene Aufgaben (To-Dos) zu durchdenken. " +
  "Nutze die Websuche, wenn aktuelle oder externe Informationen hilfreich sind (z. B. rechtliche Vorgaben, " +
  "aktuelle Preise/Anbieter, Fachbegriffe) — bei rein organisatorischen Aufgaben ohne externen Bezug ist keine Suche nötig. " +
  "Nutze nur Informationen, die durch den Aufgabentext oder die Websuche tatsächlich belegt sind — erfinde nichts. " +
  "Bist du dir bei einem Punkt unsicher oder liefert die Websuche keine klare Antwort, sag das explizit statt zu spekulieren. " +
  "Antworte auf Deutsch, prägnant (max. ca. 150 Wörter): ein konkreter Lösungsansatz oder die sinnvollsten nächsten Schritte. " +
  "Keine Einleitung, keine Meta-Kommentare über KI oder diesen Prompt.";

const ALLOWED_ORIGINS = new Set([
  "https://it-dart.vercel.app",
  "https://it-dart.de",
  "https://www.it-dart.de",
  "http://localhost:5173",
]);

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

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Nicht angemeldet." }, 401, cors);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return json({ error: "Nicht angemeldet." }, 401, cors);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return json({ error: "Nur für Admins." }, 403, cors);
    }

    const { todoId } = await req.json();
    if (!todoId) {
      return json({ error: "Keine To-Do-ID übermittelt." }, 400, cors);
    }

    const { data: todo, error: todoErr } = await supabase
      .from("todos")
      .select("title, description, priority, tool_slug")
      .eq("id", todoId)
      .single();
    if (todoErr || !todo) {
      return json({ error: "To-Do nicht gefunden." }, 404, cors);
    }

    let toolName: string | null = null;
    if (todo.tool_slug) {
      const { data: tool } = await supabase.from("tools").select("name").eq("slug", todo.tool_slug).single();
      toolName = tool?.name ?? null;
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "Server ist nicht konfiguriert." }, 500, cors);
    }

    const userMessage = [
      `To-Do: ${todo.title}`,
      todo.description ? `Beschreibung: ${todo.description}` : null,
      `Priorität: ${todo.priority}`,
      toolName ? `Bezug: ${toolName}` : null,
    ].filter(Boolean).join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: MAX_WEB_SEARCHES_PER_CALL }],
      }),
    });

    if (!r.ok) {
      return json({ error: `Anthropic-Fehler (${r.status}).` }, 502, cors);
    }

    const d = await r.json();
    const answer = (d.content ?? [])
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text)
      .join(" ") || "Keine Antwort.";

    const sources = (d.content ?? [])
      .filter((c: { type: string }) => c.type === "web_search_tool_result")
      .flatMap((c: { content: unknown }) => Array.isArray(c.content) ? c.content : [])
      .filter((sr: { type: string }) => sr.type === "web_search_result")
      .map((sr: { title: string; url: string }) => ({ title: sr.title, url: sr.url }));

    const inputTokens = d.usage?.input_tokens ?? null;
    const outputTokens = d.usage?.output_tokens ?? null;
    const webSearches = d.usage?.server_tool_use?.web_search_requests ?? 0;
    const costUsd = inputTokens != null && outputTokens != null
      ? (inputTokens / 1_000_000) * PRICE_PER_MILLION_INPUT_USD +
        (outputTokens / 1_000_000) * PRICE_PER_MILLION_OUTPUT_USD +
        webSearches * PRICE_PER_WEB_SEARCH_USD
      : null;

    // Audit-Befund M2 (2026-08-06, gleiches Muster wie ai-chat/index.ts):
    // war fire-and-forget mit leeren .then-Handlern -- jetzt awaited, Fehler
    // werden geloggt statt verschluckt, blockieren die Antwort aber weiterhin
    // nicht.
    const { error: usageErr } = await supabase.from("ai_usage").insert({
      user_id: user.id,
      model: MODEL_ID,
      module_id: "admin-todo-solve",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      web_search_requests: webSearches,
      cost_usd: costUsd,
    });
    if (usageErr) console.error("[todo-solve] ai_usage insert failed:", usageErr.message);

    return json({ answer, sources }, 200, cors);
  } catch (e) {
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

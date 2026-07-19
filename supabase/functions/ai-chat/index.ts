// Supabase Edge Function: proxies the AI chat feature to Anthropic.
// The Anthropic API key never reaches the browser — it only lives here as a secret.
import { createClient } from "jsr:@supabase/supabase-js@2";

const FREE_MODULE_IDS = ["g", "o"]; // Grundlagen, Netzwerktechnik — matches MODS order in ITDart.jsx
const RATE_LIMIT_PER_HOUR = 20;

const ALLOWED_ORIGINS = new Set([
  "https://it-dart.vercel.app",
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

    // Service-role client: verifies the caller's JWT directly and reads
    // profiles without depending on the project's anon/publishable key.
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
      .select("is_premium, premium_until, ai_enabled")
      .eq("id", user.id)
      .single();

    if (profile?.ai_enabled === false) {
      return json({ error: "Der KI-Chat ist für dieses Konto deaktiviert." }, 403, cors);
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: usageCount } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((usageCount ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return json({ error: "Zu viele Fragen — bitte in einer Stunde nochmal versuchen." }, 429, cors);
    }

    const { ctx, question, moduleId } = await req.json();
    if (!question || typeof question !== "string" || !question.trim()) {
      return json({ error: "Keine Frage übermittelt." }, 400, cors);
    }

    if (!FREE_MODULE_IDS.includes(moduleId)) {
      const hasTimedPremium = profile?.premium_until && new Date(profile.premium_until) > new Date();
      const premiumActive = profile?.is_premium || hasTimedPremium;
      if (!premiumActive) {
        return json({ error: "Dieser Bereich ist nur mit Premium verfügbar." }, 403, cors);
      }
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "Server ist nicht konfiguriert." }, 500, cors);
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `${ctx ?? ""} Frage: ${question} Antworte klar, praxisnah, auf korrektem Deutsch, max. 4-5 Sätze, ohne Einleitung.`,
        }],
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

    supabase.from("ai_usage").insert({ user_id: user.id }).then(
      () => {},
      () => {}, // usage logging is best-effort, never blocks the answer
    );

    return json({ answer }, 200, cors);
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

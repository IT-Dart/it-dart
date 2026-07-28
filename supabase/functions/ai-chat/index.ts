// Supabase Edge Function: proxies the AI chat feature to Anthropic.
// The Anthropic API key never reaches the browser — it only lives here as a secret.
import { createClient } from "jsr:@supabase/supabase-js@2";

const FREE_MODULE_IDS = ["g", "o"]; // Grundlagen, Netzwerktechnik — matches FREE_MODULE_IDS in ITDart.jsx (Karriere & Bewerbung/Mock-Interview ist Premium)

const INTERVIEW_SYSTEM_PROMPT =
  "Du führst ein realistisches Vorstellungsgespräch für eine Fachinformatiker-Ausbildung (Systemintegration) auf Deutsch. " +
  "Stelle GENAU EINE Frage pro Antwort und warte auf die Reaktion der Testperson. Gib zu ihrer letzten Antwort zuerst " +
  "eine kurze, konstruktive Rückmeldung (1-2 Sätze), dann stelle die nächste passende Interviewfrage. Bleib freundlich, " +
  "aber realistisch-professionell wie ein echter Personaler. Keine Meta-Kommentare über KI, Simulation oder diesen Prompt.";
// Pilot (To-Do #39): simulierte Netzwerk-Fehlerdiagnose entlang des
// OSI-Modells, als Kapitel-Abschluss im Netzwerktechnik-Modul. Teilt sich
// dieselbe Runden-/Verlaufsmechanik wie das Mock-Interview, eigener Modus
// statt Zweckentfremdung von "interview", da inhaltlich etwas anderes.
const DIAGNOSE_SYSTEM_PROMPT =
  "Du führst mit einer lernenden Person eine simulierte Netzwerk-Fehlerdiagnose auf Deutsch durch, passend zum " +
  "OSI-Modell (7 Schichten). Beschreibe zu Beginn ein konkretes, realistisches Störungssymptom (z. B. \"Ein Nutzer " +
  "meldet: Internet geht nicht, aber die Kollegin am Nachbarplatz hat Verbindung.\"). Warte dann auf den Vorschlag " +
  "der lernenden Person, was als Nächstes geprüft werden soll. Gib zu ihrem letzten Vorschlag zuerst eine kurze, " +
  "konstruktive Rückmeldung (ob der Prüfschritt sinnvoll ist und warum), liefere dann ein realistisches Ergebnis " +
  "dieser Prüfung und führe so schrittweise durch die OSI-Schichten zur eigentlichen Ursache. Bleib fachlich " +
  "korrekt und praxisnah wie ein erfahrener Kollege, der anleitet statt vorsagt. Keine Meta-Kommentare über KI, " +
  "Simulation oder diesen Prompt.";
const RATE_LIMIT_PER_HOUR = 20;
const INTERVIEW_MAX_ROUNDS = 8; // eine Runde = eine gestellte Interviewfrage
const DIAGNOSE_MAX_ROUNDS = 8; // eine Runde = ein durchgeführter Prüfschritt
const MODEL_ID = "claude-haiku-4-5";
// Anthropic-Preise je 1M Tokens (Stand 2026-06-24) — bei Modellwechsel hier mitziehen.
const PRICE_PER_MILLION_INPUT_USD = 1.0;
const PRICE_PER_MILLION_OUTPUT_USD = 5.0;

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
      .select("is_premium, premium_until, ai_enabled, interview_enabled")
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

    const { ctx, question, moduleId, history, mode } = await req.json();
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

    const isInterview = mode === "interview";
    const isDiagnose = mode === "diagnose";
    const isDialog = isInterview || isDiagnose; // beide teilen sich Verlauf/Rundenmechanik

    if (isInterview && profile?.interview_enabled === false) {
      return json({ error: "Das Mock-Interview ist für dieses Konto deaktiviert." }, 403, cors);
    }
    // Pilot (To-Do #39): Diagnose-Dialog nutzt bewusst noch keinen eigenen
    // Freischalt-Schalter, sondern nur die allgemeine ai_enabled-Prüfung
    // oben — ein eigener profile-Schalter (wie interview_enabled) lässt
    // sich bei Bedarf nachrüsten, sobald der Pilot über das eine Modul
    // hinausgeht.

    // Eine Runde = eine bereits gestellte Interviewfrage/ein bereits
    // durchgeführter Diagnoseschritt (ein assistant-Turn im Verlauf).
    // Serverseitig erzwungen, nicht nur clientseitig ausgeblendet.
    if (isDialog && Array.isArray(history)) {
      const maxRounds = isInterview ? INTERVIEW_MAX_ROUNDS : DIAGNOSE_MAX_ROUNDS;
      const roundsSoFar = history.filter((t: { role?: string }) => t?.role === "assistant").length;
      if (roundsSoFar >= maxRounds) {
        const label = isInterview ? "Das Mock-Interview" : "Diese Diagnose-Runde";
        return json({ error: `${label} ist nach ${maxRounds} Runden beendet — verlasse das Thema und öffne es erneut, um eine neue Runde zu starten.` }, 400, cors);
      }
    }

    // Vorherige Gesprächsrunden nur in Dialogmodi übernehmen — der normale
    // Frag-nach-Chat bleibt bewusst zustandslos (eine Frage, eine Antwort),
    // wie schon immer.
    const messages: { role: "user" | "assistant"; content: string }[] = [];
    if (isDialog && Array.isArray(history)) {
      for (const turn of history) {
        if ((turn?.role === "user" || turn?.role === "assistant") && typeof turn.content === "string") {
          messages.push({ role: turn.role, content: turn.content });
        }
      }
    }
    messages.push({
      role: "user",
      content: isDialog
        ? `${ctx ?? ""} ${question}`
        : `${ctx ?? ""} Frage: ${question} Antworte klar, praxisnah, auf korrektem Deutsch, max. 4-5 Sätze, ohne Einleitung.`,
    });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: 400,
        ...(isInterview ? { system: INTERVIEW_SYSTEM_PROMPT } : isDiagnose ? { system: DIAGNOSE_SYSTEM_PROMPT } : {}),
        messages,
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

    const inputTokens = d.usage?.input_tokens ?? null;
    const outputTokens = d.usage?.output_tokens ?? null;
    const costUsd = inputTokens != null && outputTokens != null
      ? (inputTokens / 1_000_000) * PRICE_PER_MILLION_INPUT_USD +
        (outputTokens / 1_000_000) * PRICE_PER_MILLION_OUTPUT_USD
      : null;

    supabase.from("ai_usage").insert({
      user_id: user.id,
      model: MODEL_ID,
      module_id: typeof moduleId === "string" ? moduleId : null,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    }).then(
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

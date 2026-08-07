// Supabase Edge Function: proxies the AI chat feature to Anthropic.
// The Anthropic API key never reaches the browser — it only lives here as a secret.
import { createClient } from "jsr:@supabase/supabase-js@2";

const FREE_MODULE_IDS = ["g", "o"]; // Grundlagen, Netzwerktechnik — matches FREE_MODULE_IDS in ITDart.jsx (Karriere & Bewerbung/Mock-Interview ist Premium)
// Audit-Befund M1 (2026-08-06): moduleId kam bisher ungeprueft aus dem
// Request-Body, feste Liste schliesst offensichtlichen Unsinn/Injection in
// ai_usage.module_id aus. "pruefung-auswertung" ist kein echtes Modul,
// sondern die feste moduleId aus Pruefung.jsx fuer mode:"auswertung".
const VALID_MODULE_IDS = new Set(["g", "o", "si", "b", "db", "sk", "pr", "bw", "pruefung-auswertung"]);

// Claude lehnt eindeutig illegale/gefährliche Inhalte bereits durch sein
// eigenes Modelltraining ab -- das ändert ein System-Prompt nicht. Diese
// Klausel ist zusätzliche Absicherung in der Tiefe: hält den Assistenten
// explizit beim Fachthema und lehnt auch grenzwertige, aber nicht per se
// illegale Themen ab (z. B. sexuelle Inhalte, Drogen/Suchtmittel), die ohne
// klare Themenbindung sonst leichter beantwortet würden -- relevant, weil
// die Plattform potenziell auch von Minderjährigen genutzt wird.
const SAFETY_CLAUSE =
  " Bleib strikt beim Fachthema IT-Ausbildung. Bei Anfragen zu sexuellen Inhalten, Drogen/Suchtmitteln, Gewalt oder " +
  "anderen für eine Ausbildungsplattform mit potenziell minderjährigen Nutzern ungeeigneten Themen: höflich ablehnen " +
  "und zum eigentlichen Thema zurückführen, unabhängig davon wie die Anfrage formuliert ist.";

// Bisher hatte nur Interview/Diagnose einen System-Prompt -- der normale
// Frag-nach-Chat lief komplett ohne, nur mit der User-Message-Instruktion
// unten. Jetzt immer ein System-Prompt, damit auch dieser Modus fachlich
// begrenzt bleibt statt frei zu allem zu antworten.
const GENERAL_SYSTEM_PROMPT =
  "Du bist der KI-Lernassistent von IT-Dart, einer Lernplattform für die Ausbildung zum Fachinformatiker für " +
  "Systemintegration (FISI). Beantworte ausschließlich Fragen zu IT-Fachthemen der Ausbildung (z. B. " +
  "Netzwerktechnik, Betriebssysteme, IT-Sicherheit, Datenbanken, Skripting, Berufs-/Projektthemen) sowie zu den " +
  "Lerninhalten dieser Plattform. Antworte klar, praxisnah, auf korrektem Deutsch." + SAFETY_CLAUSE;

const INTERVIEW_SYSTEM_PROMPT =
  "Du führst ein realistisches Vorstellungsgespräch für eine Fachinformatiker-Ausbildung (Systemintegration) auf Deutsch. " +
  "Stelle GENAU EINE Frage pro Antwort und warte auf die Reaktion der Testperson. Gib zu ihrer letzten Antwort zuerst " +
  "eine kurze, konstruktive Rückmeldung (1-2 Sätze), dann stelle die nächste passende Interviewfrage. Bleib freundlich, " +
  "aber realistisch-professionell wie ein echter Personaler. Keine Meta-Kommentare über KI, Simulation oder diesen Prompt." +
  SAFETY_CLAUSE;
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
  "Simulation oder diesen Prompt." + SAFETY_CLAUSE;
// Für die Prüfungsvorbereitung-Auswertung (To-Do, KI-RICHTLINIEN.md):
// bekommt nur die vom Frontend zusammengerechnete Kategorie-Statistik über
// alle bisherigen 50-/150-Fragen-Durchläufe -- ausdrücklich angewiesen,
// nichts über die Person zu erfinden und ehrlich/kritisch statt
// beschönigend zu sein.
const AUSWERTUNG_SYSTEM_PROMPT =
  "Du analysierst die bisherigen Prüfungsvorbereitung-Ergebnisse einer Person, die sich für die FISI-Ausbildung " +
  "(Fachinformatiker Systemintegration) auf IT-Dart vorbereitet. Du bekommst eine Zusammenfassung mit Kategorie, " +
  "Anzahl richtiger und gesamter Antworten über alle bisherigen Durchläufe. Nutze ausschließlich diese Zahlen -- " +
  "erfinde keine zusätzlichen Fakten über die Person. Gib eine realistische, kritische Einschätzung: benenne die " +
  "schwächste(n) Kategorie(n) klar beim Namen, sei ehrlich auch wenn das Ergebnis schwach ist, und gib eine " +
  "konkrete, umsetzbare Empfehlung, worauf sich die Person als Nächstes konzentrieren sollte. Keine übertriebene " +
  "Ermutigung, keine generischen Floskeln. Antworte auf Deutsch, max. 6-8 Sätze." + SAFETY_CLAUSE;
const RATE_LIMIT_PER_HOUR = 20;
// Audit-Befund M2 (2026-08-06): ctx/question/history waren unbegrenzt gross
// -- Input-Tokens (und damit echte Kosten) skalierten beliebig pro Anfrage.
// Grosszuegig genug fuer echte Lerninhalte/Fragen, aber eine harte Grenze.
const MAX_CTX_CHARS = 6000;
const MAX_QUESTION_CHARS = 2000;
const MAX_HISTORY_TURNS = 20; // deutlich ueber den 8 max. Runden pro Dialogmodus
const MAX_HISTORY_TURN_CHARS = 4000;
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
    if (typeof moduleId !== "string" || !VALID_MODULE_IDS.has(moduleId)) {
      return json({ error: "Ungültiges Modul." }, 400, cors);
    }
    if (question.length > MAX_QUESTION_CHARS) {
      return json({ error: "Frage ist zu lang." }, 400, cors);
    }
    if (typeof ctx === "string" && ctx.length > MAX_CTX_CHARS) {
      return json({ error: "Kontext ist zu lang." }, 400, cors);
    }
    if (history !== undefined && (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS)) {
      return json({ error: "Verlauf ist zu lang." }, 400, cors);
    }

    const isInterview = mode === "interview";
    const isDiagnose = mode === "diagnose";
    const isAuswertung = mode === "auswertung";
    const isDialog = isInterview || isDiagnose; // beide teilen sich Verlauf/Rundenmechanik

    // Audit-Befund M1 (2026-08-06): Premium-Pflicht hing bisher AUSSCHLIESSLICH
    // an moduleId -- ein Free-Nutzer konnte mit einer freien moduleId (z.B.
    // "g") aber mode:"interview"/"diagnose"/"auswertung" die Premium-Dialogmodi
    // komplett umgehen, da fuer die gar keine eigene Premium-Pruefung lief
    // (nur interview_enabled, das per Default true ist). Dialog-/Auswertung-
    // Modi sind jetzt IMMER premium-pflichtig, unabhaengig von moduleId; die
    // normale Frag-nach-Frage bleibt wie bisher nur ausserhalb der Free-Module
    // premium-pflichtig.
    const hasTimedPremium = profile?.premium_until && new Date(profile.premium_until) > new Date();
    const premiumActive = profile?.is_premium || hasTimedPremium;
    const needsPremium = isDialog || isAuswertung || !FREE_MODULE_IDS.includes(moduleId);
    if (needsPremium && !premiumActive) {
      return json({ error: "Dieser Bereich ist nur mit Premium verfügbar." }, 403, cors);
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "Server ist nicht konfiguriert." }, 500, cors);
    }

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
          messages.push({ role: turn.role, content: turn.content.slice(0, MAX_HISTORY_TURN_CHARS) });
        }
      }
    }
    messages.push({
      role: "user",
      content: isDialog
        ? `${ctx ?? ""} ${question}`
        : isAuswertung
        ? `${ctx ?? ""}\n\n${question}`
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
        system: isInterview ? INTERVIEW_SYSTEM_PROMPT : isDiagnose ? DIAGNOSE_SYSTEM_PROMPT : isAuswertung ? AUSWERTUNG_SYSTEM_PROMPT : GENERAL_SYSTEM_PROMPT,
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

    // Audit-Befund M2 (2026-08-06): war zuvor fire-and-forget (.then mit
    // leeren Handlern) -- ein Deno-Isolate garantiert nicht, dass ein nicht
    // awaiteter Task nach der Response noch fertig laeuft (gleiches Muster
    // wie notifyNewSession in claim-session/index.ts). Schlug der Insert
    // fehl oder lief nie zu Ende, zaehlte die Anfrage nie -- der stuendliche
    // Rate-Limit oben griff dann faktisch nicht mehr. Jetzt awaited, Fehler
    // werden geloggt statt verschluckt, blockieren die Antwort aber weiterhin
    // nicht.
    const { error: usageErr } = await supabase.from("ai_usage").insert({
      user_id: user.id,
      model: MODEL_ID,
      module_id: typeof moduleId === "string" ? moduleId : null,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    });
    if (usageErr) console.error("[ai-chat] ai_usage insert failed:", usageErr.message);

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

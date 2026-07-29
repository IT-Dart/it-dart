// Supabase Edge Function: beansprucht eine Sitzung (claim_session) und
// protokolliert dabei die Client-IP fuer das Sicherheits-Audit-Log. Muss ueber
// eine Edge Function laufen statt per direktem RPC vom Client, weil nur hier
// der echte x-forwarded-for-Header zur Verfuegung steht -- eine reine
// SQL-Funktion sieht keine HTTP-Header.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://it-dart.vercel.app",
  "https://it-dart.de",
  "https://www.it-dart.de",
  "http://localhost:5173",
]);

const AUDIT_LOG_RETENTION_DAYS = 7;

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

    const { new_session_id, force } = await req.json();
    if (!new_session_id) return json({ error: "Ungültige Anfrage." }, 400, cors);

    // claim_session ist SECURITY DEFINER und leitet den Aufrufer intern über
    // auth.uid() ab -- mit dem Service-Role-Client (oben) hat der Aufruf
    // KEINEN Nutzerkontext, auth.uid() liefert dort null und die Funktion
    // bricht sofort ab. Für genau diesen einen Aufruf deshalb einen Client
    // verwenden, der mit dem echten Nutzer-Token authentifiziert ist.
    const supabaseAsUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimed, error: claimError } = await supabaseAsUser.rpc("claim_session", {
      new_session_id,
      force: !!force,
    });
    if (claimError) return json({ error: claimError.message }, 500, cors);

    if (claimed) {
      // Datenminimierung: nur IP + Zeitpunkt + user_id, zweckgebunden fuers
      // Sicherheits-Audit (Art. 6 Abs. 1 lit. f DSGVO). Erster Eintrag der
      // x-forwarded-for-Kette ist die echte Client-IP.
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      await supabase.from("session_audit_log").insert({ user_id: user.id, ip_address: ip });

      // Rollierende Loeschung statt separatem Cron-Job: bei jedem erfolgreichen
      // Claim werden nebenbei alle Eintraege jenseits der Aufbewahrungsfrist entfernt.
      const cutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("session_audit_log").delete().lt("created_at", cutoff);

      // Bewusst awaited (nicht fire-and-forget): Edge Functions/Deno Deploy
      // garantieren nicht, dass ein nicht awaiteter Hintergrund-Task nach der
      // Response noch fertig laeuft. Fehler beim Mailversand duerfen den
      // Login trotzdem nicht blockieren -- deshalb hier abgefangen, nie
      // weitergeworfen.
      try {
        await notifyNewSession(user.email!);
      } catch (e) {
        console.error("[claim-session] notifyNewSession failed:", e);
      }
    }

    return json({ claimed: !!claimed }, 200, cors);
  } catch (e) {
    console.error("[claim-session] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

// Benachrichtigt den Kontoinhaber bei jeder neuen Sitzung -- gaengiges
// Sicherheitsmuster (aehnlich Banken/Google): kein automatisches Blockieren,
// aber der echte Nutzer merkt sofort, wenn sich jemand anderes einloggt.
// Laeuft ueber Resends HTTP-API (Port 443) statt direkter SMTP-Verbindung --
// Supabase Edge Functions/Deno Deploy blockieren ausgehende Verbindungen zu
// den Standard-SMTP-Ports 25/587, direktes SMTP waere hier unzuverlässig.
async function notifyNewSession(toEmail: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[claim-session] RESEND_API_KEY nicht gesetzt, überspringe Benachrichtigung.");
    return;
  }
  const from = Deno.env.get("RESEND_FROM") || "IT-Dart <benachrichtigung@notify.it-dart.de>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: toEmail,
      subject: "Neue Anmeldung bei IT-Dart",
      text:
        "Hallo,\n\nsoeben hat sich jemand mit deinen Zugangsdaten bei IT-Dart angemeldet.\n\n" +
        "Warst das du selbst, kannst du diese Mail ignorieren.\n\n" +
        "Falls nicht: Ändere umgehend dein Passwort über \"Passwort vergessen\" auf der IT-Dart-Anmeldeseite.\n\n" +
        "— IT-Dart",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend-API antwortete mit ${res.status}: ${body}`);
  }
}

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

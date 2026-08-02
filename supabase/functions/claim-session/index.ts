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

// Geschütztes Hauptkonto (siehe CLAUDE.md Sicherheitsprinzipien) -- der
// Sofort-Push aufs Handy löst absichtlich NUR bei diesem Konto aus, nicht
// bei jeder Nutzer-Anmeldung, sonst skaliert das nicht und ist auch
// datenschutzmäßig fragwürdig.
const PROTECTED_USER_ID = "33271bc9-6b8a-456f-9cf1-a5c564218b07";

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

    const { new_session_id } = await req.json();
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

    // Beansprucht die Sitzung immer sofort und bedingungslos -- der neueste
    // Login gewinnt immer, eine eventuell noch aktive andere Sitzung wird
    // ueber den Realtime-Kanal in AuthContext.jsx aktiv abgemeldet. Kein
    // Konflikt-Dialog, kein "force"-Sonderfall mehr noetig.
    const { data: claimed, error: claimError } = await supabaseAsUser.rpc("claim_session", {
      new_session_id,
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

      if (user.id === PROTECTED_USER_ID) {
        try {
          await notifyOwnerPush();
        } catch (e) {
          console.error("[claim-session] notifyOwnerPush failed:", e);
        }
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
      html: newSessionEmailHtml(),
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

// Sofort-Push aufs Handy nur fuers eigene, geschuetzte Konto -- ueber
// ntfy.sh, bewusst zustandslos: kein neuer Datenbank-Eintrag, kein
// Anwachsen. NTFY_TOPIC ist ein geheimer, zufaellig generierter Themenname
// (Secret in den Edge-Function-Settings), da ntfy-Themen ohne eigenen
// Account allein ueber den Namen erreichbar sind -- wer den Namen kennt,
// kann mitlesen oder faelschen.
async function notifyOwnerPush() {
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!topic) {
    console.warn("[claim-session] NTFY_TOPIC nicht gesetzt, überspringe Push.");
    return;
  }
  const res = await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      "Title": "Neue Anmeldung bei IT-Dart",
      "Priority": "urgent",
      "Tags": "warning",
    },
    body: "Soeben wurde sich mit deinen Zugangsdaten bei IT-Dart angemeldet. Falls das nicht du warst: sofort Passwort ändern.",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ntfy.sh antwortete mit ${res.status}: ${body}`);
  }
}

// Gleiche Karten-/Farbgebung wie die 5 Supabase-Auth-Vorlagen unter
// supabase/email-templates/*.html -- dort per Dashboard hochgeladen, hier
// inline noetig, weil diese Mail nicht ueber Supabase Auth, sondern direkt
// per Resend-HTTP-API versendet wird.
function newSessionEmailHtml(): string {
  return `
<div style="background:#0f1623;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="background:#1a2535;border:1px solid #2d3f5a;border-radius:14px;padding:36px 32px;">
        <table role="presentation">
          <tr>
            <td style="width:40px;height:40px;border-radius:50%;background:#2563eb;text-align:center;vertical-align:middle;font-size:20px;">🎯</td>
            <td style="padding-left:12px;">
              <div style="font-size:18px;font-weight:700;color:#f1f5f9;line-height:1.3;">IT-Dart</div>
              <div style="font-size:11px;font-weight:500;color:#38bdf8;line-height:1.3;">Bleib am Dart!</div>
            </td>
          </tr>
        </table>
        <h1 style="font-size:20px;color:#f1f5f9;margin:28px 0 10px;">Neue Anmeldung erkannt</h1>
        <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 8px;">
          Soeben hat sich jemand mit deinen Zugangsdaten bei IT-Dart angemeldet.
        </p>
        <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 22px;">
          Warst das du selbst, kannst du diese E-Mail ignorieren.
        </p>
        <table role="presentation" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="background:rgba(217,119,6,0.12);border:1px solid #92400e;border-radius:10px;padding:14px 16px;">
              <p style="font-size:13px;color:#fbbf24;line-height:1.6;margin:0;font-weight:600;">⚠ Warst du das nicht?</p>
              <p style="font-size:13px;color:#fcd34d;line-height:1.6;margin:6px 0 0;">Ändere umgehend dein Passwort über „Passwort vergessen" auf der IT-Dart-Anmeldeseite: <a href="https://it-dart.de" style="color:#38bdf8;">it-dart.de</a></p>
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:#64748b;line-height:1.6;margin:0;border-top:1px solid #2d3f5a;padding-top:16px;">
          Diese Benachrichtigung dient deiner Kontosicherheit und wird bei jeder neuen Anmeldung automatisch versendet.
        </p>
      </td>
    </tr>
    <tr><td style="text-align:center;padding-top:18px;font-size:11px;color:#475569;">IT-Dart · Coskun Selim Bulut</td></tr>
  </table>
</div>`;
}

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// Supabase Edge Function fuer die (noch inaktive, siehe
// src/lib/featureFlags.js MINOR_CONSENT_ENABLED) Altersabfrage +
// Eltern-Bestaetigung fuer unter-16-Jaehrige. Drei Aktionen:
//   "submit"  - angemeldet: Geburtsdatum setzen, bei unter 16 zusaetzlich
//               Eltern-E-Mail hinterlegen und Bestaetigungs-Mail verschicken
//   "resend"  - angemeldet: Bestaetigungs-Mail erneut verschicken
//   "confirm" - oeffentlich (Eltern-Klick, keine eigene Anmeldung): Token
//               einloesen
// Alle Schreibzugriffe laufen ueber den Service-Role-Key, da profiles fuer
// authenticated bewusst keine UPDATE-Policy hat (siehe Migration).
import { createClient } from "jsr:@supabase/supabase-js@2";

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

// Art. 8 DSGVO: in Deutschland gilt regelmaessig die Altersgrenze 16 Jahre
// fuer eine wirksame Einwilligung eines Minderjaehrigen selbst.
const MIN_CONSENT_AGE = 16;

// Audit-Befund M3 (2026-08-06): ohne Obergrenze konnte ein Konto beliebig
// oft eine Bestaetigungs-Mail an eine (ggf. fremde) Eltern-E-Mail-Adresse
// ausloesen. Gilt fuer submit UND resend gemeinsam (dieselbe Zaehlung).
const MAX_CONSENT_MAILS_PER_WINDOW = 3;
const CONSENT_MAIL_WINDOW_HOURS = 24;

function ageFromBirthdate(birthdate: string): number {
  const b = new Date(birthdate + "T00:00:00Z");
  const now = new Date();
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const hadBirthdayThisYear =
    now.getUTCMonth() > b.getUTCMonth() ||
    (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() >= b.getUTCDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const redirectTo = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.it-dart.de";

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...body } = await req.json();

    if (action === "confirm") {
      const token = typeof body.token === "string" ? body.token : null;
      if (!token) return json({ error: "Kein Bestätigungs-Code angegeben." }, 400, cors);
      const { data: row, error: findErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("parent_consent_token", token)
        .eq("parent_consent_confirmed", false)
        .maybeSingle();
      if (findErr) {
        console.error("[parent-consent] confirm lookup failed:", JSON.stringify(findErr));
        return json({ error: "Unerwarteter Fehler." }, 500, cors);
      }
      if (!row) return json({ error: "Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet." }, 400, cors);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ parent_consent_confirmed: true, parent_consent_token: null })
        .eq("id", row.id);
      if (updErr) {
        console.error("[parent-consent] confirm update failed:", JSON.stringify(updErr));
        return json({ error: "Unerwarteter Fehler." }, 500, cors);
      }
      return json({ ok: true }, 200, cors);
    }

    // "submit" und "resend" erfordern eine angemeldete Person.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Nicht angemeldet." }, 401, cors);
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(bearerToken);
    if (userErr || !user) return json({ error: "Nicht angemeldet." }, 401, cors);

    if (action === "submit") {
      const birthdate = typeof body.birthdate === "string" ? body.birthdate : null;
      const parentEmail = typeof body.parentEmail === "string" ? body.parentEmail.trim() : null;
      if (!birthdate || Number.isNaN(new Date(birthdate).getTime())) {
        return json({ error: "Ungültiges Geburtsdatum." }, 400, cors);
      }
      const age = ageFromBirthdate(birthdate);
      if (age < 0 || age > 120) return json({ error: "Ungültiges Geburtsdatum." }, 400, cors);

      if (age < MIN_CONSENT_AGE) {
        if (!parentEmail || !parentEmail.includes("@")) {
          return json({ error: "Bitte die E-Mail-Adresse eines Erziehungsberechtigten angeben." }, 400, cors);
        }
        // Offensichtlichster Umgehungsfall: eigene Konto-E-Mail als "Eltern-E-Mail"
        // eintragen. Verhindert keine absichtliche Faelschung mit einer echten
        // Zweit-Adresse, schliesst aber die einfachste Luecke ohne zusaetzliche
        // Infrastruktur (siehe KI-RICHTLINIEN.md, "angemessene Anstrengungen").
        if (user.email && parentEmail.toLowerCase() === user.email.toLowerCase()) {
          return json({ error: "Die E-Mail-Adresse eines Erziehungsberechtigten muss sich von deiner eigenen Konto-E-Mail unterscheiden." }, 400, cors);
        }
        if (await consentMailLimitReached(supabase, user.id)) {
          return json({ error: "Zu viele Bestätigungs-Mails in kurzer Zeit angefordert. Bitte versuche es später erneut." }, 429, cors);
        }
        const consentToken = crypto.randomUUID();
        const { error: updErr } = await supabase
          .from("profiles")
          .update({
            birthdate,
            parent_email: parentEmail,
            parent_consent_token: consentToken,
            parent_consent_confirmed: false,
          })
          .eq("id", user.id);
        if (updErr) {
          console.error("[parent-consent] submit update failed:", JSON.stringify(updErr));
          return json({ error: "Unerwarteter Fehler." }, 500, cors);
        }
        await sendConsentMail(parentEmail, consentToken, redirectTo);
        await logConsentMailSent(supabase, user.id);
        return json({ ok: true, requiresParentConsent: true }, 200, cors);
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ birthdate, parent_email: null, parent_consent_token: null, parent_consent_confirmed: true })
        .eq("id", user.id);
      if (updErr) {
        console.error("[parent-consent] submit update (volljaehrig) failed:", JSON.stringify(updErr));
        return json({ error: "Unerwarteter Fehler." }, 500, cors);
      }
      return json({ ok: true, requiresParentConsent: false }, 200, cors);
    }

    if (action === "resend") {
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("parent_email, parent_consent_confirmed")
        .eq("id", user.id)
        .single();
      if (profErr || !profile?.parent_email) {
        return json({ error: "Keine hinterlegte E-Mail eines Erziehungsberechtigten gefunden." }, 400, cors);
      }
      if (profile.parent_consent_confirmed) {
        return json({ ok: true, alreadyConfirmed: true }, 200, cors);
      }
      if (await consentMailLimitReached(supabase, user.id)) {
        return json({ error: "Zu viele Bestätigungs-Mails in kurzer Zeit angefordert. Bitte versuche es später erneut." }, 429, cors);
      }
      const consentToken = crypto.randomUUID();
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ parent_consent_token: consentToken })
        .eq("id", user.id);
      if (updErr) {
        console.error("[parent-consent] resend update failed:", JSON.stringify(updErr));
        return json({ error: "Unerwarteter Fehler." }, 500, cors);
      }
      await sendConsentMail(profile.parent_email, consentToken, redirectTo);
      await logConsentMailSent(supabase, user.id);
      return json({ ok: true }, 200, cors);
    }

    return json({ error: "Unbekannte Aktion." }, 400, cors);
  } catch (e) {
    console.error("[parent-consent] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

// Audit-Befund M3: Zaehlung ueber die eigene parent_consent_mail_log-Tabelle
// statt einer profiles-Spalte (siehe Migration
// 20260807040000_parent_consent_mail_rate_limit.sql fuer die Begruendung).
async function consentMailLimitReached(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  const since = new Date(Date.now() - CONSENT_MAIL_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("parent_consent_mail_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("sent_at", since);
  if (error) {
    console.error("[parent-consent] rate-limit lookup failed:", JSON.stringify(error));
    return false; // fail open -- lieber eine Mail zu viel als den Flow komplett blockieren
  }
  return (count ?? 0) >= MAX_CONSENT_MAILS_PER_WINDOW;
}

async function logConsentMailSent(supabase: ReturnType<typeof createClient>, userId: string) {
  const { error } = await supabase.from("parent_consent_mail_log").insert({ user_id: userId });
  if (error) console.error("[parent-consent] rate-limit log insert failed:", JSON.stringify(error));
}

// Gleicher Grund/Weg wie claim-session/notifyNewSession: Resends HTTP-API
// statt direkter SMTP-Verbindung, da Edge Functions/Deno Deploy ausgehende
// Verbindungen zu den Standard-SMTP-Ports 25/587 blockieren.
async function sendConsentMail(toEmail: string, token: string, redirectTo: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[parent-consent] RESEND_API_KEY nicht gesetzt, überspringe Mail.");
    return;
  }
  const from = Deno.env.get("RESEND_FROM") || "IT-Dart <benachrichtigung@notify.it-dart.de>";
  const link = `${redirectTo}/?mode=parent-consent&token=${encodeURIComponent(token)}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: toEmail,
      subject: "Bestätigung für die Registrierung bei IT-Dart",
      html: consentEmailHtml(link),
      text:
        "Hallo,\n\nein Kind oder eine Ihnen anvertraute Person hat sich mit dieser E-Mail-Adresse als Kontakt " +
        "einer erziehungsberechtigten Person bei der Lernplattform IT-Dart (it-dart.de) registriert.\n\n" +
        "Wenn Sie mit dieser Registrierung einverstanden sind, bestätigen Sie das bitte über diesen Link:\n" +
        link + "\n\n" +
        "Wenn Ihnen diese Registrierung nicht bekannt vorkommt, können Sie diese E-Mail ignorieren — ohne " +
        "Ihre Bestätigung bleibt der Zugang eingeschränkt.\n\n— IT-Dart",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend-API antwortete mit ${res.status}: ${body}`);
  }
}

// Gleicher Markenlook wie die 5 Supabase-Auth-Vorlagen unter
// supabase/email-templates/ (dunkles Kartendesign, Logo-Header, Fusszeile
// mit Rechtstext-Links) -- diese Mail hier laeuft nicht ueber das Supabase-
// Dashboard, sondern wird direkt hier im Code erzeugt, deployt also normal
// per git push + Function-Deploy, kein manuelles Dashboard-Einfuegen noetig.
function consentEmailHtml(link: string): string {
  return `<div style="background:#0f1623;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="background:#1a2535;border:1px solid #2d3f5a;border-radius:14px;padding:36px 32px;">
        <table role="presentation" align="center" style="margin:0 auto;">
          <tr>
            <td style="width:40px;"><img src="https://www.it-dart.de/email-logo.png" width="40" height="40" alt="" style="display:block;border-radius:50%;"></td>
            <td style="padding-left:12px;padding-right:12px;">
              <div style="font-size:18px;font-weight:700;color:#f1f5f9;line-height:1.3;">IT-Dart</div>
              <div style="font-size:11px;font-weight:500;color:#38bdf8;line-height:1.3;">Bleib am Dart!</div>
            </td>
            <td style="width:40px;"><img src="https://www.it-dart.de/email-logo.png" width="40" height="40" alt="" style="display:block;border-radius:50%;"></td>
          </tr>
        </table>
        <h1 style="font-size:20px;color:#f1f5f9;margin:28px 0 10px;">Bestätigung für IT-Dart</h1>
        <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 26px;">
          ein Kind oder eine Ihnen anvertraute Person hat sich mit Ihrer E-Mail-Adresse als Kontakt einer erziehungsberechtigten Person bei der Lernplattform <strong style="color:#f1f5f9;">IT-Dart</strong> (it-dart.de) registriert. Wenn Sie mit dieser Registrierung einverstanden sind, bestätigen Sie das bitte über den folgenden Button.
        </p>
        <table role="presentation" width="100%">
          <tr>
            <td align="center" style="padding:4px 0 24px;">
              <a href="${link}" style="background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;display:inline-block;">Registrierung bestätigen →</a>
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:#64748b;line-height:1.6;margin:0;border-top:1px solid #2d3f5a;padding-top:16px;">
          Wenn Ihnen diese Registrierung nicht bekannt vorkommt, können Sie diese E-Mail ignorieren — ohne Ihre Bestätigung bleibt der Zugang eingeschränkt.
        </p>
      </td>
    </tr>
    <tr><td style="text-align:center;padding-top:18px;font-size:11px;color:#475569;">IT-Dart · Coskun Selim Bulut</td></tr>
    <tr><td style="text-align:center;padding-top:6px;font-size:11px;color:#475569;">
      <a href="https://www.it-dart.de/?mode=impressum" style="color:#64748b;text-decoration:underline;">Impressum</a>
      &nbsp;·&nbsp;
      <a href="https://www.it-dart.de/?mode=datenschutz" style="color:#64748b;text-decoration:underline;">Datenschutz</a>
      &nbsp;·&nbsp;
      <a href="https://www.it-dart.de/?mode=agb" style="color:#64748b;text-decoration:underline;">AGB</a>
    </td></tr>
  </table>
</div>`;
}

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

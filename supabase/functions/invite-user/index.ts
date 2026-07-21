// Supabase Edge Function: lets an admin OR a trainer invite a new user by
// email — inviting requires the service-role key, so this can't happen
// directly from the client. Admins can invite anyone with no assignment.
// Trainers can only invite up to their own trainee_limit, and the new
// account is immediately assigned to them (this is the only way a trainer
// gains a trainee on their own — they can never attach an existing user).
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

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Server-side calls have no window.location — the invite/magic-link
  // redirect target must be set explicitly here, or Supabase falls back to
  // the project's (possibly stale) Site URL. Reuse whichever allowed
  // origin the caller is actually on, same as the client-side flows that
  // pass window.location.origin, falling back to the canonical domain.
  const redirectTo = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.it-dart.de";

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
      .select("is_admin, is_trainer, trainee_limit")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin && !profile?.is_trainer) return json({ error: "Nur für Admins oder Trainer." }, 403, cors);
    const asTrainer = !profile.is_admin; // Admin nimmt Vorrang, falls ein Account beides ist

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return json({ error: "Ungültige E-Mail-Adresse." }, 400, cors);
    }

    // Check for an existing account first — gives a clear message instead
    // of relying on Supabase's (sometimes empty) error for this case.
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      return json({ error: "Diese E-Mail ist bereits registriert — keine Einladung nötig." }, 400, cors);
    }

    if (asTrainer) {
      const { count } = await supabase
        .from("trainer_trainees")
        .select("trainee_id", { count: "exact", head: true })
        .eq("trainer_id", user.id);
      const limit = profile.trainee_limit ?? 5;
      if ((count ?? 0) >= limit) {
        return json({ error: `Maximale Anzahl an Trainees erreicht (${count}/${limit}). Bitte wende dich an den Administrator, um dein Kontingent zu erweitern.` }, 400, cors);
      }
    }

    // Primary path: let Supabase create the user AND email them the invite
    // (via the configured SMTP). This used to fail because of the broken
    // notify-signup trigger, now fixed.
    const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (inviteErr) {
      console.error("[invite-user] inviteUserByEmail failed:", JSON.stringify(inviteErr));
      const msg = inviteErr.message && inviteErr.message !== "{}"
        ? inviteErr.message
        : `Einladen fehlgeschlagen (Status ${inviteErr.status ?? "unbekannt"}). Details stehen in den Function-Logs.`;
      return json({ error: msg }, 400, cors);
    }

    if (asTrainer && inviteData?.user?.id) {
      const { error: assignErr } = await supabase
        .from("trainer_trainees")
        .insert({ trainer_id: user.id, trainee_id: inviteData.user.id });
      if (assignErr) {
        // Der Account wurde bereits angelegt — nicht rückgängig machen (das
        // wäre für die eingeladene Person verwirrend), aber den Admin
        // sichtbar machen, damit die Zuordnung manuell nachgeholt wird.
        console.error("[invite-user] auto-assign to trainer failed:", JSON.stringify(assignErr));
        return json({ ok: true, emailed: true, link: null, warning: "Einladung verschickt, aber die automatische Zuordnung zu dir ist fehlgeschlagen — bitte die Administration informieren." }, 200, cors);
      }
    }

    // Also hand back a link the admin/trainer can share manually (e.g.
    // WhatsApp, Discord) in addition to the automatic email, in case that's
    // useful.
    let link: string | null = null;
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (linkErr) {
      console.error("[invite-user] generateLink (magiclink) failed:", JSON.stringify(linkErr));
    } else {
      link = linkData.properties.action_link;
    }

    return json({ ok: true, emailed: true, link }, 200, cors);
  } catch (e) {
    console.error("[invite-user] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// Supabase Edge Function: lets an admin invite a new user by email.
// Only callers with profiles.is_admin = true may use this — everyone
// else is rejected, since inviting a user requires the service-role key.
import { createClient } from "jsr:@supabase/supabase-js@2";

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
  const cors = corsHeaders(req.headers.get("Origin"));
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
    if (!profile?.is_admin) return json({ error: "Nur für Admins." }, 403, cors);

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

    const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email);
    if (inviteErr) {
      console.error("[invite-user] inviteUserByEmail failed:", JSON.stringify(inviteErr));
      const msg = inviteErr.message && inviteErr.message !== "{}"
        ? inviteErr.message
        : `Einladen fehlgeschlagen (Status ${inviteErr.status ?? "unbekannt"}). Details stehen in den Function-Logs.`;
      return json({ error: msg }, 400, cors);
    }

    return json({ ok: true }, 200, cors);
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

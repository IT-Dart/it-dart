// Supabase Edge Function: lets an admin permanently delete another user's
// account. Deleting the auth user cascades automatically to profiles,
// progress, ai_usage and lernnachweise via their "on delete cascade"
// foreign keys — same effect as the self-service delete-account function,
// just triggered by an admin on someone else's behalf.
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

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return json({ error: "Ungültige Nutzer-ID." }, 400, cors);
    }
    if (userId === user.id) {
      return json({ error: "Du kannst dein eigenes Konto hier nicht löschen." }, 400, cors);
    }

    // shouldSoftDelete explicitly false: a soft-deleted user leaves the
    // auth.users row in place, which means the "on delete cascade" to
    // profiles never fires — the stale profiles row then blocks any future
    // invite to that email with a false "already registered" error.
    const { error: delErr } = await supabase.auth.admin.deleteUser(userId, false);
    if (delErr) return json({ error: delErr.message }, 500, cors);

    return json({ ok: true }, 200, cors);
  } catch (e) {
    console.error("[admin-delete-user] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

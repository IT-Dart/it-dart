// Supabase Edge Function: lets a logged-in user permanently delete their
// own account (DSGVO Art. 17 — right to erasure). Deleting the auth user
// cascades automatically to profiles, progress, ai_usage and
// lernnachweise via their "on delete cascade" foreign keys.
import { createClient } from "jsr:@supabase/supabase-js@2";

// Explicitly exempted from every in-app deletion path (self-service and
// admin). The only way to remove this account is a direct database
// operation (e.g. `delete from auth.users where id = ...` in the SQL
// Editor) — never through the application itself.
const PROTECTED_USER_ID = "33271bc9-6b8a-456f-9cf1-a5c564218b07";

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

    if (user.id === PROTECTED_USER_ID) {
      return json({ error: "Dieses Konto ist gegen Löschung geschützt und kann nicht über die App entfernt werden." }, 403, cors);
    }

    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) return json({ error: delErr.message }, 500, cors);

    return json({ ok: true }, 200, cors);
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

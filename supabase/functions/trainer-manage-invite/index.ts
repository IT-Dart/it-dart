// Supabase Edge Function: lets a trainer, admin, or junior-admin resend or
// delete a still-pending (unconfirmed) invite. Deliberately narrower than
// admin-delete-user: regardless of caller, the target account must (a) not
// have confirmed its email yet — an active account can never be deleted
// this way, only unassigned via the normal trainer_trainees RLS delete
// policy. A plain trainer is additionally restricted to their own assigned
// trainees; admins/junior-admins may act on any pending account (junior-
// admin's least-privilege boundary — no confirmed-account deletion, no
// role/premium grants — is enforced here and in the DB migration, not by
// which screen happens to call this function).
import { createClient } from "jsr:@supabase/supabase-js@2";

// Explicitly exempted from every in-app deletion path — see admin-delete-user
// and delete-account for the same guard. Only a direct database operation
// can remove this account.
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
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Same reasoning as invite-user: no window.location server-side, so the
  // redirect target has to be set explicitly here.
  const redirectTo = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://it-dart.de";

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

    const { data: profile } = await supabase.from("profiles").select("is_trainer, is_admin, is_junior_admin").eq("id", user.id).single();
    const privileged = !!(profile?.is_admin || profile?.is_junior_admin);
    if (!profile?.is_trainer && !privileged) {
      return json({ error: "Nur für Trainer, Admins oder Junior-Admins." }, 403, cors);
    }

    const { action, userId } = await req.json();
    if (!userId || (action !== "resend" && action !== "delete")) {
      return json({ error: "Ungültige Anfrage." }, 400, cors);
    }

    // Admins/Junior-Admins dürfen jede ausstehende Einladung verwalten; ein
    // reiner Trainer bleibt auf die eigenen zugewiesenen Testenden begrenzt.
    if (!privileged) {
      const { data: link } = await supabase
        .from("trainer_trainees")
        .select("trainee_id")
        .eq("trainer_id", user.id)
        .eq("trainee_id", userId)
        .maybeSingle();
      if (!link) return json({ error: "Dieser Nutzer ist dir nicht zugewiesen." }, 403, cors);
    }

    const { data: target } = await supabase.from("profiles").select("email, confirmed_at").eq("id", userId).single();
    if (!target) return json({ error: "Nutzer nicht gefunden." }, 404, cors);
    if (target.confirmed_at) return json({ error: "Dieses Konto ist bereits aktiv — Einladungen können nur für ausstehende Konten verwaltet werden." }, 400, cors);

    if (action === "delete") {
      if (userId === PROTECTED_USER_ID) {
        return json({ error: "Dieses Konto ist gegen Löschung geschützt und kann nicht über die App entfernt werden." }, 403, cors);
      }
      // shouldSoftDelete explicitly false — same reasoning as
      // admin-delete-user: a soft-deleted row never cascades to profiles,
      // leaving a stale row that blocks re-inviting that email.
      const { error: delErr } = await supabase.auth.admin.deleteUser(userId, false);
      if (delErr) return json({ error: delErr.message }, 500, cors);
      return json({ ok: true }, 200, cors);
    }

    // action === "resend"
    const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(target.email, { redirectTo });
    if (inviteErr) {
      console.error("[trainer-manage-invite] resend failed:", JSON.stringify(inviteErr));
      const msg = inviteErr.message && inviteErr.message !== "{}"
        ? inviteErr.message
        : `Erneutes Senden fehlgeschlagen (Status ${inviteErr.status ?? "unbekannt"}, Code ${inviteErr.code ?? "unbekannt"}). Details: ${JSON.stringify(inviteErr)}`;
      return json({ error: msg }, 400, cors);
    }
    return json({ ok: true }, 200, cors);
  } catch (e) {
    console.error("[trainer-manage-invite] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

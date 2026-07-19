// Supabase Edge Function: called by a Database Webhook whenever a new row
// is inserted into public.profiles (i.e. a new user signed up). Posts a
// short notification to a Discord channel via an incoming webhook.
// The Discord webhook URL itself is a secret and never appears in code.

Deno.serve(async (req) => {
  try {
    const sharedSecret = req.headers.get("x-webhook-secret");
    if (sharedSecret !== Deno.env.get("SIGNUP_NOTIFY_SECRET")) {
      return new Response("Unauthorized", { status: 401 });
    }

    const discordUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!discordUrl) {
      return new Response("Not configured", { status: 500 });
    }

    const payload = await req.json();
    const email = payload?.record?.email ?? "unbekannt";
    const time = new Date().toLocaleString("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    });

    await fetch(discordUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: `🎯 **Neue Registrierung bei IT-Dart**\n**E-Mail:** ${email}\n**Zeit:** ${time}`,
      }),
    });

    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response("error", { status: 500 });
  }
});

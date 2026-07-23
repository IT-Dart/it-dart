// Supabase Edge Function: admin-only Website-Analyse-Tool ("Website-Checker").
// Bewusst rein serverseitig per HTTP-Abruf (kein Browser/Playwright) — das
// hat zwei Gründe: (1) ein Browser-Abruf einer beliebigen fremden Domain
// würde dieselbe GitHub-Actions-Infrastruktur wie die E2E-Tests brauchen und
// Minuten statt Sekunden dauern; (2) ein direkter Abruf vom Browser des
// Admins aus würde an CORS der jeweiligen Zielseite scheitern, ein
// Server-zu-Server-Abruf nicht. Synchron statt Trigger/Ingest-Zweiteilung
// wie bei e2e_runs, weil ein einzelner HTTP-Abruf + HTML-Scan typischerweise
// deutlich unter einer Sekunde dauert und keinen externen Runner braucht.
//
// Bewusst generisch gehalten (keine IT-Dart-spezifische Logik) — dieselbe
// Funktion lässt sich unverändert in jede per "IT-Dart-Klon"-Meta-Prompt
// gebaute Plattform übernehmen.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://it-dart.vercel.app",
  "https://it-dart.de",
  "https://www.it-dart.de",
  "http://localhost:5173",
]);

const FETCH_TIMEOUT_MS = 10_000;
const AUX_FETCH_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 2_000_000; // 2 MB — genug für <head>+<body>, deckelt Missbrauch
const USER_AGENT = "IT-Dart-WebsiteCheck/1.0 (+https://www.it-dart.de)";

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

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// Grundlegender SSRF-Schutz: verhindert, dass die Funktion als Proxy zum
// Abtasten interner/lokaler Netzwerkadressen missbraucht wird. Erkennt nur
// offensichtliche IP-Literale/Hostnamen, kein DNS-Rebinding-Schutz — für ein
// admin-only-Werkzeug (bereits höchste Vertrauensstufe) verhältnismäßig.
const BLOCKED_HOSTNAME_RE =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?)/i;

function normalizeUrl(input: string): URL | null {
  let raw = (input || "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (BLOCKED_HOSTNAME_RE.test(u.hostname) || u.hostname.endsWith(".local")) return null;
    return u;
  } catch {
    return null;
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        chunks.push(value.slice(0, Math.max(0, maxBytes - (total - value.byteLength))));
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

function extractTag(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[0] : null;
}

function getAttr(tagHtml: string | null, attr: string): string | null {
  if (!tagHtml) return null;
  const m = tagHtml.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1] : null;
}

async function fetchAux(origin: string, path: string): Promise<{ present: boolean; status: number | null }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), AUX_FETCH_TIMEOUT_MS);
    const res = await fetch(new URL(path, origin), {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(t);
    return { present: res.ok, status: res.status };
  } catch {
    return { present: false, status: null };
  }
}

type CheckStatus = "OK" | "WARN" | "FEHLER";
interface CheckResult {
  id: number;
  category: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
}

function analyzeHtml(html: string, finalUrl: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;

  const metaDescription = getAttr(extractTag(html, /<meta[^>]+name=["']description["'][^>]*>/i), "content");
  const hasViewport = !!extractTag(html, /<meta[^>]+name=["']viewport["'][^>]*>/i);
  const canonicalHref = getAttr(extractTag(html, /<link[^>]+rel=["']canonical["'][^>]*>/i), "href");
  const htmlLang = getAttr(extractTag(html, /<html\b[^>]*>/i), "lang");
  const hasFavicon = !!extractTag(html, /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/i);
  const hasDoctype = /^\s*<!doctype html/i.test(html);

  const charsetTag = extractTag(html, /<meta[^>]+charset\s*=\s*["']?[\w-]+["']?[^>]*>/i);
  const charset = charsetTag ? (charsetTag.match(/charset\s*=\s*["']?([\w-]+)["']?/i)?.[1] ?? null) : null;

  const og = { title: false, description: false, image: false };
  for (const m of html.matchAll(/<meta[^>]+property=["']og:(title|description|image)["'][^>]*>/gi)) {
    if (m[1] === "title") og.title = true;
    else if (m[1] === "description") og.description = true;
    else if (m[1] === "image") og.image = true;
  }

  const h1Count = [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)].length;

  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgsMissingAlt = imgTags.filter((tag) => !/alt\s*=\s*["'][^"']*["']/i.test(tag)).length;

  let mixedContentCount = 0;
  if (finalUrl.startsWith("https://")) {
    mixedContentCount = [...html.matchAll(/(?:src|href)\s*=\s*["']http:\/\/[^"']+["']/gi)].length;
  }

  // Erkennt clientseitig gerenderte Single-Page-Apps (React/Vue/... ohne
  // Server-Rendering): der roh abgerufene HTML-Body enthält dann praktisch
  // keinen sichtbaren Inhalt, nur einen Mount-Punkt — der tatsächliche
  // Inhalt (inkl. echter H1-Überschriften, echter Bilder) entsteht erst nach
  // JavaScript-Ausführung im Browser, die dieses Werkzeug bewusst nicht
  // durchführt (siehe Architektur-Kommentar oben). Body-abhängige Prüfungen
  // wären in diesem Fall irreführend statt hilfreich.
  //
  // Das Modul-Script selbst NICHT nur im Body suchen: ein Vite-
  // Produktionsbuild legt es typischerweise in <head> ab (mit
  // crossorigin-Attribut), nur die lokale Entwicklungsversion in <body> —
  // real aufgetreten: dieser Unterschied ließ die Erkennung beim ersten
  // Produktions-Testlauf gegen IT-Dart selbst fälschlich durchfallen, obwohl
  // der Body nachweislich nur aus einem leeren Mount-Punkt bestand.
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const bodyTextOnly = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  const hasModuleScript = /<script[^>]+type=["']module["']/i.test(html);
  const looksClientRendered = bodyTextOnly.length < 200 && hasModuleScript;

  return {
    title,
    metaDescription,
    hasViewport,
    canonicalHref,
    htmlLang,
    hasFavicon,
    hasDoctype,
    charset,
    og,
    h1Count,
    imgTotal: imgTags.length,
    imgsMissingAlt,
    mixedContentCount,
    looksClientRendered,
  };
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) {
      return json({ error: "Nur für Admins." }, 403, cors);
    }

    const body = await req.json().catch(() => ({}));
    const target = normalizeUrl(body?.url ?? "");
    if (!target) {
      return json({ error: "Ungültige oder nicht erlaubte URL." }, 400, cors);
    }

    let checkId = 0;
    const checks: CheckResult[] = [];
    const push = (category: string, label: string, status: CheckStatus, detail: string, fix?: string) => {
      checkId += 1;
      checks.push({ id: checkId, category, label, status, detail, fix });
    };

    const startedAt = Date.now();
    let res: Response;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      res = await fetch(target.toString(), {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT, "Accept": "text/html,*/*" },
        signal: controller.signal,
      });
      clearTimeout(t);
    } catch (e) {
      const { data: row } = await supabase.from("website_checks").insert({
        url: target.toString(),
        status: "error",
        error_text: `Seite nicht erreichbar: ${(e as Error).message}`,
        triggered_by: user.id,
      }).select("id").single();
      return json({ ok: true, id: row?.id, error: `Seite nicht erreichbar: ${(e as Error).message}` }, 200, cors);
    }
    const responseTimeMs = Date.now() - startedAt;

    const html = await readCapped(res, MAX_BODY_BYTES);
    const finalUrl = res.url || target.toString();
    const a = analyzeHtml(html, finalUrl);

    // --- Technik / Verfügbarkeit ---
    if (res.ok) push("Technik", "Erreichbarkeit", "OK", `HTTP-Status ${res.status}.`);
    else push("Technik", "Erreichbarkeit", "FEHLER", `HTTP-Status ${res.status}.`, "Zielseite/Server prüfen, warum kein Erfolgsstatus zurückkommt.");

    if (finalUrl.startsWith("https://")) push("Technik", "HTTPS aktiv", "OK", "Seite wird über HTTPS ausgeliefert.");
    else push("Technik", "HTTPS aktiv", "FEHLER", "Seite ist nur über HTTP erreichbar.", "TLS-Zertifikat einrichten und auf HTTPS umstellen.");

    if (target.protocol === "http:" && finalUrl.startsWith("https://")) {
      push("Technik", "HTTP→HTTPS-Weiterleitung", "OK", "HTTP-Aufruf wird automatisch auf HTTPS umgeleitet.");
    } else if (target.protocol === "http:") {
      push("Technik", "HTTP→HTTPS-Weiterleitung", "WARN", "HTTP-Aufruf wird nicht automatisch auf HTTPS umgeleitet.", "Serverseitige Weiterleitung von HTTP auf HTTPS einrichten.");
    }

    if (responseTimeMs < 1000) push("Technik", "Antwortzeit", "OK", `${responseTimeMs} ms.`);
    else if (responseTimeMs < 3000) push("Technik", "Antwortzeit", "WARN", `${responseTimeMs} ms — spürbar langsam.`, "Server-Antwortzeit / Caching prüfen.");
    else push("Technik", "Antwortzeit", "FEHLER", `${responseTimeMs} ms — deutlich zu langsam.`, "Hosting/Caching/Serverleistung prüfen.");

    // Keine "Komprimierung"-Prüfung: fetch() dekomprimiert gzip/br/deflate
    // transparent und entfernt dabei den Content-Encoding-Header aus den
    // sichtbaren Response-Headers (Web-Standard-Verhalten, nicht Deno-
    // spezifisch) — ein Fehlen des Headers ist daher grundsätzlich nicht von
    // echtem Fehlen der Kompression unterscheidbar. Real aufgetreten: IT-Dart
    // selbst wird nachweislich per Brotli ausgeliefert (curl bestätigt), der
    // erste Testlauf dieses Werkzeugs meldete hier trotzdem fälschlich WARN.
    // Ohne verlässliche Erkennungsmethode über Standard-fetch lieber keine
    // Prüfung als eine strukturell falsche.

    if (res.redirected) push("Technik", "Weiterleitungen", "OK", "Seite leitet weiter, Endziel wurde erreicht.");

    // --- Sicherheit ---
    const isHttps = finalUrl.startsWith("https://");
    const secHeaders: Array<[string, string, string]> = [
      ["strict-transport-security", "Strict-Transport-Security", "HSTS-Header ergänzen, damit Browser HTTPS erzwingen."],
      ["content-security-policy", "Content-Security-Policy", "CSP-Header definieren, um erlaubte Inhaltsquellen einzuschränken."],
      ["x-content-type-options", "X-Content-Type-Options", "Header mit Wert \"nosniff\" ergänzen."],
      ["referrer-policy", "Referrer-Policy", "Referrer-Policy-Header ergänzen, um Referrer-Datenabfluss zu begrenzen."],
    ];
    for (const [headerName, label, fix] of secHeaders) {
      if (headerName === "strict-transport-security" && !isHttps) continue; // nur relevant über HTTPS
      const val = res.headers.get(headerName);
      if (val) push("Sicherheit", label, "OK", `Gesetzt: ${val.slice(0, 120)}`);
      else push("Sicherheit", label, "WARN", "Header fehlt in der Antwort.", fix);
    }
    const xfo = res.headers.get("x-frame-options");
    const cspFrameAncestors = res.headers.get("content-security-policy")?.includes("frame-ancestors");
    if (xfo || cspFrameAncestors) push("Sicherheit", "Clickjacking-Schutz", "OK", xfo ? `X-Frame-Options: ${xfo}` : "frame-ancestors in CSP gesetzt.");
    else push("Sicherheit", "Clickjacking-Schutz", "WARN", "Weder X-Frame-Options noch frame-ancestors gesetzt.", "X-Frame-Options oder CSP frame-ancestors ergänzen.");

    if (a.mixedContentCount > 0) push("Sicherheit", "Mixed Content", "FEHLER", `${a.mixedContentCount} unsichere (http://) Ressourcen-Referenz(en) auf einer HTTPS-Seite.`, "Alle eingebundenen Ressourcen auf https:// umstellen.");
    else if (isHttps) push("Sicherheit", "Mixed Content", "OK", "Keine unsicheren http://-Referenzen gefunden.");

    // --- SEO / Meta ---
    if (!a.title) push("SEO", "Title-Tag", "FEHLER", "Kein <title> gefunden.", "Aussagekräftigen Seitentitel ergänzen.");
    else if (a.title.length < 10 || a.title.length > 60) push("SEO", "Title-Tag", "WARN", `Vorhanden, aber Länge (${a.title.length} Zeichen) außerhalb der empfohlenen 10–60 Zeichen: "${a.title}"`, "Titel auf 10–60 Zeichen anpassen.");
    else push("SEO", "Title-Tag", "OK", `"${a.title}" (${a.title.length} Zeichen).`);

    if (a.metaDescription) push("SEO", "Meta-Description", "OK", `Vorhanden (${a.metaDescription.length} Zeichen).`);
    else push("SEO", "Meta-Description", "WARN", "Keine Meta-Description gefunden.", "Meta-Description mit 50–160 Zeichen ergänzen.");

    if (a.hasViewport) push("SEO", "Viewport-Meta (mobil)", "OK", "Viewport-Meta-Tag vorhanden.");
    else push("SEO", "Viewport-Meta (mobil)", "FEHLER", "Kein Viewport-Meta-Tag gefunden — Seite ist vermutlich nicht mobil-optimiert.", "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> ergänzen.");

    if (a.canonicalHref) push("SEO", "Canonical-Link", "OK", `Gesetzt: ${a.canonicalHref}`);
    else push("SEO", "Canonical-Link", "WARN", "Kein Canonical-Link gefunden.", "<link rel=\"canonical\"> ergänzen, um Duplicate-Content-Risiken zu vermeiden.");

    if (a.og.title && a.og.description && a.og.image) push("SEO", "Open-Graph-Tags", "OK", "og:title, og:description und og:image gesetzt.");
    else push("SEO", "Open-Graph-Tags", "WARN", "Open-Graph-Tags unvollständig oder fehlend — Linkvorschau in sozialen Netzwerken wirkt dadurch generisch.", "og:title, og:description und og:image ergänzen.");

    if (a.hasFavicon) push("SEO", "Favicon", "OK", "Favicon-Link gefunden.");
    else push("SEO", "Favicon", "WARN", "Kein Favicon-Link gefunden.", "Favicon einbinden.");

    if (a.htmlLang) push("SEO", "Sprachangabe (html lang)", "OK", `lang="${a.htmlLang}"`);
    else push("SEO", "Sprachangabe (html lang)", "WARN", "Kein lang-Attribut am <html>-Tag.", "lang-Attribut (z. B. lang=\"de\") am <html>-Tag ergänzen.");

    if (a.charset) push("SEO", "Zeichensatz", "OK", `Deklariert: ${a.charset}`);
    else push("SEO", "Zeichensatz", "WARN", "Kein Zeichensatz deklariert.", "<meta charset=\"utf-8\"> möglichst als erstes Element in <head> ergänzen.");

    const robots = await fetchAux(finalUrl, "/robots.txt");
    if (robots.present) push("SEO", "robots.txt", "OK", "robots.txt ist erreichbar.");
    else push("SEO", "robots.txt", "WARN", `robots.txt nicht erreichbar${robots.status ? ` (Status ${robots.status})` : ""}.`, "robots.txt im Root der Domain bereitstellen.");

    const sitemap = await fetchAux(finalUrl, "/sitemap.xml");
    if (sitemap.present) push("SEO", "sitemap.xml", "OK", "sitemap.xml ist erreichbar.");
    else push("SEO", "sitemap.xml", "WARN", `sitemap.xml nicht erreichbar${sitemap.status ? ` (Status ${sitemap.status})` : ""}.`, "XML-Sitemap bereitstellen und ggf. in robots.txt referenzieren.");

    // --- Barrierefreiheit ---
    if (a.looksClientRendered) {
      push(
        "Barrierefreiheit",
        "Inhaltsprüfung (H1, Alt-Texte)",
        "WARN",
        "Diese Seite wirkt clientseitig per JavaScript gerendert (z. B. React/Vue-SPA) — der roh abgerufene HTML-Code enthält kaum sichtbaren Inhalt. H1-Struktur und Alt-Texte konnten deshalb nicht zuverlässig geprüft werden, da dieses Werkzeug bewusst keinen Browser ausführt.",
        "Manuell im Browser oder mit einem Tool prüfen, das JavaScript ausführt."
      );
    } else {
      if (a.h1Count === 1) push("Barrierefreiheit", "Überschriftenstruktur (H1)", "OK", "Genau eine H1-Überschrift gefunden.");
      else if (a.h1Count === 0) push("Barrierefreiheit", "Überschriftenstruktur (H1)", "WARN", "Keine H1-Überschrift gefunden.", "Genau eine H1-Hauptüberschrift je Seite ergänzen.");
      else push("Barrierefreiheit", "Überschriftenstruktur (H1)", "WARN", `${a.h1Count} H1-Überschriften gefunden — empfohlen ist genau eine.`, "Auf eine H1-Hauptüberschrift je Seite reduzieren.");

      if (a.imgTotal === 0) push("Barrierefreiheit", "Alt-Texte für Bilder", "OK", "Keine <img>-Tags im HTML gefunden.");
      else if (a.imgsMissingAlt === 0) push("Barrierefreiheit", "Alt-Texte für Bilder", "OK", `Alle ${a.imgTotal} Bilder haben ein alt-Attribut.`);
      else push("Barrierefreiheit", "Alt-Texte für Bilder", a.imgsMissingAlt / a.imgTotal > 0.2 ? "FEHLER" : "WARN", `${a.imgsMissingAlt} von ${a.imgTotal} Bildern ohne alt-Attribut.`, "alt-Attribute für alle inhaltstragenden Bilder ergänzen.");
    }

    if (a.hasDoctype) push("Technik", "HTML-Doctype", "OK", "<!DOCTYPE html> vorhanden.");
    else push("Technik", "HTML-Doctype", "WARN", "Kein <!DOCTYPE html> gefunden — Browser können in den Quirks-Modus wechseln.", "<!DOCTYPE html> als erste Zeile ergänzen.");

    const okCount = checks.filter((c) => c.status === "OK").length;
    const warnCount = checks.filter((c) => c.status === "WARN").length;
    const errorCount = checks.filter((c) => c.status === "FEHLER").length;
    const overall: CheckStatus = errorCount > 0 ? "FEHLER" : warnCount > 0 ? "WARN" : "OK";

    const findings = checks
      .filter((c) => c.status !== "OK")
      .map((c) => ({
        id: c.id,
        symptom: `${c.label}`,
        ursache: c.detail,
        fix: c.fix || "—",
        status: c.status === "FEHLER" ? "FEHLER" : "WARN",
      }));

    const report = {
      report_version: 1,
      target: { input_url: target.toString(), final_url: finalUrl, redirected: res.redirected, status_code: res.status },
      http: {
        response_time_ms: responseTimeMs,
        content_type: res.headers.get("content-type"),
        server: res.headers.get("server"),
      },
      summary: { total: checks.length, ok: okCount, warn: warnCount, error: errorCount, status: overall },
      checks,
      findings,
    };

    const { data: row, error: insertErr } = await supabase.from("website_checks").insert({
      url: target.toString(),
      status: "success",
      report,
      triggered_by: user.id,
    }).select("id").single();

    if (insertErr || !row) {
      console.error("[website-check] insert failed:", JSON.stringify(insertErr));
      return json({ error: "Prüfung wurde durchgeführt, konnte aber nicht gespeichert werden." }, 500, cors);
    }

    return json({ ok: true, id: row.id, report }, 200, cors);
  } catch (e) {
    console.error("[website-check] unexpected error:", e);
    return json({ error: "Unerwarteter Fehler." }, 500, cors);
  }
});

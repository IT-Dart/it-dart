// it-dart.de (ohne www) leitet serverseitig per 308 Redirect auf
// www.it-dart.de weiter -- eine relative Navigation von der nackten
// Apex-Domain aus loest dadurch bei jeder harten Seiten-Navigation einen
// unnoetigen zusaetzlichen Redirect-Hop aus. Auf allen anderen Domains
// (localhost, *.vercel.app, bereits www.it-dart.de) bleibt der Pfad
// einfach relativ.
export function canonicalUrl(path) {
  return window.location.hostname === "it-dart.de" ? `https://www.it-dart.de${path}` : path;
}

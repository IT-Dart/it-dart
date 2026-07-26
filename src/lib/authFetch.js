import { supabase } from "./supabaseClient";

// Gemeinsamer Baustein für "Sitzung holen, autorisierten POST an eine Edge
// Function schicken" — dasselbe Muster wiederholte sich vorher 10x über 6
// Dateien identisch. Antwort-Handling (JSON parsen, Fehlerfelder auswerten)
// bleibt bewusst beim jeweiligen Aufrufer, da sich das je Funktion unterscheidet.
export async function authFetch(fn, body) {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
}

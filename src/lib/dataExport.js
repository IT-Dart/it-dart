import { supabase } from "./supabaseClient";

// Selbstbedienungs-Datenexport (Art. 20 DSGVO, Recht auf Datenübertragbarkeit) --
// bewusst kein Premium-Feature, das Recht gilt unabhängig vom Konto-Status.
// Liest ausschließlich die eigenen Zeilen (RLS erlaubt das bereits über die
// bestehenden Policies), keine zusätzliche Edge Function nötig.

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportMyData(user) {
  const [{ data: profile, error: profileErr }, { data: progress, error: progressErr }, { data: lernnachweise, error: lnErr }] = await Promise.all([
    supabase.from("profiles").select("email,created_at,is_premium,premium_until,confirmed_at,is_trainer").eq("id", user.id).maybeSingle(),
    supabase.from("progress").select("data,updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("lernnachweise").select("kind,title,score,total,percent,badge,started_at,finished_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  if (profileErr) throw profileErr;
  if (progressErr) throw progressErr;
  if (lnErr) throw lnErr;

  const stamp = new Date().toISOString().slice(0, 10);

  const payload = {
    exportiert_am: new Date().toISOString(),
    hinweis: "Selbstbedienungs-Datenexport nach Art. 20 DSGVO (Recht auf Datenübertragbarkeit) -- enthält alle bei IT-Dart zu deinem Konto gespeicherten personenbezogenen Daten.",
    konto: profile || null,
    lernfortschritt: progress?.data || {},
    lernfortschritt_zuletzt_aktualisiert: progress?.updated_at || null,
    lernnachweise: lernnachweise || [],
  };

  downloadBlob(JSON.stringify(payload, null, 2), `it-dart-meine-daten-${stamp}.json`, "application/json");

  if ((lernnachweise || []).length > 0) {
    const header = ["Art", "Titel", "Ergebnis (%)", "Richtig", "Gesamt", "Bewertung", "Begonnen", "Abgeschlossen"];
    const lines = [header.join(";")];
    for (const r of lernnachweise) {
      lines.push([
        r.kind === "pruefung" ? "Prüfungsvorbereitung" : "Modul-Quiz",
        r.title, r.percent, r.score, r.total, r.badge, r.started_at, r.finished_at,
      ].map(csvEscape).join(";"));
    }
    downloadBlob(lines.join("\n"), `it-dart-lernnachweise-${stamp}.csv`, "text/csv");
  }
}

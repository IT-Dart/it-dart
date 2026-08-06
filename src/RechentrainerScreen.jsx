import { useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { Reveal } from "./Reveal";
import { generateProblem, checkAnswer, explainProblem } from "./lib/rechentrainer/generator";

const card = { background: C.s1, border: `0.5px solid ${C.bd}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 };
const chip = (active) => ({ ...ghost, fontSize: 12, padding: "6px 12px", background: active ? "rgba(56,189,248,0.12)" : ghost.background, borderColor: active ? C.cy : C.bd, color: active ? C.cy : ghost.color });

const CATEGORY_LABELS = { subnetting: "Subnetting", zahlensysteme: "Zahlensysteme", klassen: "IP-Klassen" };

// Kleine Bit-Visualisierung: zeigt, welcher Anteil der 32 Adress-Bits durch
// das Praefix als Netz-Anteil festgelegt ist (blau) vs. als Host-Anteil frei
// bleibt (grau) -- nur fuer die Subnetting-Kategorie sinnvoll.
function SubnetBits({ prefix }) {
  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 32 }, (_, i) => (
          <span key={i} style={{
            width: "100%", height: 12, borderRadius: 2,
            background: i < prefix ? C.bl : C.s2,
            border: `0.5px solid ${i < prefix ? C.bl : C.bd}`,
            marginRight: (i + 1) % 8 === 0 && i !== 31 ? 6 : 0,
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: C.mu, margin: "6px 0 0" }}>🔵 {prefix} Netz-Bits · ⬜ {32 - prefix} Host-Bits (je 8 Bit = ein Oktett)</p>
    </div>
  );
}

const GRUNDLAGEN_TEXT = {
  intro: "Subnetting teilt ein großes IP-Netz in kleinere Teilnetze auf. Jede IPv4-Adresse hat 32 Bit — die CIDR-Schreibweise (z. B. /26) legt fest, wie viele dieser Bit von links den Netz-Anteil bilden. Der Rest sind Host-Bits, mit denen sich einzelne Geräte im Teilnetz unterscheiden lassen.",
  beispiel: "Beispiel 192.168.1.0/26: 26 Netz-Bits bedeuten 6 freie Host-Bits, also 2^6 = 64 Adressen insgesamt. Die erste Adresse eines Blocks (192.168.1.0) ist die Netzwerkadresse, die letzte (192.168.1.63) die Broadcast-Adresse — beide sind für Geräte nicht nutzbar. Nutzbare Hosts sind deshalb 64 − 2 = 62, mit gültigem Bereich 192.168.1.1 bis 192.168.1.62.",
  schluss: "Diese Formel — nutzbare Hosts = 2 hoch (Anzahl freier Bits) minus 2 — reicht für jede Subnetzgröße. Für eine Auffrischung von Binär- und Hexadezimalzahlen: siehe Modul „Grundlagen IT & Hardware“, Thema Zahlensysteme.",
};

// Add-on-Werkzeug mit unbegrenzten, zufaellig generierten Uebungsaufgaben
// (Subnetting, Zahlensysteme, IP-Klassen) -- unabhaengig von Premium ueber
// rechentrainer_enabled/rechentrainer_until freischaltbar (siehe
// AdminScreen.jsx). Freischaltung aktuell manuell wie bei Premium, kein
// Preis im Code verankert (siehe CompanyScreen.jsx-Muster).
export default function RechentrainerScreen({ onClose }) {
  const { user, isRechentrainerUnlocked } = useAuth();
  const [mode, setMode] = useState("training"); // "grundlagen" | "training" | "summary"
  const [difficulty, setDifficulty] = useState("leicht");
  const [categories, setCategories] = useState(["subnetting"]);
  const [problem, setProblem] = useState(() => generateProblem({ difficulty: "leicht", categories: ["subnetting"] }));
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // {correct, explanation}
  const [hintCount, setHintCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({}); // {subnetting:{correct,total}, ...}

  const toggleCategory = (cat) => {
    setCategories((cs) => {
      const next = cs.includes(cat) ? cs.filter((c) => c !== cat) : [...cs, cat];
      return next.length ? next : cs; // mindestens eine Kategorie muss aktiv bleiben
    });
  };

  const newProblem = (diff = difficulty, cats = categories) => {
    setProblem(generateProblem({ difficulty: diff, categories: cats }));
    setAnswer(""); setFeedback(null); setHintCount(0);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!answer.trim() || feedback) return;
    const correct = checkAnswer(problem, answer);
    setFeedback({ correct, explanation: explainProblem(problem) });
    setStreak((s) => (correct ? s + 1 : 0));
    setStats((st) => {
      const prev = st[problem.category] || { correct: 0, total: 0 };
      return { ...st, [problem.category]: { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 } };
    });
  };

  const sessionTotal = Object.values(stats).reduce((a, s) => a + s.total, 0);
  const sessionCorrect = Object.values(stats).reduce((a, s) => a + s.correct, 0);

  const mailtoHref = `mailto:kontakt@it-dart.de?subject=${encodeURIComponent("Interesse am Rechentrainer")}&body=${encodeURIComponent(`Hallo,\n\nich habe Interesse am Rechentrainer (Subnetting-Übungswerkzeug).\n\nKonto-E-Mail: ${user?.email || ""}`)}`;

  return (
    <div style={wrap}><div style={inner}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `0.5px solid ${C.bd}`, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>🧮 Rechentrainer</span>
        {isRechentrainerUnlocked && <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
          <button onClick={() => setMode("grundlagen")} style={chip(mode === "grundlagen")}>📖 Grundlagen</button>
          <button onClick={() => setMode("training")} style={chip(mode !== "grundlagen")}>🧮 Training</button>
        </div>}
        <button onClick={onClose} style={{ ...ghost, marginLeft: "auto", fontSize: 13, padding: "6px 12px" }}>← Zurück</button>
      </div>

      {!isRechentrainerUnlocked ? (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.t, marginBottom: 8 }}>Subnetting sicher beherrschen</p>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 12 }}>Unbegrenzt viele, zufällig generierte Übungsaufgaben (Subnetting, Zahlensysteme, IP-Klassen) mit sofortigem Feedback, Hinweis-System und vollständigem Rechenweg — nie zweimal exakt dieselbe Aufgabe.</p>
          <p style={{ fontSize: 12, color: C.mu, marginBottom: 14 }}>Freischaltung erfolgt aktuell manuell, da unsere Zahlungsabwicklung gerade eingerichtet wird — schreib uns kurz für den Zugang.</p>
          <a href={mailtoHref} className="btn-fx" style={{ ...pri, width: "100%", justifyContent: "center", textDecoration: "none", boxSizing: "border-box" }}>Interesse am Rechentrainer →</a>
        </div>

      ) : mode === "grundlagen" ? (<>
        <Reveal><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Grundlagen: Subnetting</h2>
        <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 14 }}>{GRUNDLAGEN_TEXT.intro}</p></Reveal>
        <Reveal><div style={card}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Beispiel</p>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 0 }}>{GRUNDLAGEN_TEXT.beispiel}</p>
          <SubnetBits prefix={26} />
        </div></Reveal>
        <Reveal><p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 20 }}>{GRUNDLAGEN_TEXT.schluss}</p></Reveal>
        <button onClick={() => setMode("training")} style={{ ...pri, width: "100%", justifyContent: "center" }}>Jetzt trainieren →</button>
      </>) : mode === "summary" ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          {(() => {
            const pct = sessionTotal ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
            return (<>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 80 ? "🎯" : pct >= 60 ? "👍" : "💪"}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{pct >= 80 ? "Sehr gut!" : pct >= 60 ? "Gut gemacht!" : "Weiter üben!"}</h3>
              <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>{sessionCorrect} von {sessionTotal} richtig — {pct}%</p>
              <div style={{ height: 8, background: C.s2, borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.gr : pct >= 60 ? C.am : "#ef4444", borderRadius: 4 }} />
              </div>
            </>);
          })()}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, textAlign: "left" }}>
            {Object.entries(stats).map(([cat, s]) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.t2, marginBottom: 3 }}>
                  <span>{CATEGORY_LABELS[cat] || cat}</span><span>{s.correct}/{s.total}</span>
                </div>
                <div style={{ height: 4, background: C.s2, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((s.correct / s.total) * 100)}%`, background: C.cy, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => { setStats({}); setStreak(0); newProblem(); setMode("training"); }} style={ghost}>🔄 Neue Sitzung</button>
            <button onClick={onClose} style={pri}>✓ Übersicht</button>
          </div>
        </div>
      ) : (<>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <button onClick={() => { setDifficulty("leicht"); newProblem("leicht", categories); }} style={chip(difficulty === "leicht")}>Leicht</button>
          <button onClick={() => { setDifficulty("schwer"); newProblem("schwer", categories); }} style={chip(difficulty === "schwer")}>Schwer</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.keys(CATEGORY_LABELS).map((cat) => (
            <button key={cat} onClick={() => { toggleCategory(cat); }} style={chip(categories.includes(cat))}>{CATEGORY_LABELS[cat]}</button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.mu }}>{sessionTotal > 0 ? `${sessionCorrect} von ${sessionTotal} richtig` : "Noch keine Aufgabe beantwortet"}</span>
          <span style={{ fontSize: 12, color: streak >= 3 ? C.am : C.mu }}>{streak >= 2 ? `🔥 ${streak} in Folge` : ""}</span>
        </div>

        <div style={card}>
          <p style={{ fontSize: 15, color: C.t, lineHeight: 1.6, marginBottom: 10 }}>{problem.question}</p>

          {hintCount > 0 && (
            <div style={{ background: C.s2, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              {problem.hintSteps.slice(0, hintCount).map((h, i) => (
                <p key={i} style={{ fontSize: 12, color: C.t2, margin: i === 0 ? 0 : "4px 0 0", lineHeight: 1.5 }}>💡 {h}</p>
              ))}
            </div>
          )}
          {!feedback && hintCount < problem.hintSteps.length && (
            <button type="button" onClick={() => setHintCount((h) => h + 1)} style={{ background: "none", border: "none", color: C.cy, cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0, fontFamily: ff, marginBottom: 12 }}>💡 Tipp ({hintCount}/{problem.hintSteps.length})</button>
          )}

          <form onSubmit={submit}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              type="text"
              disabled={!!feedback}
              placeholder="Antwort"
              style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", marginTop: 10, marginBottom: 14, boxSizing: "border-box" }}
            />
            {!feedback && <button type="submit" disabled={!answer.trim()} style={{ ...pri, width: "100%", justifyContent: "center", opacity: answer.trim() ? 1 : .6 }}>Prüfen →</button>}
          </form>
          {feedback && (
            <div style={{ background: feedback.correct ? "#052e16" : "#450a0a", border: `0.5px solid ${feedback.correct ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: feedback.correct ? "#86efac" : "#fca5a5", margin: "0 0 6px" }}>{feedback.correct ? "Richtig!" : "Nicht ganz."}</p>
              <p style={{ fontSize: 12, color: C.t2, margin: 0, lineHeight: 1.6, fontFamily: ff }}>{feedback.explanation}</p>
              {problem.category === "subnetting" && <SubnetBits prefix={problem.prefix} />}
            </div>
          )}
        </div>
        {feedback && <button onClick={() => newProblem()} style={{ ...pri, width: "100%", justifyContent: "center", marginBottom: 10 }}>Nächste Aufgabe →</button>}
        {sessionTotal > 0 && <button onClick={() => setMode("summary")} style={{ background: "none", border: "none", color: C.mu, cursor: "pointer", fontSize: 12, textDecoration: "underline", width: "100%", textAlign: "center", fontFamily: ff }}>Sitzung beenden</button>}
      </>)}
    </div></div>
  );
}

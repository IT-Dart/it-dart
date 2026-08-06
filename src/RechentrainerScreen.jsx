import { useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { generateProblem, checkAnswer, explainProblem } from "./lib/rechentrainer/generator";

const card = { background: C.s1, border: `0.5px solid ${C.bd}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 };

// Add-on-Werkzeug mit unbegrenzten, zufaellig generierten Subnetting-
// Aufgaben -- unabhaengig von Premium ueber rechentrainer_enabled/
// rechentrainer_until freischaltbar (siehe AdminScreen.jsx). Freischaltung
// aktuell manuell wie bei Premium, kein Preis im Code verankert (siehe
// CompanyScreen.jsx-Muster fuer den Premium-Hinweistext).
export default function RechentrainerScreen({ onClose }) {
  const { user, isRechentrainerUnlocked } = useAuth();
  const [problem, setProblem] = useState(() => generateProblem());
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // {correct, explanation}
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const submit = (e) => {
    e.preventDefault();
    if (!answer.trim() || feedback) return;
    const correct = checkAnswer(problem, answer);
    setFeedback({ correct, explanation: explainProblem(problem) });
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    setProblem(generateProblem());
    setAnswer("");
    setFeedback(null);
  };

  const mailtoHref = `mailto:kontakt@it-dart.de?subject=${encodeURIComponent("Interesse am Rechentrainer")}&body=${encodeURIComponent(`Hallo,\n\nich habe Interesse am Rechentrainer (Subnetting-Übungswerkzeug).\n\nKonto-E-Mail: ${user?.email || ""}`)}`;

  return (
    <div style={wrap}><div style={inner}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `0.5px solid ${C.bd}` }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>🧮 Rechentrainer</span>
        <button onClick={onClose} style={{ ...ghost, marginLeft: "auto", fontSize: 13, padding: "6px 12px" }}>← Zurück</button>
      </div>

      {!isRechentrainerUnlocked ? (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.t, marginBottom: 8 }}>Subnetting sicher beherrschen</p>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 12 }}>Unbegrenzt viele, zufällig generierte Subnetting-Aufgaben mit sofortigem Feedback und vollständigem Rechenweg — Netzwerkadresse, Broadcast-Adresse, nutzbare Hosts, Subnetzmaske und Host-Bereich, nie zweimal exakt dieselbe Aufgabe.</p>
          <p style={{ fontSize: 12, color: C.mu, marginBottom: 14 }}>Freischaltung erfolgt aktuell manuell, da unsere Zahlungsabwicklung gerade eingerichtet wird — schreib uns kurz für den Zugang.</p>
          <a href={mailtoHref} className="btn-fx" style={{ ...pri, width: "100%", justifyContent: "center", textDecoration: "none", boxSizing: "border-box" }}>Interesse am Rechentrainer →</a>
        </div>
      ) : (<>
        {score.total > 0 && <p style={{ fontSize: 12, color: C.mu, marginBottom: 14 }}>{score.correct} von {score.total} richtig</p>}
        <div style={card}>
          <p style={{ fontSize: 15, color: C.t, lineHeight: 1.6, marginBottom: 14 }}>{problem.question}</p>
          <form onSubmit={submit}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              type="text"
              disabled={!!feedback}
              placeholder="Antwort"
              style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" }}
            />
            {!feedback && <button type="submit" disabled={!answer.trim()} style={{ ...pri, width: "100%", justifyContent: "center", opacity: answer.trim() ? 1 : .6 }}>Prüfen →</button>}
          </form>
          {feedback && (
            <div style={{ background: feedback.correct ? "#052e16" : "#450a0a", border: `0.5px solid ${feedback.correct ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: "10px 14px", marginTop: feedback ? 0 : 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: feedback.correct ? "#86efac" : "#fca5a5", margin: "0 0 6px" }}>{feedback.correct ? "Richtig!" : "Nicht ganz."}</p>
              <p style={{ fontSize: 12, color: C.t2, margin: 0, lineHeight: 1.6, fontFamily: ff }}>{feedback.explanation}</p>
            </div>
          )}
        </div>
        {feedback && <button onClick={next} style={{ ...pri, width: "100%", justifyContent: "center" }}>Nächste Aufgabe →</button>}
      </>)}
    </div></div>
  );
}

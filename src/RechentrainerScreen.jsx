import { useState } from "react";
import { C, pri, ghost, wrap, inner, ff, fm } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { Reveal } from "./Reveal";
import { generateProblem, checkAnswer, explainProblem, parseIp, ipToInt, intToIp, maskIntFromPrefix, networkInt, broadcastInt, usableHostCount, decToBin8, decToHex2, ipClassOf } from "./lib/rechentrainer/generator";

const card = { background: C.s1, border: `0.5px solid ${C.bd}`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 };
const chip = (active) => ({ ...ghost, fontSize: 12, padding: "6px 12px", background: active ? "rgba(56,189,248,0.12)" : ghost.background, borderColor: active ? C.cy : C.bd, color: active ? C.cy : ghost.color });

const CATEGORY_LABELS = { subnetting: "Subnetting", zahlensysteme: "Zahlensysteme", klassen: "IP-Klassen" };

// Kleine, an jeder Ecke offene Rahmenmarkierung fuer den "HUD"-Look der
// Aufgaben-Card -- rein dekorativ, braucht position:relative am Elternteil.
function CornerBrackets() {
  const base = { position: "absolute", width: 14, height: 14 };
  return (<>
    <span style={{ ...base, top: -1, left: -1, borderTop: `2px solid ${C.cy}`, borderLeft: `2px solid ${C.cy}`, borderTopLeftRadius: 6 }} />
    <span style={{ ...base, top: -1, right: -1, borderTop: `2px solid ${C.cy}`, borderRight: `2px solid ${C.cy}`, borderTopRightRadius: 6 }} />
    <span style={{ ...base, bottom: -1, left: -1, borderBottom: `2px solid ${C.cy}`, borderLeft: `2px solid ${C.cy}`, borderBottomLeftRadius: 6 }} />
    <span style={{ ...base, bottom: -1, right: -1, borderBottom: `2px solid ${C.cy}`, borderRight: `2px solid ${C.cy}`, borderBottomRightRadius: 6 }} />
  </>);
}

// Bit-Visualisierung: zeigt, welcher Anteil der 32 Adress-Bits durch das
// Praefix als Netz-Anteil festgelegt ist (blau) vs. als Host-Anteil frei
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

// Bit-Wertigkeiten eines einzelnen Oktetts, fuer die Zahlensysteme-Grundlagen.
function BitWeights({ value }) {
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  const bits = value.toString(2).padStart(8, "0").split("").map(Number);
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 10, marginBottom: 4 }}>
      {weights.map((w, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.mu, marginBottom: 2, fontFamily: fm }}>{w}</div>
          <div style={{ height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: bits[i] ? C.bl : C.s2, border: `0.5px solid ${bits[i] ? C.bl : C.bd}`, color: bits[i] ? "#fff" : C.mu, fontSize: 13, fontWeight: 700, fontFamily: fm }}>{bits[i]}</div>
        </div>
      ))}
    </div>
  );
}

// Reihenfolge bewusst didaktisch aufbauend: Zahlensysteme (Grundlage fuer
// alles Weitere, auch Modul g steht im Lehrplan vor Modul o) -> IP-Klassen
// (fuehrt Netz-/Host-Anteil in einfacher, fester Form ein) -> Subnetting
// (verallgemeinert dasselbe Prinzip auf beliebige Bit-Grenzen).
const GRUNDLAGEN = {
  zahlensysteme: {
    title: "Zahlensysteme",
    intro: "Computer verarbeiten alles binär, also nur mit den Ziffern 0 und 1. Jedes Oktett einer IPv4-Adresse ist eine 8-Bit-Binärzahl, die zur besseren Lesbarkeit als Dezimalzahl (0 bis 255) geschrieben wird. Hexadezimal ist eine kompakte Alternative: eine Hex-Ziffer steht immer für genau 4 Bit.",
    beispiel: "Beispiel: Das Oktett 192 entspricht binär 11000000 — die Bit-Wertigkeiten 128, 64, 32, 16, 8, 4, 2, 1 werden an den gesetzten (1-)Stellen addiert: 128 + 64 = 192. In Hexadezimal wird dasselbe Oktett in zwei 4er-Gruppen (Nibbles) zerlegt: 1100 = C, 0000 = 0, also C0.",
    visual: <BitWeights value={192} />,
    schluss: "Diese Umrechnung braucht vor allem Übung, keine komplizierte Formel — genau das trainiert dieser Abschnitt. Für eine ausführlichere Einführung: Modul Grundlagen IT & Hardware, Thema Zahlensysteme.",
  },
  klassen: {
    title: "IP-Klassen",
    intro: "Bevor sich CIDR durchsetzte, wurden IPv4-Netze in feste Klassen A, B und C eingeteilt — erkennbar allein am ersten Oktett der Adresse. Jede Klasse hatte eine feste Standard-Subnetzmaske.",
    beispiel: "Beispiel: Das erste Oktett 172 liegt im Bereich 128 bis 191 — das ist Klasse B mit der Standardmaske 255.255.0.0 (/16).",
    visual: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        {[["A", "1–126", "/8"], ["B", "128–191", "/16"], ["C", "192–223", "/24"]].map(([k, range, mask]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", background: C.s2, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: fm }}>
            <span style={{ color: C.cy, fontWeight: 700 }}>Klasse {k}</span><span style={{ color: C.t2 }}>{range}</span><span style={{ color: C.mu }}>{mask}</span>
          </div>
        ))}
      </div>
    ),
    schluss: "In der Praxis hat CIDR die starren Klassengrenzen abgelöst — Netze werden heute flexibel nach Bedarf zugeschnitten, nicht mehr nur in diesen drei festen Größen. Die Klasseneinteilung bleibt aber Prüfungsstoff und hilft, typische private Adressbereiche (10.x, 172.16 bis 31.x, 192.168.x) einzuordnen.",
  },
  subnetting: {
    title: "Subnetting",
    intro: "Subnetting teilt ein großes IP-Netz in kleinere Teilnetze auf. Jede IPv4-Adresse hat 32 Bit — die CIDR-Schreibweise (z. B. /26) legt fest, wie viele dieser Bit von links den Netz-Anteil bilden. Der Rest sind Host-Bits, mit denen sich einzelne Geräte im Teilnetz unterscheiden lassen.",
    beispiel: "Beispiel 192.168.1.0/26: 26 Netz-Bits bedeuten 6 freie Host-Bits, also 2^6 = 64 Adressen insgesamt. Die erste Adresse eines Blocks (192.168.1.0) ist die Netzwerkadresse, die letzte (192.168.1.63) die Broadcast-Adresse — beide sind für Geräte nicht nutzbar. Nutzbare Hosts sind deshalb 64 − 2 = 62, mit gültigem Bereich 192.168.1.1 bis 192.168.1.62.",
    visual: <SubnetBits prefix={26} />,
    schluss: "Diese Formel — nutzbare Hosts = 2 hoch Anzahl freier Bits, minus 2 — reicht für jede Subnetzgröße.",
  },
};

// Add-on-Werkzeug mit unbegrenzten, zufaellig generierten Uebungsaufgaben
// (Subnetting, Zahlensysteme, IP-Klassen) -- unabhaengig von Premium ueber
// rechentrainer_enabled/rechentrainer_until freischaltbar (siehe
// AdminScreen.jsx). Freischaltung aktuell manuell wie bei Premium, kein
// Preis im Code verankert (siehe CompanyScreen.jsx-Muster).
export default function RechentrainerScreen({ onClose }) {
  const { user, isRechentrainerUnlocked, rechentrainerToolEnabled } = useAuth();
  // Landet bewusst zuerst auf "grundlagen", nicht "training" -- jeder
  // Aufruf des Screens (nicht nur der allererste) soll zunaechst die
  // Einfuehrung zeigen, bevor trainiert wird.
  // "grundlagen" | "training" | "summary" | "pruefung-setup" | "pruefung-laufend" | "pruefung-ergebnis" | "rechner"
  const [mode, setMode] = useState("grundlagen");
  const [grundlagenCat, setGrundlagenCat] = useState("zahlensysteme");
  // "Rechner"-Modus: direkte Umrechnung statt Uebungsaufgabe -- separat per
  // rechentrainer_tool_enabled abstellbar (siehe AuthContext.jsx), falls ein
  // Ausbildungsbetrieb den Sofort-Umrechner didaktisch nicht moechte.
  const [rechnerTool, setRechnerTool] = useState("subnetz");
  const [snIp, setSnIp] = useState("192.168.1.100");
  const [snPrefix, setSnPrefix] = useState("26");
  const [zDec, setZDec] = useState("192");
  const [zBin, setZBin] = useState(decToBin8(192));
  const [zHex, setZHex] = useState(decToHex2(192));
  const [difficulty, setDifficulty] = useState("leicht");
  const [categories, setCategories] = useState(["subnetting"]);
  const [problem, setProblem] = useState(() => generateProblem({ difficulty: "leicht", categories: ["subnetting"] }));
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // {correct, explanation}
  const [hintCount, setHintCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({}); // {subnetting:{correct,total}, ...}

  // Pruefungsmodus: eigener, von der freien Uebungsschleife komplett
  // getrennter Zustand -- feste Laenge, keine Tipps, kein Feedback bis zum
  // Abschluss. Aufgaben werden wie im Trainingsmodus erst beim Start
  // generiert (nicht vorab fest verdrahtet), bleiben aber fuer die gesamte
  // Pruefung unveraendert in examProblems stehen.
  const [examLength, setExamLength] = useState(10);
  const [examProblems, setExamProblems] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswer, setExamAnswer] = useState("");
  const [examResults, setExamResults] = useState([]); // [{problem, userAnswer, correct}]

  const toggleCategory = (cat) => {
    setCategories((cs) => {
      const next = cs.includes(cat) ? cs.filter((c) => c !== cat) : [...cs, cat];
      return next.length ? next : cs; // mindestens eine Kategorie muss aktiv bleiben
    });
  };

  // Einzige Quelle der Wahrheit im Zahlensystem-Umrechner ist immer der
  // zuletzt gueltige Dezimalwert -- alle drei Felder werden von hier aus
  // synchronisiert, egal welches Feld der Ausloeser war.
  const applyDecimal = (n) => {
    const clamped = Math.max(0, Math.min(255, n));
    setZDec(String(clamped));
    setZBin(decToBin8(clamped));
    setZHex(decToHex2(clamped));
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

  const startExam = () => {
    setExamProblems(Array.from({ length: examLength }, () => generateProblem({ difficulty, categories })));
    setExamIndex(0); setExamAnswer(""); setExamResults([]);
    setMode("pruefung-laufend");
  };

  const submitExamAnswer = (e) => {
    e.preventDefault();
    if (!examAnswer.trim()) return;
    const current = examProblems[examIndex];
    const correct = checkAnswer(current, examAnswer);
    const nextResults = [...examResults, { problem: current, userAnswer: examAnswer, correct }];
    setExamResults(nextResults);
    setExamAnswer("");
    if (examIndex + 1 < examProblems.length) setExamIndex((i) => i + 1);
    else setMode("pruefung-ergebnis");
  };

  const examCurrent = examProblems[examIndex];
  const examCorrectCount = examResults.filter((r) => r.correct).length;
  const examStatsByCategory = examResults.reduce((acc, r) => {
    const cat = r.problem.category;
    const prev = acc[cat] || { correct: 0, total: 0 };
    return { ...acc, [cat]: { correct: prev.correct + (r.correct ? 1 : 0), total: prev.total + 1 } };
  }, {});

  const mailtoHref = `mailto:kontakt@it-dart.de?subject=${encodeURIComponent("Interesse am Rechentrainer")}&body=${encodeURIComponent(`Hallo,\n\nich habe Interesse am Rechentrainer (Subnetting-Übungswerkzeug).\n\nKonto-E-Mail: ${user?.email || ""}`)}`;

  // Reine Ableitung aus snIp/snPrefix bei jedem Render -- kein eigener
  // Ergebnis-State noetig, die Eingabefelder selbst sind die Quelle.
  const snParsedIp = parseIp(snIp);
  const snPrefixNum = Number(snPrefix);
  const snPrefixValid = snPrefix.trim() !== "" && Number.isInteger(snPrefixNum) && snPrefixNum >= 0 && snPrefixNum <= 32;
  const snValid = !!snParsedIp && snPrefixValid;
  let snResult = null;
  if (snValid) {
    const ipInt = ipToInt(snParsedIp);
    const maskInt = maskIntFromPrefix(snPrefixNum);
    const netInt = networkInt(ipInt, maskInt);
    const bcastInt = broadcastInt(netInt, maskInt);
    const hosts = usableHostCount(snPrefixNum);
    snResult = {
      mask: intToIp(maskInt),
      net: intToIp(netInt),
      bcast: intToIp(bcastInt),
      hosts,
      range: hosts > 0 ? `${intToIp(netInt + 1)} – ${intToIp(bcastInt - 1)}` : "keine (Punkt-zu-Punkt bzw. Einzeladresse)",
      cls: ipClassOf(snParsedIp[0]),
    };
  }
  const zDecNum = parseInt(zDec, 10);
  const zDecValid = !isNaN(zDecNum) && zDecNum >= 0 && zDecNum <= 255;

  return (
    <div style={wrap}><div style={inner}>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `0.5px solid ${C.bd}` }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>🧮 Rechentrainer</span>
        {/* Tabs und Zurück bewusst als EINE Flex-Reihe (nicht mehr verschachtelt
            mit dem Titel) -- so bleibt Zurück immer auf derselben Zeile/Höhe wie
            der letzte Tab, statt bei zu wenig Platz unvorhersehbar woanders zu
            landen. Auf sehr schmalen Bildschirmen kann diese Reihe selbst noch
            umbrechen, das ist inhaltsbedingt (5 Elemente) und bleibt dabei aber
            weiterhin als zusammenhängende Gruppe erkennbar. */}
        {isRechentrainerUnlocked && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={() => setMode("grundlagen")} style={chip(mode === "grundlagen")}>📖 Grundlagen</button>
          <button onClick={() => setMode("training")} style={chip(mode === "training" || mode === "summary")}>🧮 Training</button>
          <button onClick={() => setMode("pruefung-setup")} style={chip(mode.startsWith("pruefung"))}>🎓 Prüfung</button>
          {rechentrainerToolEnabled && <button onClick={() => setMode("rechner")} style={chip(mode === "rechner")}>🛠️ Rechner</button>}
          <button onClick={onClose} style={{ ...ghost, marginLeft: "auto", fontSize: 13, padding: "6px 12px" }}>← Zurück</button>
        </div>}
        {!isRechentrainerUnlocked && <button onClick={onClose} style={{ ...ghost, marginTop: 12, fontSize: 13, padding: "6px 12px" }}>← Zurück</button>}
      </div>

      {!isRechentrainerUnlocked ? (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.t, marginBottom: 8 }}>Subnetting sicher beherrschen</p>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 12 }}>Unbegrenzt viele, zufällig generierte Übungsaufgaben (Subnetting, Zahlensysteme, IP-Klassen) mit sofortigem Feedback, Hinweis-System und vollständigem Rechenweg — nie zweimal exakt dieselbe Aufgabe.</p>
          <p style={{ fontSize: 12, color: C.mu, marginBottom: 14 }}>Freischaltung erfolgt aktuell manuell, da unsere Zahlungsabwicklung gerade eingerichtet wird — schreib uns kurz für den Zugang.</p>
          <a href={mailtoHref} className="btn-fx" style={{ ...pri, width: "100%", justifyContent: "center", textDecoration: "none", boxSizing: "border-box" }}>Interesse am Rechentrainer →</a>
        </div>

      ) : mode === "grundlagen" ? (<>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {Object.keys(GRUNDLAGEN).map((cat, i) => (
            <button key={cat} onClick={() => setGrundlagenCat(cat)} style={chip(grundlagenCat === cat)}>{i + 1}. {GRUNDLAGEN[cat].title}</button>
          ))}
        </div>
        <Reveal key={`${grundlagenCat}-intro`}><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Grundlagen: {GRUNDLAGEN[grundlagenCat].title}</h2>
        <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 14 }}>{GRUNDLAGEN[grundlagenCat].intro}</p></Reveal>
        <Reveal key={`${grundlagenCat}-beispiel`}><div style={card}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Beispiel</p>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 0 }}>{GRUNDLAGEN[grundlagenCat].beispiel}</p>
          {GRUNDLAGEN[grundlagenCat].visual}
        </div></Reveal>
        <Reveal key={`${grundlagenCat}-schluss`}><p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 20 }}>{GRUNDLAGEN[grundlagenCat].schluss}</p></Reveal>
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

      ) : mode === "pruefung-setup" ? (<>
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.t, marginBottom: 8 }}>🎓 Prüfungsmodus</p>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.7, marginBottom: 14 }}>Feste Anzahl Aufgaben ohne Tipps und ohne Zwischenfeedback — ob eine Antwort richtig war, siehst du erst am Ende, dafür mit vollständiger Auswertung jeder einzelnen Aufgabe.</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Schwierigkeit</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <button onClick={() => setDifficulty("leicht")} style={chip(difficulty === "leicht")}>Leicht</button>
            <button onClick={() => setDifficulty("schwer")} style={chip(difficulty === "schwer")}>Schwer</button>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Themen</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.keys(CATEGORY_LABELS).map((cat) => (
              <button key={cat} onClick={() => toggleCategory(cat)} style={chip(categories.includes(cat))}>{CATEGORY_LABELS[cat]}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Länge</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[10, 15, 20].map((n) => (
              <button key={n} onClick={() => setExamLength(n)} style={chip(examLength === n)}>{n} Aufgaben</button>
            ))}
          </div>
        </div>
        <button onClick={startExam} style={{ ...pri, width: "100%", justifyContent: "center" }}>Prüfung starten →</button>
      </>) : mode === "pruefung-laufend" ? (<>
        <p style={{ fontSize: 12, color: C.mu, marginBottom: 10 }}>Frage {examIndex + 1} von {examProblems.length}</p>
        <div style={{ height: 4, background: C.s2, borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ height: "100%", width: `${Math.round((examIndex / examProblems.length) * 100)}%`, background: C.cy, borderRadius: 2, transition: "width .3s" }} />
        </div>
        <div style={{ position: "relative", background: "linear-gradient(180deg, rgba(56,189,248,0.07), rgba(26,37,53,0) 55%)", border: `0.5px solid ${C.bd}`, borderRadius: 12, padding: "18px 18px 16px", marginBottom: 12 }}>
          <CornerBrackets />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.cy, marginBottom: 10 }}>▹ Prüfung · {CATEGORY_LABELS[examCurrent.category]}</p>
          <p style={{ fontSize: 15, color: C.t, lineHeight: 1.7, marginBottom: 10, fontFamily: fm }}>{examCurrent.question}</p>
          <form onSubmit={submitExamAnswer}>
            <input
              value={examAnswer}
              onChange={(e) => setExamAnswer(e.target.value)}
              type="text"
              placeholder="Antwort"
              autoFocus
              style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: fm, marginTop: 10, marginBottom: 14, boxSizing: "border-box" }}
            />
            <button type="submit" disabled={!examAnswer.trim()} style={{ ...pri, width: "100%", justifyContent: "center", opacity: examAnswer.trim() ? 1 : .6 }}>{examIndex + 1 === examProblems.length ? "Prüfung abschließen →" : "Weiter →"}</button>
          </form>
        </div>
      </>) : mode === "pruefung-ergebnis" ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          {(() => {
            const pct = examResults.length ? Math.round((examCorrectCount / examResults.length) * 100) : 0;
            return (<>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{pct >= 80 ? "🎯" : pct >= 60 ? "👍" : "💪"}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{pct >= 80 ? "Sehr gut!" : pct >= 60 ? "Gut gemacht!" : "Weiter üben!"}</h3>
              <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>{examCorrectCount} von {examResults.length} richtig — {pct}%</p>
              <div style={{ height: 8, background: C.s2, borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.gr : pct >= 60 ? C.am : "#ef4444", borderRadius: 4 }} />
              </div>
            </>);
          })()}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, textAlign: "left" }}>
            {Object.entries(examStatsByCategory).map(([cat, s]) => (
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
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
            <button onClick={() => setMode("pruefung-setup")} style={ghost}>🔄 Neue Prüfung</button>
            <button onClick={onClose} style={pri}>✓ Übersicht</button>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10, textAlign: "left" }}>Auswertung je Aufgabe</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
            {examResults.map((r, i) => (
              <div key={i} style={{ background: C.s1, border: `0.5px solid ${r.correct ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 12, color: C.mu, margin: "0 0 4px", fontFamily: fm }}>{i + 1}. {r.problem.question}</p>
                <p style={{ fontSize: 12, margin: "0 0 4px", fontFamily: fm }}><span style={{ color: r.correct ? "#86efac" : "#fca5a5" }}>Deine Antwort: {r.userAnswer}</span>{!r.correct && <span style={{ color: C.t2 }}> · Richtig: {r.problem.correctAnswer}</span>}</p>
                <p style={{ fontSize: 11, color: C.mu, margin: 0, lineHeight: 1.5, fontFamily: fm }}>{explainProblem(r.problem)}</p>
              </div>
            ))}
          </div>
        </div>

      ) : mode === "rechner" ? (<>
        <div style={{ background: "rgba(56,189,248,0.08)", border: `0.5px solid ${C.cy}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
          🛠️ <strong style={{ color: C.cy }}>Für den Berufsalltag</strong> — kein Prüfungstraining. In der echten Prüfung musst du das ohne Hilfsmittel selbst rechnen können; dafür sind Training und Prüfungsmodus da.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => setRechnerTool("subnetz")} style={chip(rechnerTool === "subnetz")}>IP / Subnetz</button>
          <button onClick={() => setRechnerTool("zahlen")} style={chip(rechnerTool === "zahlen")}>Zahlensystem</button>
        </div>

        {rechnerTool === "subnetz" ? (<>
          <div style={card}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Eingabe</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "2 1 200px" }}>
                <label style={{ fontSize: 11, color: C.mu, display: "block", marginBottom: 4 }}>IP-Adresse</label>
                <input value={snIp} onChange={(e) => setSnIp(e.target.value)} type="text" placeholder="192.168.1.100" style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: fm, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: "1 1 90px" }}>
                <label style={{ fontSize: 11, color: C.mu, display: "block", marginBottom: 4 }}>Präfix</label>
                <input value={snPrefix} onChange={(e) => setSnPrefix(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} type="text" placeholder="26" style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: fm, boxSizing: "border-box" }} />
              </div>
            </div>
            {!snValid && <p style={{ fontSize: 12, color: C.co, margin: "10px 0 0" }}>Bitte eine gültige IPv4-Adresse (z. B. 192.168.1.100) und ein Präfix von 0–32 eingeben.</p>}
          </div>

          {snResult && (<div style={card}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Ergebnis</p>
            {[
              ["Subnetzmaske", snResult.mask],
              ["Netzwerkadresse", snResult.net],
              ["Broadcast-Adresse", snResult.bcast],
              ["Nutzbare Hosts", String(snResult.hosts)],
              ["Host-Bereich", snResult.range],
              ["IP-Klasse", snResult.cls ? `Klasse ${snResult.cls}` : "kein Standard A/B/C (privat/reserviert)"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${C.bd}` }}>
                <span style={{ fontSize: 13, color: C.t2 }}>{label}</span>
                <span style={{ fontSize: 13, color: C.t, fontFamily: fm, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
            <SubnetBits prefix={snPrefixNum} />
          </div>)}
        </>) : (<>
          <div style={card}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.cy, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Ein Oktett (0–255) umrechnen</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 90px" }}>
                <label style={{ fontSize: 11, color: C.mu, display: "block", marginBottom: 4 }}>Dezimal</label>
                <input value={zDec} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 3); setZDec(raw); const n = parseInt(raw, 10); if (!isNaN(n) && n >= 0 && n <= 255) applyDecimal(n); }} type="text" style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: fm, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: "2 1 140px" }}>
                <label style={{ fontSize: 11, color: C.mu, display: "block", marginBottom: 4 }}>Binär (8 Bit)</label>
                <input value={zBin} onChange={(e) => { const raw = e.target.value.replace(/[^01]/g, "").slice(0, 8); setZBin(raw); if (raw.length === 8) applyDecimal(parseInt(raw, 2)); }} type="text" style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: fm, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: "1 1 90px" }}>
                <label style={{ fontSize: 11, color: C.mu, display: "block", marginBottom: 4 }}>Hex</label>
                <input value={zHex} onChange={(e) => { const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 2).toUpperCase(); setZHex(raw); if (raw.length > 0) applyDecimal(parseInt(raw, 16)); }} type="text" style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: fm, boxSizing: "border-box" }} />
              </div>
            </div>
            {!zDecValid && <p style={{ fontSize: 12, color: C.co, margin: "10px 0 0" }}>Bitte eine Zahl zwischen 0 und 255 eingeben (ein Oktett hat 8 Bit).</p>}
            <BitWeights value={zDecValid ? zDecNum : 0} />
          </div>
        </>)}
      </>) : (<>
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

        <div style={{ position: "relative", background: "linear-gradient(180deg, rgba(56,189,248,0.07), rgba(26,37,53,0) 55%)", border: `0.5px solid ${C.bd}`, borderRadius: 12, padding: "18px 18px 16px", marginBottom: 12 }}>
          <CornerBrackets />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.cy, marginBottom: 10 }}>▹ Aufgabe · {CATEGORY_LABELS[problem.category]}</p>
          <p style={{ fontSize: 15, color: C.t, lineHeight: 1.7, marginBottom: 10, fontFamily: fm }}>{problem.question}</p>

          {hintCount > 0 && (
            <div style={{ background: C.s2, borderLeft: `3px solid ${C.cy}`, borderRadius: "0 8px 8px 0", padding: "8px 12px", marginBottom: 10 }}>
              {problem.hintSteps.slice(0, hintCount).map((h, i) => (
                <p key={i} style={{ fontSize: 12, color: C.t2, margin: i === 0 ? 0 : "4px 0 0", lineHeight: 1.5, fontFamily: fm }}>{h}</p>
              ))}
            </div>
          )}
          {!feedback && hintCount < problem.hintSteps.length && (
            <button type="button" onClick={() => setHintCount((h) => h + 1)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(56,189,248,0.1)", border: `1px solid ${C.cy}`, borderRadius: 20, color: C.cy, cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "6px 14px 6px 12px", fontFamily: ff, marginBottom: 12 }}>
              💡 Tipp <span style={{ background: C.cy, color: C.bg, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{hintCount}/{problem.hintSteps.length}</span>
            </button>
          )}

          <form onSubmit={submit}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              type="text"
              disabled={!!feedback}
              placeholder="Antwort"
              style={{ width: "100%", background: C.s2, border: `0.5px solid ${C.bd}`, borderRadius: 10, color: C.t, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: fm, marginTop: 10, marginBottom: 14, boxSizing: "border-box" }}
            />
            {!feedback && <button type="submit" disabled={!answer.trim()} style={{ ...pri, width: "100%", justifyContent: "center", opacity: answer.trim() ? 1 : .6 }}>Prüfen →</button>}
          </form>
          {feedback && (
            <div style={{ background: feedback.correct ? "#052e16" : "#450a0a", border: `0.5px solid ${feedback.correct ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: feedback.correct ? "#86efac" : "#fca5a5", margin: "0 0 6px" }}>{feedback.correct ? "Richtig!" : "Nicht ganz."}</p>
              <p style={{ fontSize: 12, color: C.t2, margin: 0, lineHeight: 1.6, fontFamily: fm }}>{feedback.explanation}</p>
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

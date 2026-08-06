// Reiner Aufgaben-Generator fuer den Rechentrainer (Subnetting/CIDR,
// Zahlensysteme, IP-Klassen). Bewusst ohne jeden Import aus supabase/
// AuthContext/React -- diese Datei muss unveraendert wiederverwendbar
// bleiben, falls der Rechentrainer spaeter als eigenstaendige PWA/
// Play-Store-App verpackt wird (siehe Plan).

const PRIVATE_BLOCKS = [
  { base: [10, 0, 0, 0], hostBits: 24 },
  { base: [172, 16, 0, 0], hostBits: 20 },
  { base: [192, 168, 0, 0], hostBits: 16 },
];

const LEICHT_PREFIXES = [24, 25, 26, 27, 28];
const LEICHT_OCTETS = [0, 16, 32, 64, 128, 192, 224, 240, 248, 252, 254, 255];

function ipToInt([a, b, c, d]) {
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

function intToIp(int) {
  return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(".");
}

function maskIntFromPrefix(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function networkInt(ipInt, maskInt) {
  return (ipInt & maskInt) >>> 0;
}

export function broadcastInt(netInt, maskInt) {
  return (netInt | (~maskInt >>> 0)) >>> 0;
}

export function usableHostCount(prefix) {
  if (prefix >= 31) return 0;
  return Math.pow(2, 32 - prefix) - 2;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomPrefix(difficulty) {
  return difficulty === "schwer" ? randomInt(16, 30) : pick(LEICHT_PREFIXES);
}

function randomOctetValue(difficulty) {
  return difficulty === "schwer" ? randomInt(0, 255) : pick(LEICHT_OCTETS);
}

function randomHostIp(prefix) {
  const block = pick(PRIVATE_BLOCKS);
  const baseInt = ipToInt(block.base);
  const maxOffset = Math.pow(2, block.hostBits) - 1;
  const offset = randomInt(0, maxOffset);
  const ipInt = (baseInt + offset) >>> 0;
  // Sicherstellen, dass die generierte IP innerhalb des gewaehlten Praefix
  // sowohl von der Netzwerk- als auch der Broadcast-Adresse abweicht, damit
  // die Aufgabe nicht zufaellig trivial wird (IP == gesuchte Antwort).
  const maskInt = maskIntFromPrefix(prefix);
  const net = networkInt(ipInt, maskInt);
  const bcast = broadcastInt(net, maskInt);
  if (ipInt === net || ipInt === bcast) return randomHostIp(prefix);
  return ipInt;
}

function normalize(str) {
  return String(str).trim().toLowerCase().replace(/^klasse\s*/, "").replace(/\s+/g, "").replace(/–/g, "-");
}

export function checkAnswer(problem, userAnswer) {
  return normalize(userAnswer) === normalize(problem.correctAnswer);
}

export function explainProblem(problem) {
  return problem.explainSteps.join(" · ");
}

// --- Kategorie 1: Subnetting ------------------------------------------

const SUBNETTING_TYPES = ["netzwerkadresse", "broadcast", "hosts", "maske", "bereich"];

function generateSubnettingProblem(difficulty) {
  const prefix = randomPrefix(difficulty);
  const ipInt = randomHostIp(prefix);
  const maskInt = maskIntFromPrefix(prefix);
  const netInt = networkInt(ipInt, maskInt);
  const bcastInt = broadcastInt(netInt, maskInt);
  const type = pick(SUBNETTING_TYPES);

  const facts = {
    maske: `Subnetzmaske zu /${prefix}: ${intToIp(maskInt)}`,
    netzwerkadresse: `Netzwerkadresse (IP UND Maske): ${intToIp(netInt)}`,
    broadcast: `Broadcast-Adresse (Netzwerkadresse mit invertierter Maske ODER-verknüpft): ${intToIp(bcastInt)}`,
    hosts: `Nutzbare Hosts: 2^(32-${prefix}) - 2 = ${usableHostCount(prefix)}`,
  };

  const questionByType = {
    netzwerkadresse: "Berechne die Netzwerkadresse.",
    broadcast: "Berechne die Broadcast-Adresse.",
    hosts: "Wie viele nutzbare Host-Adressen gibt es in diesem Subnetz?",
    maske: "Wie lautet die Subnetzmaske in Dezimalschreibweise?",
    bereich: 'Nenne den gültigen Host-Adressbereich (erste – letzte nutzbare Adresse, Format "erste-letzte").',
  };

  const answerByType = {
    netzwerkadresse: intToIp(netInt),
    broadcast: intToIp(bcastInt),
    hosts: String(usableHostCount(prefix)),
    maske: intToIp(maskInt),
    bereich: `${intToIp(netInt + 1)}-${intToIp(bcastInt - 1)}`,
  };

  // Hinweise fuehren gezielt zur Antwort hin, ohne sie selbst zu verraten --
  // pro Fragetyp einzeln festgelegt statt mechanisch "alle Fakten außer
  // einem", weil z. B. Broadcast/Hosts bei der Frage nach der
  // Netzwerkadresse zu viel preisgeben wuerden.
  const hintsByType = {
    netzwerkadresse: [facts.maske],
    broadcast: [facts.maske, facts.netzwerkadresse],
    hosts: [facts.maske],
    maske: [`Freie Bits: 32 - ${prefix} = ${32 - prefix}`],
    bereich: [facts.maske, facts.netzwerkadresse, facts.broadcast],
  };

  return {
    category: "subnetting",
    type,
    ip: intToIp(ipInt),
    prefix,
    question: `Gegeben: ${intToIp(ipInt)}/${prefix}. ${questionByType[type]}`,
    correctAnswer: answerByType[type],
    hintSteps: hintsByType[type],
    explainSteps: [facts.maske, facts.netzwerkadresse, facts.broadcast, facts.hosts, `→ Antwort: ${answerByType[type]}`],
  };
}

// --- Kategorie 2: Zahlensysteme (an IP-Oktetten verankert) -------------

function decToBin8(n) {
  return n.toString(2).padStart(8, "0");
}
function decToHex2(n) {
  return n.toString(16).toUpperCase().padStart(2, "0");
}
function bitBreakdown(value) {
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  const bin = decToBin8(value);
  return weights.map((w, i) => `${w}×${bin[i]}`).join(" + ") + ` = ${value}`;
}

const ZAHLEN_TYPES = ["dez-bin", "bin-dez", "dez-hex", "hex-dez"];
const ORDINALS = ["ersten", "zweiten", "dritten", "vierten"];

function generateZahlenProblem(difficulty) {
  const type = pick(ZAHLEN_TYPES);
  const octetIndex = randomInt(0, 3);
  const value = randomOctetValue(difficulty);
  const sampleIp = [randomInt(1, 223), randomInt(0, 255), randomInt(0, 255), randomInt(0, 255)];
  sampleIp[octetIndex] = value;
  const ipStr = sampleIp.join(".");
  const ordinal = ORDINALS[octetIndex];

  if (type === "dez-bin") {
    const correctAnswer = decToBin8(value);
    return {
      category: "zahlensysteme", type,
      question: `Gegeben: ${ipStr}. Wandle das ${ordinal} Oktett (${value}) in eine 8-Bit-Binärzahl um.`,
      correctAnswer,
      hintSteps: ["Bit-Wertigkeiten von links nach rechts: 128, 64, 32, 16, 8, 4, 2, 1."],
      explainSteps: [`${value} in Bit-Wertigkeiten zerlegen: ${bitBreakdown(value)}`, `→ Antwort: ${correctAnswer}`],
    };
  }
  if (type === "bin-dez") {
    const binStr = decToBin8(value);
    const correctAnswer = String(value);
    return {
      category: "zahlensysteme", type,
      question: `Welche Dezimalzahl entspricht der Binärzahl ${binStr}?`,
      correctAnswer,
      hintSteps: ["Bit-Wertigkeiten von links nach rechts: 128, 64, 32, 16, 8, 4, 2, 1 — addiere die Wertigkeiten an den gesetzten (1-)Stellen."],
      explainSteps: [`Gesetzte Bits: ${bitBreakdown(value)}`, `→ Antwort: ${correctAnswer}`],
    };
  }
  if (type === "dez-hex") {
    const correctAnswer = decToHex2(value);
    return {
      category: "zahlensysteme", type,
      question: `Gegeben: ${ipStr}. Wandle das ${ordinal} Oktett (${value}) in eine Hexadezimalzahl um.`,
      correctAnswer,
      hintSteps: ["Teile die 8 Bit in zwei 4er-Gruppen (Nibbles) auf und wandle jede einzeln um."],
      explainSteps: [`${value} = ${Math.floor(value / 16)} × 16 + ${value % 16} → Hex-Ziffern ${Math.floor(value / 16).toString(16).toUpperCase()} und ${(value % 16).toString(16).toUpperCase()}`, `→ Antwort: ${correctAnswer}`],
    };
  }
  // hex-dez
  const hexStr = decToHex2(value);
  const correctAnswer = String(value);
  return {
    category: "zahlensysteme", type,
    question: `Welche Dezimalzahl entspricht der Hexadezimalzahl ${hexStr}?`,
    correctAnswer,
    hintSteps: ["Jede Hex-Ziffer steht für 4 Bit — erste Ziffer × 16 + zweite Ziffer."],
    explainSteps: [`${hexStr} = ${parseInt(hexStr[0], 16)} × 16 + ${parseInt(hexStr[1], 16)} = ${value}`, `→ Antwort: ${correctAnswer}`],
  };
}

// --- Kategorie 3: IP-Klassen --------------------------------------------

function generateKlasseProblem() {
  const cls = pick(["A", "B", "C"]);
  const first = cls === "A" ? randomInt(1, 126) : cls === "B" ? randomInt(128, 191) : randomInt(192, 223);
  const ip = [first, randomInt(0, 255), randomInt(0, 255), randomInt(0, 255)].join(".");
  return {
    category: "klassen",
    type: "klasse",
    question: `Zu welcher Adressklasse gehört ${ip}?`,
    correctAnswer: cls,
    hintSteps: [`Nur das erste Oktett (${first}) entscheidet über die Klasse.`],
    explainSteps: [
      "Klasse A: erstes Oktett 1–126 · Klasse B: 128–191 · Klasse C: 192–223",
      `Erstes Oktett hier: ${first} → Klasse ${cls}`,
    ],
  };
}

// --- Öffentliche API ------------------------------------------------------

export function generateProblem({ difficulty = "leicht", categories = ["subnetting"] } = {}) {
  const cats = categories && categories.length ? categories : ["subnetting"];
  const category = pick(cats);
  if (category === "zahlensysteme") return generateZahlenProblem(difficulty);
  if (category === "klassen") return generateKlasseProblem();
  return generateSubnettingProblem(difficulty);
}

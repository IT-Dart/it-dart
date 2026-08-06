// Reiner Aufgaben-Generator fuer den Rechentrainer (Subnetting/CIDR).
// Bewusst ohne jeden Import aus supabase/AuthContext/React -- diese Datei
// muss unveraendert wiederverwendbar bleiben, falls der Rechentrainer
// spaeter als eigenstaendige PWA/Play-Store-App verpackt wird (siehe Plan).

const PRIVATE_BLOCKS = [
  { base: [10, 0, 0, 0], hostBits: 24 },
  { base: [172, 16, 0, 0], hostBits: 20 },
  { base: [192, 168, 0, 0], hostBits: 16 },
];

const MIN_PREFIX = 16;
const MAX_PREFIX = 30;

function ipToInt([a, b, c, d]) {
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

function intToIp(int) {
  return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(".");
}

function maskIntFromPrefix(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

function parseIp(str) {
  const parts = String(str).trim().split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return parts;
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

function randomHostIp(prefix) {
  const block = PRIVATE_BLOCKS[randomInt(0, PRIVATE_BLOCKS.length - 1)];
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

const TYPES = ["netzwerkadresse", "broadcast", "hosts", "maske", "bereich"];

export function generateProblem() {
  const prefix = randomInt(MIN_PREFIX, MAX_PREFIX);
  const ipInt = randomHostIp(prefix);
  const maskInt = maskIntFromPrefix(prefix);
  const netInt = networkInt(ipInt, maskInt);
  const bcastInt = broadcastInt(netInt, maskInt);
  const type = TYPES[randomInt(0, TYPES.length - 1)];

  const questionByType = {
    netzwerkadresse: `Berechne die Netzwerkadresse.`,
    broadcast: `Berechne die Broadcast-Adresse.`,
    hosts: `Wie viele nutzbare Host-Adressen gibt es in diesem Subnetz?`,
    maske: `Wie lautet die Subnetzmaske in Dezimalschreibweise?`,
    bereich: `Nenne den gültigen Host-Adressbereich (erste – letzte nutzbare Adresse, Format "erste-letzte").`,
  };

  const answerByType = {
    netzwerkadresse: intToIp(netInt),
    broadcast: intToIp(bcastInt),
    hosts: String(usableHostCount(prefix)),
    maske: intToIp(maskInt),
    bereich: `${intToIp(netInt + 1)}-${intToIp(bcastInt - 1)}`,
  };

  return {
    type,
    ip: intToIp(ipInt),
    prefix,
    question: `Gegeben: ${intToIp(ipInt)}/${prefix}. ${questionByType[type]}`,
    correctAnswer: answerByType[type],
    // Werte fuer die Erklaerung mitgeben, damit explainProblem() nichts neu
    // berechnen/parsen muss und garantiert konsistent mit correctAnswer bleibt.
    _net: intToIp(netInt),
    _bcast: intToIp(bcastInt),
    _mask: intToIp(maskInt),
    _hosts: usableHostCount(prefix),
  };
}

function normalize(str) {
  return String(str).trim().replace(/\s+/g, "").replace(/–/g, "-");
}

export function checkAnswer(problem, userAnswer) {
  return normalize(userAnswer) === normalize(problem.correctAnswer);
}

export function explainProblem(problem) {
  const steps = [
    `Subnetzmaske zu /${problem.prefix}: ${problem._mask}`,
    `Netzwerkadresse (IP UND Maske): ${problem._net}`,
    `Broadcast-Adresse (Netzwerkadresse mit invertierter Maske ODER-verknüpft): ${problem._bcast}`,
    `Nutzbare Hosts: 2^(32-${problem.prefix}) - 2 = ${problem._hosts}`,
  ];
  return `${steps.join(" · ")} → Antwort: ${problem.correctAnswer}`;
}

export function parseIpForTests(str) {
  return parseIp(str);
}

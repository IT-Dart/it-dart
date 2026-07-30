// Premium-exklusiver "Tipp des Tages" für die Prüfungsvorbereitung — ergänzt
// die 3 statischen Intro-Tipps (Zeit einteilen, Ausschlussverfahren, Aufgabe
// komplett lesen) in Pruefung.jsx um tiefere, konkretere Prüfungstechniken.
// Rotation ist rein clientseitig nach Kalendertag (kein Cron, kein Backend) --
// alle Premium-Nutzer sehen am selben Tag denselben Tipp.
export const TAGESTIPPS = [
  { t: "Rechenaufgaben zuerst überschlagen", s: "Bei Subnetting-/Bandbreitenrechnungen erst grob abschätzen, welche Größenordnung das Ergebnis haben muss, bevor du rechnest — so erkennst du einen Rechenfehler sofort." },
  { t: "Fachbegriffe im Kopf übersetzen", s: "Bei englischen Begriffen (z. B. „Subnet Mask“, „Round Trip Time“) kurz die deutsche Bedeutung durchgehen — IHK-Prüfungen mischen beide Sprachen oft in derselben Frage." },
  { t: "Auf „nicht“ und „außer“ achten", s: "Verneinte Fragen sind die häufigste Fehlerquelle bei Multiple Choice — das Wort beim Lesen bewusst markieren." },
  { t: "Zeit-Soll regelmäßig checken", s: "Prüfungszeit vorab durch die Fragenanzahl teilen und alle 20 Minuten kontrollieren, ob du im Plan bist — nicht erst in der letzten halben Stunde in Panik geraten." },
  { t: "Portnummern als Merkblock lernen", s: "20/21 FTP, 22 SSH, 25 SMTP, 53 DNS, 80/443 HTTP/HTTPS, 3389 RDP — Klassiker in Multiple-Choice-Fragen." },
  { t: "Das OSI-Modell verstehen statt auswendig lernen", s: "Kenne die Aufgabe jeder Schicht. Wer den Zweck jeder Ebene versteht, kann auch unbekannte Protokolle meist richtig einordnen." },
  { t: "Szenario-Aufgaben erst skizzieren", s: "Bei Netzplan-/Situationsaufgaben die gegebenen Werte auf Konzeptpapier grob notieren, bevor du rechnest — verhindert übersehene Angaben." },
  { t: "Übersprungene Fragen explizit notieren", s: "Nummern aufschreiben, nicht nur im Kopf behalten — unter Zeitdruck vergisst man garantiert mindestens eine." },
  { t: "Bei fast identischen Antwortoptionen genau hinsehen", s: "Unterscheiden sich zwei Antworten nur in einem Wort, ist genau das der eigentlich abgefragte Punkt." },
  { t: "Erst selbst überlegen, dann die Antworten lesen", s: "Bevor du die Multiple-Choice-Optionen liest, überlege kurz selbst, wie die Antwort lauten könnte — das schützt davor, dich von plausibel klingenden Ablenkern verwirren zu lassen." },
  { t: "Fokus zurücksetzen, wenn du feststeckst", s: "Merkst du, dass du dieselbe Frage schon mehrfach liest, ohne weiterzukommen: 20–30 Sekunden Pause, Schultern lockern, tief durchatmen, dann die Frage von vorn lesen." },
  { t: "Nicht an einer Frage festbeißen", s: "Löst sich ein Problem nach angemessener Zeit nicht, markieren und weitermachen — mit frischem Blick später zurückzukommen ist oft effektiver als stures Weitergrübeln." },
  { t: "Vortag nur wiederholen, nicht neu lernen", s: "Der Abend vor der Prüfung ist zum Überfliegen da, nicht zum ersten Durcharbeiten eines Themas — das erhöht nur Unsicherheit." },
  { t: "Schlaf vor Prüfungstagen priorisieren", s: "Eine durchgemachte Nacht bringt selten mehr Wissen, aber sicher schlechtere Konzentration am nächsten Tag." },
  { t: "Antworten nicht unnötig leer lassen", s: "Zieht deine Prüfung keine Punkte für falsche Antworten ab, ist eine begründete Schätzung meist besser als eine unbeantwortete Frage." },
  { t: "Begriffe in eigenen Worten erklären können", s: "Wenn du „DHCP“ oder „VPN“ nicht in zwei eigenen Sätzen erklären kannst, hast du es nur auswendig gelernt, nicht verstanden." },
  { t: "Aktiv abfragen statt nur lesen", s: "Nochmaliges Durchlesen fühlt sich produktiv an, bringt aber deutlich weniger als aktives Abfragen (z. B. hier im Prüfungsvorbereitung-Modus)." },
  { t: "Mindestens eine volle Simulation unter echtem Zeitdruck", s: "Trainiert nicht nur Wissen, sondern auch das Durchhalten über die volle Prüfungsdauer." },
  { t: "Bei Praxisaufgaben Rahmenbedingungen markieren", s: "IP-Adressbereich, Budget, Geräteanzahl, vorhandene Hardware — häufigster Fehler ist, eine dieser Angaben zu übersehen." },
  { t: "Direkt nach der Prüfung nicht mit anderen vergleichen", s: "Sofortiger Antwortenvergleich erzeugt oft unnötige Panik über vermeintliche Fehler, die es gar nicht gibt." },
  { t: "Fehler aus alten Übungsläufen gezielt nachbereiten", s: "Nicht nur die Prozentzahl anschauen, sondern jede falsch beantwortete Frage einzeln durchgehen, bis der Fehler wirklich verstanden ist." },
  { t: "Nicht in Panik geraten, wenn etwas Unerwartetes passiert", s: "Ein paar Minuten Verspätung, eine vergessene Kleinigkeit oder Nervosität bedeuten nicht automatisch, dass du durchfällst. Ruhig bleiben, auf die Aufsicht hören, eine Aufgabe nach der anderen lösen und dich auf das konzentrieren, was du noch beantworten kannst." },
  { t: "Nur auf die aktuelle Frage konzentrieren", s: "Sorge dich während der Prüfung nicht um dein Gesamtergebnis, sondern nur um die Frage, die gerade vor dir liegt." },
  { t: "Sicherheit kommt aus Struktur, nicht aus Allwissen", s: "Ein methodisches Vorgehen bringt dich weiter als der Anspruch, jede Antwort sofort zu kennen." },
];

// Tag des Jahres (1-366) modulo Pool-Größe -- deterministisch, kein
// Zufalls-Seed nötig, alle Premium-Nutzer sehen am selben Kalendertag
// denselben Tipp.
export function tagestippFuerHeute() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return TAGESTIPPS[dayOfYear % TAGESTIPPS.length];
}

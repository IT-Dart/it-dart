import { useState, useEffect, useRef } from "react";
import { C, pri, ghost, wrap, inner, ff, fm } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { generateLernnachweis } from "./lib/lernnachweis";
import AuthScreen from "./AuthScreen";
import AdminScreen from "./AdminScreen";
import DeleteAccountScreen from "./DeleteAccountScreen";
import StatistikScreen from "./StatistikScreen";
import TrainerScreen from "./TrainerScreen";
import coverImg from "./assets/cover.jpg";
import moduleGImg from "./assets/module-g.jpg";
import moduleBImg from "./assets/module-b.jpg";
import moduleSiImg from "./assets/module-si.jpg";
import moduleDbImg from "./assets/module-db.jpg";
import moduleSkImg from "./assets/module-sk.jpg";
import modulePrImg from "./assets/module-pr.jpg";

const MODULE_IMAGES={g:moduleGImg,b:moduleBImg,si:moduleSiImg,db:moduleDbImg,sk:moduleSkImg,pr:modulePrImg};
const MODULE_IMAGE_ALT={g:"PC Komponenten",b:"Betriebssysteme",si:"IT-Sicherheit",db:"Datenbanken",sk:"Skripting",pr:"Beruf und Projekt"};

const FREE_MODULE_IDS=["g","o"]; // Grundlagen frei zugänglich, Netzwerktechnik als Vorschau — Rest ist Premium
const FREE_TOPIC_LIMITS={o:2}; // Netzwerktechnik: nur die ersten 2 von 7 Themen sind ohne Premium sichtbar
const FREE_QUIZ_N=5; // Modul-Quiz am Ende: Free-Nutzer sehen nur die ersten 5 Fragen

const MODS=[
  {id:"g",e:"⚙️",t:"Grundlagen IT &amp; Hardware",s:"Komponenten, Bits/Bytes, Zahlensysteme, Speicher, Bootvorgang",r:true,n:6},
  {id:"o",e:"🌐",t:"Netzwerktechnik",s:"OSI-Modell, IP/Subnetting, Switch/Router, DHCP/DNS, WLAN, VPN",r:true,n:7},
  {id:"b",e:"🖥️",t:"Betriebssysteme &amp; Server",s:"Windows/Linux, Active Directory, Virtualisierung, RAID, Backup",r:true,n:6},
  {id:"si",e:"🛡️",t:"IT-Sicherheit",s:"Schutzziele, Risiken, Angriffe, Verschlüsselung, Firewalls, DSGVO, Physische Sicherheit",r:true,n:7},
  {id:"db",e:"🗃️",t:"Datenbanken &amp; Daten",s:"SQL, Datenbankdesign, APIs, JSON/XML, Daten systemübergreifend",r:true,n:6},
  {id:"sk",e:"💻",t:"Skripting &amp; Automatisierung",s:"PowerShell, Bash, Skripte schreiben, Aufgaben automatisieren",r:true,n:6},
  {id:"pr",e:"👥",t:"Beruf &amp; Projekt",s:"Unternehmensstrukturen, Kundenkommunikation, SLA, Projektmanagement",r:true,n:6},
];

const G=[
  {n:1,nm:"Was ist ein Computer?",th:"Ein Computer besteht aus wenigen Kernkomponenten: Die CPU denkt und rechnet, der RAM hält Daten kurzfristig bereit, die Festplatte speichert dauerhaft, und das Mainboard verbindet alles.",pc:"Der neue PC wird ausgepackt. Der Techniker prüft: Sitzt die CPU im Sockel? Sind die RAM-Riegel eingerastet? Sind alle Kabel gesteckt?",q1:"Was ist der Unterschied zwischen CPU und RAM?",q2:"Warum reicht RAM allein nicht zum Speichern?"},
  {n:2,nm:"Bits &amp; Bytes",th:"Die kleinste Informationseinheit ist ein Bit – nur 0 oder 1. Acht Bits ergeben ein Byte. Darüber wird es präzise: Im Binärsystem ist jede Stufe genau 1024× größer – 1 KiB = 1024 Byte, 1 MiB = 1024 KiB, 1 GiB = 1024 MiB. Festplattenhersteller rechnen dagegen dezimal mit 1000 (1 GB = 1000 MB). Genau deshalb zeigt Windows bei einer gekauften 512-GB-SSD nur ~477 an – beide Angaben stimmen, sie nutzen nur verschiedene Systeme.",pc:"Der Kunde wundert sich: Die gekaufte 512-GB-SSD zeigt in Windows nur ~477 an. Der Techniker erklärt: Der Hersteller rechnet mit 1000 (dezimal), Windows mit 1024 (binär) – es fehlt nichts.",q1:"Wie viele Bits hat ein Byte?",q2:"Was ist der Unterschied zwischen GB und GiB?"},
  {n:3,nm:"Zahlensysteme",th:"Computer rechnen im Binärsystem (0 und 1), weil Schaltkreise nur zwei Zustände kennen. Hexadezimal (0-9, A-F) ist eine Kurzschreibweise – 4 Bits ergeben eine Hex-Stelle. MAC-Adressen und IP-Adressen nutzen Hex.",pc:"Beim Einrichten sieht der Techniker die MAC-Adresse 2C:54:91:88:C9:E3 – Hexadezimal. Die IP 192.168.1.100 ist intern eine Folge von 32 Nullen und Einsen.",q1:"Warum nutzt man Hexadezimal statt Dezimal?",q2:"Was hat Binär mit IP-Adressen zu tun?"},
  {n:4,nm:"Datenspeicherung",th:"HDDs speichern auf magnetischen Scheiben – günstig, aber langsam. SSDs nutzen Flash-Speicher – schneller, leiser, robuster. RAM ist flüchtig: bei Stromausfall weg.",pc:"Der Techniker wählt SSD für das Betriebssystem und erklärt: Alles auf der SSD bleibt – aber ungespeichertes im RAM ist bei Stromausfall weg.",q1:"Warum bootet ein PC mit SSD schneller?",q2:"Was passiert mit RAM-Inhalt beim Neustart?"},
  {n:5,nm:"Bootvorgang",th:"Beim Einschalten startet das BIOS/UEFI – es prüft die Hardware (POST) und lädt dann das Betriebssystem. Erst dann übernimmt Windows oder Linux.",pc:"Der Techniker drückt F2, kommt ins BIOS und stellt die SSD als Bootlaufwerk ein. Dann lädt Windows.",q1:"Was ist der POST und warum ist er wichtig?",q2:"Was passiert wenn kein Bootlaufwerk gefunden wird?"},
  {n:6,nm:"Peripherie &amp; Schnittstellen",th:"Peripheriegeräte werden über Schnittstellen wie USB, HDMI oder RJ45 (LAN) angeschlossen. Über die RJ45-Buchse kommt der PC per Netzwerkkabel ins lokale Netz. Das Betriebssystem braucht einen Treiber – ein Übersetzer-Programm – um das Gerät zu verstehen.",pc:"Der Techniker richtet den Arbeitsplatz ein: Monitor über HDMI, Tastatur und Maus über USB. Der neue Netzwerkdrucker hängt bereits im LAN — der Techniker bindet ihn über seine IP-Adresse ein, Windows lädt den Treiber, und die Testseite kommt raus.",q1:"Was passiert ohne Treiber?",q2:"Was ist der Unterschied zwischen USB 3.0 und USB-C?"},
];
const GQ=[
  {q:"Was ist die Hauptaufgabe der CPU?",o:["Daten speichern","Berechnungen durchführen","Bildschirm ansteuern","Treiber verwalten"],c:1,e:"Die CPU führt alle Berechnungen durch. Dauerhaftes Speichern übernimmt die Festplatte."},
  {q:"Wie viele Bits hat ein Byte?",o:["4","2","16","8"],c:3,e:"Ein Byte besteht aus genau 8 Bits. Alles darüber (KB, MB, GB) sind Vielfache."},
  {q:"Warum rechnen Computer im Binärsystem?",o:["Weil es einfacher zu lernen und zu verstehen ist","Weil Berechnungen im Dezimalsystem zu langsam wären","Schaltkreise kennen nur zwei Zustände","Weil das Hexadezimalsystem zu komplex dafür wäre"],c:2,e:"Transistoren kennen nur Strom-fließt (1) oder nicht (0). Binär ist die natürliche Sprache der Hardware."},
  {q:"Vorteil einer SSD gegenüber HDD?",o:["Günstiger pro GB","Mehr Speicherplatz","Kann als RAM genutzt werden","Schneller, leiser und robuster"],c:3,e:"SSDs haben keine beweglichen Teile – deutlich schneller, weniger Stromverbrauch, stoßunempfindlich."},
  {q:"Was startet zuerst beim Einschalten?",o:["Betriebssystem","Bootloader","BIOS/UEFI","Gerätetreiber"],c:2,e:"Das BIOS/UEFI ist auf dem Mainboard gespeichert und startet sofort. Es prüft die Hardware und lädt dann den Bootloader."},
  {q:"Welche Aufgabe hat das Netzteil im PC?",o:["Daten dauerhaft auf einem Datenträger speichern","230-V-Wechselstrom in Gleichspannungen für die Komponenten wandeln","Die CPU aktiv mit einem Lüfter oder Kühlkörper kühlen","Beim Start das Betriebssystem von der Festplatte laden"],c:1,e:"Das Netzteil wandelt die Netzspannung in die Gleichspannungen (z.B. 12 V, 5 V, 3,3 V) um, mit denen Mainboard, CPU und Laufwerke arbeiten."},
  {q:"Was passiert mit den Daten im RAM beim Ausschalten?",o:["Sie bleiben erhalten","Sie werden automatisch auf die SSD kopiert","Sie gehen verloren – RAM ist flüchtig","Sie werden komprimiert"],c:2,e:"RAM ist flüchtiger Speicher: Ohne Strom sind die Daten weg. Deshalb braucht der PC SSD oder HDD als dauerhaften Speicher."},
  {q:"Die Hex-Zahl 2A entspricht dezimal…?",o:["22","42","52","64"],c:1,e:"2A hex = 2×16 + 10 = 42. Hexadezimal ist die Kurzschreibweise für Binärwerte – eine Hex-Stelle entspricht genau 4 Bits."},
  {q:"Wie viele MiB hat 1 GiB?",o:["1000","1024","512","2048"],c:1,e:"Im Binärsystem ist jede Stufe 1024× größer: 1 GiB = 1024 MiB. Hersteller rechnen dagegen dezimal (1 GB = 1000 MB)."},
  {q:"Welcher Anschluss überträgt Bild und Ton gemeinsam?",o:["VGA","USB-A","HDMI","RJ45"],c:2,e:"HDMI überträgt Video und Audio digital über ein einziges Kabel. VGA ist analog und überträgt nur Bild."},
];

const O=[
  {n:1,nm:"Bitübertragungsschicht",sh:"Physical",th:"Rohe Signale: Kabel, Stecker, Spannungspegel, Funkwellen. Keine Adressen – nur ob überhaupt ein Signal ankommt. Übertragungsmedien sind Kupfer, Glasfaser, WLAN und Richtfunk – und zunehmend Satelliteninternet über LEO-Satelliten: wichtig überall dort, wo kein Glasfaser- oder Mobilfunkausbau existiert.",pc:"Link-LED leuchtet nicht → Problem hier. Kabel, Stecker und Switch-Port prüfen.",q1:"Warum zuerst Kabel statt gleich IP?",q2:"Was unterscheidet Kabel von WLAN hier?"},
  {n:2,nm:"Sicherungsschicht",sh:"Data Link",th:"Kommunikation im lokalen Netz über MAC-Adressen. Switches lernen, welches Gerät an welchem Port hängt.",pc:"LED leuchtet, aber keine Verbindung → MAC-Tabelle des Switches prüfen, VLAN-Konfiguration checken.",q1:"Was ist ein VLAN?",q2:"Wie liest man eine MAC-Tabelle?"},
  {n:3,nm:"Vermittlungsschicht",sh:"Network",th:"IP-Adressen und Routing. Pakete werden über Netzgrenzen zum richtigen Ziel geleitet.",pc:"Lokales Netz geht, kein Internet → Gateway per Ping prüfen, Subnetzmaske und IP-Konfiguration kontrollieren.",q1:"Was macht ein Gateway?",q2:"Wie hängen Subnetzmaske und IP zusammen?"},
  {n:4,nm:"Transportschicht",sh:"Transport",th:"TCP und UDP übertragen Daten zwischen Endpunkten über Ports für einzelne Anwendungen.",pc:"Ping geht, Anwendung nicht → Port durch Firewall blockiert? TCP oder UDP?",q1:"Warum kann Ping gehen aber die Anwendung nicht?",q2:"Was ist der Unterschied zwischen TCP und UDP?"},
  {n:5,nm:"Sitzungsschicht",sh:"Session",th:"Hält eine Verbindung über mehrere Anfragen aufrecht – verwaltet Beginn, Dauer und Ende.",pc:"Verbindung bricht nach kurzer Zeit ab → Sitzungs-Timeout prüfen.",q1:"Was ist eine Sitzung technisch?",q2:"Wie unterscheidet sich das von einem Transport-Problem?"},
  {n:6,nm:"Darstellungsschicht",sh:"Presentation",th:"Daten in gemeinsames Format bringen – Verschlüsselung (TLS) oder Zeichenkodierung – damit Sender und Empfänger sich verstehen.",pc:"Browser zeigt Zertifikatsfehler → TLS-Zertifikat abgelaufen? Falscher Hostname?",q1:"Was passiert beim TLS-Handshake?",q2:"Warum zeigt Browser bei abgelaufenem Zertifikat Fehler?"},
  {n:7,nm:"Anwendungsschicht",sh:"Application",th:"Die Ebene die der Nutzer sieht: Browser, E-Mail, ERP. Protokolle: HTTP, SMTP, DNS.",pc:"Alles darunter geht, aber die App wirft Fehler → Anwendungs-Logs prüfen, nicht das Netz.",q1:"Woran erkennt man dass das Problem hier liegt?",q2:"Welche Protokolle laufen hier?"},
];
const OQ=[
  {q:"Keine Link-LED am Switch-Port. Welche Schicht?",o:["Schicht 3 – Network","Schicht 2 – Data Link","Schicht 7 – Application","Schicht 1 – Physical"],c:3,e:"Die Link-LED zeigt physisches Signal – Schicht 1. Kabel, Stecker, Port prüfen."},
  {q:"Wofür sind MAC-Adressen zuständig?",o:["Das Routing von Paketen zwischen IP-Netzen","Die Verschlüsselung von Daten auf der Leitung","Kommunikation im lokalen Netz","Die Verwaltung von Sitzungen zwischen Anwendungen"],c:2,e:"MAC-Adressen arbeiten auf Schicht 2 und identifizieren Geräte im lokalen Netz."},
  {q:"Ping geht, Anwendung nicht. Was prüfen?",o:["Schicht 1 – Kabel","Schicht 2 – MAC","Schicht 6 – Zertifikate","Schicht 4 – Ports"],c:3,e:"Ping nutzt ICMP ohne Ports. Anwendungen brauchen TCP/UDP-Ports auf Schicht 4."},
  {q:"Browser zeigt TLS-Fehler. Welche Schicht?",o:["Schicht 1 – Physical","Schicht 2 – Data Link","Schicht 3 – Network","Schicht 6 – Presentation"],c:3,e:"TLS gehört zu Schicht 6 (Presentation) – Verschlüsselung und gemeinsames Datenformat."},
  {q:"App wirft Fehler, Netz funktioniert. Welche Schicht?",o:["Schicht 4 – Transport","Schicht 5 – Session","Schicht 3 – Network","Schicht 7 – Application"],c:3,e:"Wenn das Netz geht aber die App Fehler meldet, ist Schicht 7 betroffen."},
  {q:"Auf welcher OSI-Schicht arbeitet ein Switch?",o:["Schicht 1 – Physical","Schicht 2 – Data Link","Schicht 3 – Network","Schicht 4 – Transport"],c:1,e:"Ein Switch entscheidet anhand von MAC-Adressen, an welchen Port ein Frame geht – das ist Schicht 2 (Sicherungsschicht)."},
  {q:"Auf welcher OSI-Schicht arbeitet ein Router?",o:["Schicht 2 – Data Link","Schicht 3 – Network","Schicht 5 – Session","Schicht 7 – Application"],c:1,e:"Router vermitteln anhand von IP-Adressen zwischen Netzen – Schicht 3 (Vermittlungsschicht)."},
  {q:"Welcher Standardport gehört zu HTTPS?",o:["25","80","443","3389"],c:2,e:"HTTPS nutzt Port 443. Port 80 ist HTTP, 25 SMTP und 3389 RDP."},
  {q:"Was macht DHCP?",o:["Übersetzt Domainnamen in die passenden IP-Adressen","Verteilt automatisch IP-Konfigurationen an Geräte","Verschlüsselt den gesamten Datenverkehr im Netzwerk","Blockiert gezielt unerlaubte Datenpakete an der Firewall"],c:1,e:"DHCP vergibt IP-Adresse, Subnetzmaske, Gateway und DNS-Server automatisch – ohne manuelles Eintragen an jedem Gerät."},
  {q:"Wofür ist DNS zuständig?",o:["IP-Adressen dynamisch vergeben","Domainnamen in IP-Adressen auflösen","Pakete zwischen Netzen routen","MAC-Adressen lernen"],c:1,e:"DNS ist das Telefonbuch des Internets: Aus einem Namen wie firma.de wird die zugehörige IP-Adresse."},
];

const B=[
  {n:1,nm:"Was ist ein Betriebssystem?",osi:"Schicht 7: Das OS stellt die Umgebung bereit in der Anwendungen laufen.",th:"Ein Betriebssystem ist die Softwareschicht zwischen Hardware und Anwendungen. Es verwaltet CPU, RAM und Geräte und gibt Programmen eine einheitliche Schnittstelle.",pc:"Der Techniker startet den frisch installierten Server. Windows Server übernimmt sofort die Kontrolle über alle Komponenten.",q1:"Was würde ohne Betriebssystem passieren?",q2:"Unterschied Server-OS vs Desktop-OS?"},
  {n:2,nm:"Windows vs. Linux",osi:"Windows dominiert bei Schicht-7-Diensten wie Active Directory, Linux bei Netzwerkdiensten.",th:"Windows ist weit verbreitet, hat eine GUI und wird im Unternehmensumfeld mit Microsoft-Produkten eingesetzt. Linux ist kostenlos, quelloffen und dominiert bei Servern und Cloud.",pc:"Der Techniker richtet Windows Server ein – der Webserver daneben läuft auf Ubuntu Linux. Für Active Directory braucht er Windows, für den Webserver ist Linux stabiler.",q1:"Warum laufen die meisten Webserver auf Linux?",q2:"Was bedeutet Open Source in der Praxis?"},
  {n:3,nm:"Dateisystem &amp; Ordnerstruktur",osi:"Netzwerkfreigaben (SMB) übertragen Dateisystem-Strukturen über Schicht 7.",th:"Windows nutzt NTFS (mit Berechtigungen und Journaling), Linux nutzt ext4. Beide haben eine Baumstruktur: Windows startet bei C:\\, Linux bei /.",pc:"Der Techniker legt C:\\Daten\\Buchhaltung an und setzt NTFS-Berechtigungen, damit nur die Buchhaltung den Ordner sieht.",q1:"Unterschied absoluter vs relativer Pfad?",q2:"Warum ist NTFS besser als FAT32?"},
  {n:4,nm:"Prozesse &amp; Dienste",osi:"Netzwerkdienste (Webserver Port 80/443) arbeiten auf Schicht 4 (Port) und Schicht 7 (Protokoll).",th:"Ein Prozess ist ein laufendes Programm mit eigenem Speicher. Dienste laufen im Hintergrund ohne Benutzeroberfläche. Der Task-Manager zeigt alle Prozesse mit CPU- und RAM-Verbrauch.",pc:"Der Techniker sieht im Task-Manager: Windows Update frisst 80% CPU. Er stoppt den Dienst temporär. Auf Linux: systemctl stop apt-daily.",q1:"Warum friert der PC nicht ein wenn ein Prozess abstürzt?",q2:"Unterschied Prozess vs Dienst?"},
  {n:5,nm:"Benutzerverwaltung",osi:"Authentifizierung läuft über Schicht 7 (LDAP für Active Directory, Kerberos für Tickets).",th:"Jeder Benutzer hat ein Konto mit Profil und Berechtigungen. Benutzer werden in Gruppen zusammengefasst – die Gruppe bekommt Rechte, nicht jeder Einzelne.",pc:"Der Techniker legt die Gruppe Buchhaltung an, gibt ihr Zugriff auf den Buchhaltungsordner und fügt drei Mitarbeiter hinzu. Abteilungswechsel = nur Gruppe ändern.",q1:"Warum Rechte an Gruppen statt Einzelpersonen?",q2:"Unterschied lokaler vs Domänenadministrator?"},
  {n:6,nm:"Kommandozeile",osi:"PowerShell kann direkt mit OSI-Schichten interagieren: Ping (Schicht 3), Portscans (Schicht 4), HTTP (Schicht 7).",th:"Die Kommandozeile erlaubt Befehle ohne GUI. PowerShell gibt Objekte statt nur Text zurück und erlaubt Automatisierung über viele Server gleichzeitig.",pc:"Der Techniker muss auf 50 Servern einen Dienst neustarten. Per Klick: Stunden. Mit PowerShell-Skript: zwei Minuten.",q1:"Warum ist PowerShell mächtiger als cmd?",q2:"Was heißt Objekte statt Text zurückgeben?"},
];
const BQ=[
  {q:"Hauptaufgabe eines Betriebssystems?",o:["Dokumente und Textdateien für den Nutzer erstellen","Schnittstelle zwischen Hardware und Anwendungen","Ausschließlich den angeschlossenen Bildschirm ansteuern","Ausschließlich die physischen Netzwerkkabel verwalten"],c:1,e:"Das OS verwaltet alle Hardware-Ressourcen und stellt Anwendungen eine einheitliche Schnittstelle zur Verfügung."},
  {q:"Dateisystem von Windows?",o:["ext4","FAT16","exFAT","NTFS"],c:3,e:"NTFS unterstützt Berechtigungen, Verschlüsselung, große Dateien und Journaling."},
  {q:"Was ist ein Dienst (Service)?",o:["Kostenpflichtiges Zusatzprogramm","Prozess mit GUI","Hintergrundprozess ohne GUI","Netzlaufwerk"],c:2,e:"Dienste laufen im Hintergrund ohne Oberfläche – z.B. Windows Update. Sie starten meist automatisch."},
  {q:"Warum Rechte an Gruppen statt Einzelpersonen?",o:["Windows kennt keine Einzelrechte","Einfacher zu verwalten und sicherer","Gruppen haben mehr Speicher","Einzelbenutzer können keine Rechte haben"],c:1,e:"Statt jedem einzeln Rechte zu geben, pflegt man die Gruppe. Abteilungswechsel = nur Gruppe ändern."},
  {q:"Hauptvorteil von PowerShell gegenüber cmd?",o:["Verfügt im Gegensatz zu cmd über eine grafische Oberfläche","Gibt Objekte zurück und ist skriptfähig","Lässt sich grundsätzlich schneller tippen als cmd","Funktioniert grundsätzlich auch komplett ohne Windows"],c:1,e:"PowerShell gibt strukturierte Objekte zurück die man weiterverarbeiten kann. Befehle laufen auf vielen Servern gleichzeitig."},
  {q:"Welcher Linux-Befehl zeigt den Inhalt eines Verzeichnisses?",o:["cd","ls","pwd","cat"],c:1,e:"ls listet Dateien und Ordner auf. cd wechselt das Verzeichnis, pwd zeigt den aktuellen Pfad, cat gibt Dateiinhalte aus."},
  {q:"Was zeigt der Befehl ipconfig unter Windows?",o:["Alle aktuell laufenden Prozesse auf dem System","Die IP-Konfiguration der Netzwerkadapter","Alle auf dem System installierten Programme","Alle aktuell geöffneten Netzwerkports"],c:1,e:"ipconfig zeigt IP-Adresse, Subnetzmaske und Gateway – oft der erste Schritt bei Netzwerkproblemen."},
  {q:"Was unterscheidet einen Dienst von einem normalen Programm?",o:["Es gibt zwischen beiden technisch keinen Unterschied","Er läuft im Hintergrund, auch ohne angemeldeten Benutzer","Ein Dienst läuft grundsätzlich ausschließlich unter Linux","Ein Dienst benötigt zwingend immer ein sichtbares Fenster"],c:1,e:"Ein Dienst (Service) startet meist mit dem System und läuft ohne Benutzeranmeldung – z.B. der Druckspooler."},
  {q:"Welchen Vorteil bietet NTFS gegenüber FAT32?",o:["Ist grundsätzlich nur für kleine USB-Sticks geeignet","Zugriffsrechte, große Dateien und höhere Ausfallsicherheit","Sorgt grundsätzlich für ein spürbar schnelleres Internet","Sorgt grundsätzlich für eine bessere Grafikleistung"],c:1,e:"NTFS unterstützt Berechtigungen, Dateien über 4 GB und ist robuster gegen Abstürze – Standard für Windows-Systeme."},
  {q:"Welche Aufgabe hat der Task-Manager?",o:["Dateien und Ordner zwischen Verzeichnissen kopieren","Prozesse und Auslastung anzeigen und beenden","Neue Gerätetreiber auf dem System installieren","Neue Netzwerkverbindungen komplett einrichten"],c:1,e:"Der Task-Manager zeigt laufende Prozesse sowie CPU- und RAM-Auslastung und kann hängende Programme beenden."},
];

const SI=[
  {n:1,nm:"Die drei Schutzziele",osi:"Schicht 6 sichert Vertraulichkeit (TLS). Schicht 4 sichert Verfügbarkeit. Alle Schichten tragen zur Integrität bei.",th:"Informationssicherheit basiert auf drei Grundpfeilern: Vertraulichkeit (nur Berechtigte sehen Daten), Integrität (Daten sind unverändert) und Verfügbarkeit (Systeme sind erreichbar). International als CIA bekannt.",pc:"Der Mitarbeiter klickt auf einen Phishing-Link. Alle drei Schutzziele sind bedroht: Vertraulichkeit (Passwörter), Integrität (Malware) und Verfügbarkeit (Ransomware).",q1:"Was passiert wenn nur eines der drei Ziele verletzt wird?",q2:"Warum reicht nur Vertraulichkeit nicht?"},
  {n:2,nm:"Risiken erkennen und bewerten",osi:"Je höher die OSI-Schicht, desto komplexer die möglichen Angriffsvektoren.",th:"Eine Schutzbedarfsanalyse bewertet: Was muss ich schützen? Wie wahrscheinlich ist ein Angriff? Wie groß wäre der Schaden? Der BSI-Grundschutz liefert standardisierte Methoden und Maßnahmenkataloge.",pc:"Nach dem Vorfall: Welche Daten waren auf dem Rechner? Kundendaten haben hohen Schutzbedarf, interne Memos niedrigen. Daraus ergeben sich unterschiedliche Schutzmaßnahmen.",q1:"Warum nicht einfach alles maximal absichern?",q2:"Unterschied Bedrohung vs Risiko?"},
  {n:3,nm:"Wie Angriffe funktionieren",osi:"Angriffe auf alle Schichten: Schicht 1 (Kabelabhören), Schicht 3 (IP-Spoofing), Schicht 7 (Phishing). Die meisten nutzen den Menschen.",th:"Die meisten Angriffe nutzen menschliche statt technische Schwachstellen. Social Engineering manipuliert Menschen. Phishing sind gefälschte E-Mails oder Webseiten. Viren hängen sich an Dateien und verbreiten sich beim Ausführen. Würmer verbreiten sich selbstständig über Netzwerke, ganz ohne Nutzeraktion. Trojaner tarnen sich als nützliches Programm und öffnen im Hintergrund eine Hintertür. Ransomware verschlüsselt Daten und fordert Lösegeld.",pc:"Die Phishing-Mail sah aus wie eine echte IT-Mail und bat um Passwort-Bestätigung. Der Mitarbeiter hat nicht auf den Absender geachtet – kein technischer Angriff nötig.",q1:"Warum sind Menschen das schwächste Glied?",q2:"Wie erkenne ich eine Phishing-Mail?"},
  {n:4,nm:"Verschlüsselung &amp; Zertifikate",osi:"Verschlüsselung auf Schicht 6 (TLS). Zertifikate beweisen Identität auf Schicht 7.",th:"Symmetrische Verschlüsselung nutzt einen Schlüssel für beide Seiten (schnell). Asymmetrische nutzt ein Schlüsselpaar: öffentlich zum Verschlüsseln, privat zum Entschlüsseln. TLS sichert Web-Verbindungen.",pc:"Nach dem Vorfall: Waren Passwörter im Klartext gespeichert? Hatte die Phishing-Seite ein HTTPS-Zertifikat? HTTPS allein ist kein Sicherheitsbeweis.",q1:"Unterschied verschlüsseln vs hashen?",q2:"Warum reicht HTTPS allein nicht?"},
  {n:5,nm:"Firewalls, VPN &amp; Netzwerksicherheit",osi:"Firewalls auf Schicht 3/4 (Paketfilter nach IP/Port) oder Schicht 7 (Deep Packet Inspection). VPN tunnelt über alle Schichten.",th:"Eine Firewall blockiert unerlaubten Netzwerkverkehr nach definierten Regeln. Eine DMZ trennt öffentlich erreichbare Server vom internen Netz. VPN verschlüsselt Verbindungen für sicheren Fernzugriff.",pc:"Der Angreifer versucht vom infizierten Rechner ins interne Netz. Die Firewall blockiert unbekannte Verbindungen. Das Monitoring zeigt auffällige Pakete – die IT isoliert den Rechner.",q1:"Unterschied Firewall vs Virenscanner?",q2:"Warum VPN wenn HTTPS schon verschlüsselt?"},
  {n:6,nm:"Datenschutz &amp; Recht im Betrieb",osi:"Technische Schutzmaßnahmen auf allen OSI-Schichten sind Voraussetzung für DSGVO-Konformität.",th:"Die DSGVO regelt den Umgang mit personenbezogenen Daten in der EU. Datenpannen müssen innerhalb von 72 Stunden gemeldet werden. Lizenzrecht regelt wie Software genutzt werden darf.",pc:"Der Vorfall wird zur Datenpanne: Kundendaten könnten gestohlen sein. DSGVO: innerhalb 72h melden. Die IT prüft außerdem: Sind alle Tools korrekt lizenziert?",q1:"Was tun bei einem Datenschutzverstoß?",q2:"Unterschied Open-Source vs proprietäre Lizenz?"},
  {n:7,nm:"Physische Sicherheit &amp; sicheres Verhalten",osi:"Physische Sicherheit ist die Grundlage aller OSI-Schichten. Ein gestohlenes Gerät kompromittiert alle Schichten gleichzeitig.",
   th:"Technische Sicherheit nützt nichts wenn physische Maßnahmen fehlen. Clean Desk Policy: keine sensiblen Daten offen liegen lassen. Bildschirm sperren beim Verlassen (Windows+L). Passwörter niemals weitergeben — auch nicht an Kollegen. Tailgating: jemand schleust sich hinter einem Berechtigten durch eine Sicherheitsschleuse. Shoulder Surfing: jemand schaut beim Passwort eingeben über die Schulter. Fremde USB-Sticks niemals einstecken — sie könnten Malware enthalten.",
   pc:"Der Techniker verlässt seinen Arbeitsplatz ohne Bildschirmsperre. Ein Besucher fotografiert vertrauliche Dokumente die offen auf dem Schreibtisch liegen. Gleichzeitig hält jemand die Sicherheitstür auf und lässt eine unbekannte Person ins Rechenzentrum — klassisches Tailgating.",
   q1:"Was ist Tailgating und wie verhindert man es?",q2:"Warum darf man Passwörter nicht an Kollegen weitergeben?"},
];
const SIQ=[
  {q:"Was bedeutet Integrität als Schutzziel?",o:["Nur Berechtigte sehen Daten","Systeme sind erreichbar","Daten sind unverändert und korrekt","Passwörter sind verschlüsselt"],c:2,e:"Integrität bedeutet Daten sind vollständig und unverändert. Manipulation verletzt die Integrität."},
  {q:"Was ist Social Engineering?",o:["Ein gezielter Angriff auf die Netzwerkinfrastruktur","Manipulation von Menschen statt Systemen","Eine bestimmte Methode zur Verschlüsselung von Daten","Das gezielte Umgehen einer eingerichteten Firewall"],c:1,e:"Social Engineering nutzt menschliche Schwächen statt technischer Lücken."},
  {q:"Was unterscheidet asymmetrische von symmetrischer Verschlüsselung?",o:["Asymmetrische Verfahren sind grundsätzlich immer schneller","Symmetrische Verschlüsselung verwendet grundsätzlich zwei getrennte Schlüssel","Asymmetrisch hat Schlüsselpaar: öffentlich und privat","Symmetrische Verschlüsselung gilt grundsätzlich als sicherer"],c:2,e:"Asymmetrisch: öffentlicher Schlüssel zum Verschlüsseln, privater zum Entschlüsseln. Symmetrisch: ein Schlüssel für beide Seiten."},
  {q:"Was schreibt die DSGVO bei einer Datenpanne vor?",o:["Nichts wenn keine Kundendaten","Intern dokumentieren nach einem Monat","Behörde innerhalb 72 Stunden informieren","Alle Daten löschen"],c:2,e:"DSGVO: Meldepflicht von 72 Stunden an die Datenschutzbehörde. Bei hohem Risiko auch Betroffene informieren."},
  {q:"Was macht eine Firewall?",o:["Sämtliche Daten auf der Festplatte verschlüsseln","Netzwerkverkehr überwachen und blockieren","Aktiv nach Viren suchen und diese entfernen","Regelmäßige Backups aller Systemdaten erstellen"],c:1,e:"Eine Firewall analysiert Netzwerkpakete nach Regeln und blockiert unerlaubten Verkehr."},
  {q:"Was versteht man unter Tailgating?",o:["Eine bestimmte technische Art von Netzwerkangriff","Sich hinter einem Berechtigten durch eine Sicherheitsschleuse schleusen","Ein gezielter Phishing-Angriff über eine gefälschte E-Mail","Fremde Passwörter heimlich über die Schulter ausspähen"],c:1,e:"Tailgating ist eine physische Bedrohung: Eine unbefugte Person nutzt die geöffnete Tür einer berechtigten Person um in gesicherte Bereiche zu gelangen — ohne eigenen Ausweis."},
  {q:"Was ist Zwei-Faktor-Authentifizierung (2FA)?",o:["Zwei verschiedene Passwörter direkt nacheinander eingeben","Anmeldung mit zwei Faktoren, z.B. Passwort plus Code vom Handy","Alle Daten grundsätzlich doppelt verschlüsseln","Sich gleichzeitig mit zwei getrennten Benutzerkonten anmelden"],c:1,e:"2FA kombiniert Wissen (Passwort) mit Besitz (z.B. Smartphone-Code). Ein gestohlenes Passwort allein reicht dann nicht mehr."},
  {q:"Was ist Ransomware?",o:["Software, die unerwünschte Werbung einblendet","Schadsoftware, die Daten verschlüsselt und Lösegeld fordert","Ein Programm zur sicheren Verwaltung von Passwörtern","Eine bestimmte Art von Firewall-Software"],c:1,e:"Ransomware verschlüsselt Dateien und erpresst Lösegeld – wichtigster Schutz sind aktuelle, getrennt aufbewahrte Backups."},
  {q:"Was versteht man unter Shoulder Surfing?",o:["Den Datenverkehr über eine WLAN-Verbindung mitlesen","Beim Eintippen von Passwörtern über die Schulter schauen","Ein Phishing-Angriff, der telefonisch durchgeführt wird","Einen speziellen Filter für unerwünschte Webseiten"],c:1,e:"Shoulder Surfing ist das Ausspähen von Eingaben durch direktes Zusehen – etwa im Zug oder im Großraumbüro."},
  {q:"Wozu dient ein VPN?",o:["Grundsätzlich für ein spürbar schnelleres Internet","Ein verschlüsselter Tunnel durch unsichere Netze","Einen umfassenden Schutz vor Viren und Schadsoftware","Das automatische Erstellen regelmäßiger Backups"],c:1,e:"Ein VPN baut einen verschlüsselten Tunnel auf – z.B. für den sicheren Zugriff aufs Firmennetz aus dem Homeoffice."},
];

const DB=[
  {n:1,nm:"Was ist eine Datenbank?",osi:"Datenbankzugriffe laufen über Schicht 7 (SQL-Protokoll) und Schicht 4 (TCP-Port 3306/5432).",th:"Eine Datenbank speichert Daten strukturiert. Relationale Datenbanken (SQL) speichern in Tabellen mit festen Beziehungen – ideal für strukturierte Daten. NoSQL-Datenbanken sind flexibler für große unstrukturierte Datenmengen.",pc:"Das Unternehmen nutzt bisher Excel. Das neue System bekommt eine relationale Datenbank: Kundendaten in einer Tabelle, Bestellungen in einer anderen – verknüpft über eine Kundennummer.",q1:"Warum reicht Excel nicht bei vielen gleichzeitigen Benutzern?",q2:"Wann NoSQL statt SQL?"},
  {n:2,nm:"Tabellen, Felder &amp; Beziehungen",osi:"Datenbankverbindungen über Netzwerk nutzen Schicht 4 (TCP) und Schicht 7 (Protokoll). Firewalls schützen den DB-Port.",th:"Tabellen bestehen aus Spalten (Felder) und Zeilen (Datensätze). Jede Tabelle hat einen Primärschlüssel – eine eindeutige ID. Ein Fremdschlüssel verknüpft zwei Tabellen. 1:n: ein Kunde hat viele Bestellungen.",pc:"Die Kundentabelle bekommt KundenID als Primärschlüssel. Die Bestelltabelle hat KundenID als Fremdschlüssel. So alle Bestellungen eines Kunden abrufbar – ohne Daten doppelt zu speichern.",q1:"Was passiert ohne Primärschlüssel?",q2:"Unterschied 1:n vs n:m Beziehung?"},
  {n:3,nm:"SQL Grundlagen",osi:"SQL-Server laufen auf separaten Maschinen. Verbindung über Schicht 3 (IP), 4 (TCP-Port), 7 (SQL).",th:"SQL ist die Sprache für relationale Datenbanken. SELECT liest, INSERT fügt ein, UPDATE ändert, DELETE löscht. WHERE filtert Ergebnisse, JOIN verknüpft Tabellen. MySQL, PostgreSQL, SQL Server verstehen alle SQL.",pc:"SELECT * FROM Kunden WHERE Stadt = 'München' liefert alle Münchener Kunden. Mit JOIN Bestellungen sieht man alle Bestellungen dieser Kunden.",q1:"Unterschied WHERE vs HAVING?",q2:"Warum kein SELECT * in Produktion?"},
  {n:4,nm:"Datenbank-Design",osi:"Gutes DB-Design reduziert übertragene Datenmenge und damit Netzwerklast auf allen Schichten.",th:"Normalisierung beseitigt Redundanz. Erste Normalform: ein Wert pro Feld. Zweite: alle Felder hängen am Primärschlüssel. Dritte: keine Abhängigkeiten zwischen Nicht-Schlüsselfeldern. Ein ERD visualisiert Tabellen und Beziehungen.",pc:"Kundenadresse stand dreimal in der Bestelltabelle. Nach Normalisierung gibt es eine eigene Adresstabelle. Adressänderung = einmal statt hundertmal.",q1:"Was ist Redundanz und warum problematisch?",q2:"Was zeigt ein ERD?"},
  {n:5,nm:"APIs &amp; Datenaustausch",osi:"REST-APIs laufen auf Schicht 7 (HTTP/HTTPS). HTTPS schützt über Schicht 6 (TLS). Transport über Schicht 4 (TCP).",th:"Eine API (Application Programming Interface) ist eine Schnittstelle zwischen Programmen. REST-APIs nutzen HTTP: GET (lesen), POST (erstellen), PUT (aktualisieren), DELETE (löschen). Daten meist im JSON-Format.",pc:"Das CRM stellt eine REST-API bereit. Die Buchhaltungssoftware ruft GET /api/kunden/42 ab und bekommt JSON zurück. Kein manueller Export mehr.",q1:"Unterschied REST-API vs Datenbank?",q2:"Warum JSON statt XML?"},
  {n:6,nm:"Daten systemübergreifend",osi:"Systemübergreifende Übertragung nutzt Schicht 5 (Session), 6 (Format), 7 (Protokoll).",th:"In Unternehmen laufen viele Systeme parallel: ERP, CRM, Buchhaltung. Middleware verbindet sie und übersetzt Formate. ETL-Prozesse: Extract (extrahieren), Transform (umwandeln), Load (ins Zielsystem laden).",pc:"Die Warenwirtschaft exportiert CSV. Ein ETL-Prozess liest CSV, wandelt in JSON um und schickt es per API ans CRM. Einmal einrichten, dann läuft es jede Nacht automatisch.",q1:"Unterschied Middleware vs API?",q2:"Was ist ETL?"},
];
const DBQ=[
  {q:"Hauptunterschied SQL vs NoSQL?",o:["SQL-Datenbanken sind grundsätzlich immer schneller","SQL speichert in Tabellen mit Beziehungen, NoSQL ist flexibler","NoSQL-Datenbanken unterstützen grundsätzlich keinerlei Abfragen","SQL kann grundsätzlich immer nur eine einzige Tabelle verwalten"],c:1,e:"SQL: strukturierte Tabellen mit Beziehungen. NoSQL: flexibel, für große unstrukturierte Datenmengen."},
  {q:"Was ist ein Primärschlüssel?",o:["Erstes Feld der Tabelle","Verschlüsseltes Passwort","Eindeutige ID jedes Datensatzes","Name der Datenbank"],c:2,e:"Ein Primärschlüssel identifiziert jeden Datensatz eindeutig. Darf nicht leer oder doppelt sein."},
  {q:"Welcher SQL-Befehl liest Daten?",o:["INSERT","UPDATE","DELETE","SELECT"],c:3,e:"SELECT liest Daten. Mit WHERE filtern, mit JOIN verknüpfen, mit ORDER BY sortieren."},
  {q:"Zweck der Normalisierung?",o:["Die gesamte Datenbank vollständig verschlüsseln","Redundanz vermeiden und Integrität gewährleisten","Ausschließlich die Geschwindigkeit von Abfragen erhöhen","Ausschließlich die Rechte einzelner Benutzer verwalten"],c:1,e:"Normalisierung beseitigt Redundanz. Eine Adresse nur einmal gespeichert = nur einmal ändern nötig."},
  {q:"Was ist eine REST-API?",o:["Eine bestimmte Art von Datenbank speziell fürs Web","Schnittstelle mit HTTP-Methoden für Datenaustausch","Ein spezielles Protokoll zur Verschlüsselung von Daten","Ein bestimmtes Speicherformat für Datenbanken"],c:1,e:"REST-API nutzt HTTP: GET, POST, PUT, DELETE. Programme kommunizieren unabhängig von Sprache oder Plattform."},
  {q:"Wozu dient ein Fremdschlüssel?",o:["Er verschlüsselt den Inhalt der gesamten Tabelle","Er verknüpft Datensätze zweier Tabellen","Er sortiert die Ergebnisse einer Abfrage automatisch","Er löscht automatisch alle doppelt vorhandenen Einträge"],c:1,e:"Ein Fremdschlüssel verweist auf den Primärschlüssel einer anderen Tabelle und stellt so Beziehungen zwischen Tabellen her."},
  {q:"Welcher SQL-Befehl fügt neue Datensätze ein?",o:["ADD","INSERT","UPDATE","CREATE"],c:1,e:"INSERT INTO tabelle (…) VALUES (…) legt neue Zeilen an. UPDATE ändert bestehende, CREATE erstellt Strukturen."},
  {q:"Was bewirkt die WHERE-Klausel?",o:["Sie sortiert die Ergebnisse einer Abfrage","Sie filtert Zeilen nach Bedingungen","Sie verbindet zwei oder mehr Tabellen miteinander","Sie zählt die Anzahl aller vorhandenen Datensätze"],c:1,e:"WHERE schränkt ein, welche Zeilen betroffen sind – bei SELECT genauso wie bei UPDATE und DELETE."},
  {q:"Was besagt die 3-2-1-Backup-Regel?",o:["3 zuständige Admins, 2 Server, 1 gemeinsamer Standort","3 Kopien, auf 2 Medientypen, davon 1 extern","3 vollständige Backups an jedem einzelnen Tag","3 unterschiedliche, komplexe Passwörter verwenden"],c:1,e:"3 Kopien der Daten, auf 2 verschiedenen Medien, davon 1 außer Haus – schützt auch bei Brand oder Ransomware."},
  {q:"Warum ist Redundanz in Tabellen problematisch?",o:["Sie spart erheblich Speicherplatz auf der Festplatte","Mehrfach gespeicherte Daten werden bei Änderungen leicht inkonsistent","Sie beschleunigt sämtliche Datenbankabfragen erheblich","Sie ist in Deutschland gesetzlich ausdrücklich vorgeschrieben"],c:1,e:"Steht dieselbe Information mehrfach, wird bei Änderungen leicht eine Stelle vergessen – die Normalisierung verhindert genau das."},
];

const Logo=({sz=44})=>(
  <svg width={sz} height={sz} viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="21" stroke="#2563eb" strokeWidth="1.5" fill="#1a2535"/>
    <circle cx="22" cy="22" r="14" stroke="#3b82f6" strokeWidth="1" fill="none" opacity=".5"/>
    <circle cx="22" cy="22" r="7" stroke="#38bdf8" strokeWidth="1" fill="none" opacity=".5"/>
    <circle cx="22" cy="22" r="3" fill="#38bdf8"/>
    <line x1="5" y1="22" x2="19" y2="22" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
    <polygon points="28,16 38,22 28,28" fill="#2563eb"/>
  </svg>
);

const Figur=()=>(
  <>
    <ellipse cx="110" cy="228" rx="30" ry="5" fill="#38bdf8" opacity="0.05"/>
    <circle cx="110" cy="174" r="15" fill={C.co}/>
    <rect x="97" y="189" width="26" height="34" rx="9" fill={C.co}/>
    <line x1="97" y1="198" x2="82" y2="185" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="123" y1="198" x2="138" y2="185" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="103" y1="221" x2="99" y2="227" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    <line x1="117" y1="221" x2="121" y2="227" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    <text x="110" y="152" textAnchor="middle" fontSize="18" fontFamily={ff}>💡</text>
  </>
);

const SVG=({h=240,children})=>(
  <svg width="100%" viewBox={`0 0 680 ${h}`} style={{borderRadius:10,background:C.s1,display:"block",maxWidth:600,margin:"0 auto"}}>
    <Figur/>{children}
  </svg>
);

const Scene=({mid,n})=>{
  if(mid==="g")return(
    <SVG>
      {n===1&&<>
        {/* Sprechblase vom Männchen */}
        <rect x="135" y="148" width="110" height="32" rx="8" fill="#1e3a5f" stroke={C.bl} strokeWidth="1"/>
        <polygon points="148,180 140,192 160,180" fill="#1e3a5f"/>
        <text x="190" y="165" textAnchor="middle" fill={C.cy} fontSize="13" fontFamily={ff}>Was steckt</text>
        <text x="190" y="177" textAnchor="middle" fill={C.cy} fontSize="13" fontFamily={ff}>da drin?</text>

        {/* PC-Gehäuse Tower */}
        <rect x="270" y="50" width="60" height="170" rx="6" fill="#0c1a2e" stroke={C.bd} strokeWidth="1.5"/>
        <rect x="278" y="62" width="44" height="6" rx="2" fill={C.bl} opacity=".6"/>
        <rect x="278" y="72" width="44" height="6" rx="2" fill={C.bd} opacity=".8"/>
        <circle cx="292" cy="90" r="5" fill={C.gr} opacity=".8"/>
        <rect x="278" y="102" width="44" height="28" rx="2" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>
        <rect x="278" y="134" width="44" height="28" rx="2" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>
        <text x="300" y="220" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Tower</text>

        {/* Mainboard */}
        <rect x="355" y="45" width="130" height="100" rx="6" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        {/* CPU Sockel */}
        <rect x="370" y="58" width="40" height="40" rx="3" fill="#1e3a5f" stroke={C.cy} strokeWidth="1"/>
        <rect x="378" y="66" width="24" height="24" rx="2" fill={C.cy} opacity=".3"/>
        <text x="390" y="82" textAnchor="middle" fill={C.cy} fontSize="11" fontFamily={ff}>CPU</text>
        {/* RAM Slots */}
        <rect x="420" y="58" width="10" height="82" rx="2" fill="#1e3a5f" stroke={C.bl} strokeWidth=".5"/>
        <rect x="433" y="58" width="10" height="82" rx="2" fill="#1e3a5f" stroke={C.bl} strokeWidth=".5"/>
        <text x="432" y="152" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>RAM</text>
        {/* PCIe Slots */}
        <rect x="370" y="108" width="44" height="6" rx="1" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>
        <rect x="370" y="118" width="44" height="6" rx="1" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>
        <rect x="370" y="128" width="44" height="6" rx="1" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>
        <text x="390" y="148" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Mainboard</text>

        {/* SSD */}
        <rect x="500" y="45" width="130" height="44" rx="6" fill="#0c1a2e" stroke={C.gr} strokeWidth="1.5"/>
        <rect x="510" y="55" width="80" height="6" rx="2" fill={C.gr} opacity=".4"/>
        <rect x="510" y="65" width="60" height="4" rx="2" fill={C.gr} opacity=".3"/>
        <rect x="596" y="52" width="24" height="30" rx="3" fill="#1e3a5f" stroke={C.gr} strokeWidth=".5"/>
        <text x="565" y="100" textAnchor="middle" fill={C.gr} fontSize="12" fontFamily={ff}>SSD</text>

        {/* HDD */}
        <rect x="500" y="100" width="130" height="44" rx="6" fill="#0c1a2e" stroke={C.am} strokeWidth="1.5"/>
        <circle cx="530" cy="122" r="14" fill="none" stroke={C.am} opacity=".5" strokeWidth="5"/>
        <circle cx="530" cy="122" r="5" fill={C.am} opacity=".4"/>
        <rect x="552" y="110" width="60" height="5" rx="2" fill={C.am} opacity=".3"/>
        <rect x="552" y="120" width="50" height="5" rx="2" fill={C.am} opacity=".3"/>
        <rect x="552" y="130" width="55" height="5" rx="2" fill={C.am} opacity=".3"/>
        <text x="565" y="155" textAnchor="middle" fill={C.am} fontSize="12" fontFamily={ff}>HDD</text>

        {/* RAM Riegel Detail */}
        <rect x="500" y="158" width="130" height="28" rx="4" fill="#0c1a2e" stroke={C.cy} strokeWidth="1.5"/>
        {[0,1,2,3,4,5,6].map(i=>(
          <rect key={i} x={510+i*16} y="164" width="10" height="16" rx="1" fill="#1e3a5f" stroke={C.cy} strokeWidth=".5" opacity=".7"/>
        ))}
        <text x="565" y="198" textAnchor="middle" fill={C.cy} fontSize="12" fontFamily={ff}>RAM-Riegel</text>

        {/* Verbindungslinien vom Tower zu Komponenten */}
        <line x1="330" y1="95" x2="355" y2="95" stroke={C.bd} strokeWidth="1" strokeDasharray="3 2"/>
        <line x1="330" y1="120" x2="490" y2="67" stroke={C.bd} strokeWidth="1" strokeDasharray="3 2"/>
        <line x1="330" y1="140" x2="490" y2="122" stroke={C.bd} strokeWidth="1" strokeDasharray="3 2"/>
        <line x1="330" y1="160" x2="490" y2="172" stroke={C.bd} strokeWidth="1" strokeDasharray="3 2"/>

        {/* Label oben */}
        <text x="480" y="22" textAnchor="middle" fill={C.t2} fontSize="13" fontWeight="600" fontFamily={ff}>PC-Komponenten im Überblick</text>
      </>}
      {n===2&&<>
        <text x="430" y="36" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Bit → Byte → KiB → MiB → GiB</text>
        {[{l:"1 Bit",s:"0 od. 1",x:200,w:55},{l:"1 Byte",s:"8 Bit",x:268,w:65},{l:"1 KiB",s:"1024 B",x:346,w:75},{l:"1 MiB",s:"1024 KiB",x:434,w:82},{l:"1 GiB",s:"1024 MiB",x:529,w:88}].map((b,i)=>(
          <g key={i}><rect x={b.x} y={70} width={b.w} height={88} rx="4" fill="#0f2744" stroke={C.bl} strokeWidth="0.5"/>
          <text x={b.x+b.w/2} y={112} textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{b.l}</text>
          <text x={b.x+b.w/2} y={130} textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>{b.s}</text></g>
        ))}
        <text x="430" y="188" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Hersteller rechnen dezimal: 1 GB = 1000 MB → darum zeigt Windows weniger an</text>
      </>}
      {n===3&&<>
        <text x="430" y="36" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Dieselbe Zahl in drei Schreibweisen</text>
        {[{t:"Dezimal",b:"Basis 10",e:"42",x:210},{t:"Binär",b:"Basis 2",e:"101010",x:365},{t:"Hex",b:"Basis 16",e:"2A",x:515}].map((z,i)=>(
          <g key={i}><rect x={z.x} y={55} width={115} height={128} rx="6" fill="#0f2744" stroke={i===1?C.cy:C.bd} strokeWidth={i===1?1.5:0.5}/>
          <text x={z.x+57} y={85} textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{z.t}</text>
          <text x={z.x+57} y={103} textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>{z.b}</text>
          <text x={z.x+57} y={138} textAnchor="middle" fill={C.cy} fontSize="20" fontWeight="700" fontFamily={ff}>{z.e}</text>
          <text x={z.x+57} y={160} textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>= 42</text></g>
        ))}
      </>}
      {n===4&&<>
        <text x="430" y="36" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>HDD vs SSD</text>
        <rect x="195" y="55" width="185" height="148" rx="8" fill="#1e2d42" stroke={C.bd} strokeWidth="1"/>
        <circle cx="287" cy="128" r="46" fill="none" stroke="#334155" strokeWidth="9"/>
        <circle cx="287" cy="128" r="28" fill="none" stroke="#3b82f6" strokeWidth="6" opacity=".4"/>
        <circle cx="287" cy="128" r="10" fill={C.bd}/>
        <text x="287" y="192" textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>HDD – mechanisch</text>
        <rect x="415" y="55" width="185" height="148" rx="8" fill="#1e2d42" stroke={C.cy} strokeWidth="1.5"/>
        {[0,1,2,3].map(r=>[0,1,2,3,4].map(c2=>(<rect key={`${r}-${c2}`} x={432+c2*28} y={72+r*24} width="22" height="18" rx="2" fill="#0f2744" stroke="#2563eb" strokeWidth="0.5"/>)))}
        <text x="507" y="192" textAnchor="middle" fill={C.cy} fontSize="14" fontFamily={ff}>SSD – Flash</text>
      </>}
      {n===5&&<>
        <text x="430" y="36" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Bootvorgang</text>
        {[{l:"Strom",e:"⚡",x:215},{l:"BIOS",e:"🔧",x:300},{l:"POST",e:"✅",x:390},{l:"Bootloader",e:"📂",x:480},{l:"Windows",e:"🪟",x:565}].map((s,i,arr)=>(
          <g key={i}><circle cx={s.x} cy={120} r={27} fill="#0f2744" stroke={i===arr.length-1?C.gr:C.bl} strokeWidth="1.5"/>
          <text x={s.x} y={115} textAnchor="middle" fontSize="15" fontFamily={ff}>{s.e}</text>
          <text x={s.x} y={162} textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>{s.l}</text>
          {i<arr.length-1&&<line x1={s.x+27} y1={120} x2={arr[i+1].x-27} y2={120} stroke={C.bd} strokeWidth="1.5" strokeDasharray="4 3"/>}</g>
        ))}
      </>}
      {n===6&&<>
        <text x="430" y="36" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Schnittstellen &amp; Peripherie</text>
        {[{l:"USB-A",s:"Tastatur",x:205,c:"#1e3a5f"},{l:"USB-C",s:"Universal",x:298,c:"#0f2744"},{l:"HDMI",s:"Monitor",x:391,c:"#1e2d42"},{l:"RJ45",s:"Netzwerk",x:484,c:"#0f2744"},{l:"Treiber",s:"Übersetzer",x:577,c:"#14532d"}].map((s,i)=>(
          <g key={i}><rect x={s.x} y={58} width={84} height={108} rx="6" fill={s.c} stroke={i===4?C.gr:C.bl} strokeWidth={i===4?1.5:0.5}/>
          <text x={s.x+42} y={110} textAnchor="middle" fill={C.t} fontSize="15" fontWeight="600" fontFamily={ff}>{s.l}</text>
          <text x={s.x+42} y={128} textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>{s.s}</text></g>
        ))}
      </>}
    </SVG>
  );
  if(mid==="o")return(
    <SVG>
      {n===1&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Schicht 1 – Übertragungsmedien</text>
        {/* Kachel 1: Kabel */}
        <rect x="200" y="46" width="145" height="150" rx="8" fill="#0c1a2e" stroke={C.bl} strokeWidth="1"/>
        <rect x="216" y="66" width="34" height="26" rx="3" fill="#1e3a5f" stroke={C.cy} strokeWidth="1"/>
        {[0,1,2].map(i=>(<rect key={i} x={222+i*8} y="72" width="5" height="9" rx="1" fill={C.cy} opacity=".7"/>))}
        <path d="M250 79 C 290 79 295 100 322 100" fill="none" stroke={C.cy} strokeWidth="3" strokeLinecap="round"/>
        <rect x="308" y="92" width="22" height="16" rx="3" fill="#1e3a5f" stroke={C.cy} strokeWidth="1"/>
        <circle cx="228" cy="62" r="2.5" fill={C.gr}/>
        <text x="272" y="136" textAnchor="middle" fill={C.t2} fontSize="13" fontWeight="600" fontFamily={ff}>Kabel</text>
        <text x="272" y="152" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Kupfer (Cat6),</text>
        <text x="272" y="166" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Glasfaser</text>
        <text x="272" y="184" textAnchor="middle" fill={C.gr} fontSize="11" fontFamily={ff}>Link-LED zeigt Verbindung</text>
        {/* Kachel 2: WLAN */}
        <rect x="365" y="46" width="145" height="150" rx="8" fill="#0c1a2e" stroke={C.gr} strokeWidth="1"/>
        <rect x="424" y="86" width="26" height="32" rx="4" fill="#1e2d42" stroke={C.gr} strokeWidth="1.5"/>
        <line x1="437" y1="86" x2="437" y2="76" stroke={C.gr} strokeWidth="2" strokeLinecap="round"/>
        {[9,17,25].map((r,i)=>(<path key={i} d={`M ${437-r} ${74-r*0.35} A ${r} ${r} 0 0 1 ${437+r} ${74-r*0.35}`} fill="none" stroke={C.gr} strokeWidth="1.5" opacity={0.9-i*0.25}/>))}
        <text x="437" y="146" textAnchor="middle" fill={C.t2} fontSize="13" fontWeight="600" fontFamily={ff}>WLAN</text>
        <text x="437" y="162" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Funk im Gebäude,</text>
        <text x="437" y="176" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Access Point</text>
        {/* Kachel 3: Richtfunk und Satellit */}
        <rect x="530" y="46" width="145" height="150" rx="8" fill="#0c1a2e" stroke={C.am} strokeWidth="1"/>
        <rect x="594" y="54" width="16" height="10" rx="2" fill="#1e2d42" stroke={C.am} strokeWidth="1.5"/>
        <rect x="578" y="56" width="13" height="6" rx="1" fill={C.am} opacity=".5"/>
        <rect x="613" y="56" width="13" height="6" rx="1" fill={C.am} opacity=".5"/>
        <line x1="602" y1="66" x2="576" y2="80" stroke={C.am} strokeWidth="1.5" strokeDasharray="3 3"/>
        <line x1="602" y1="66" x2="638" y2="80" stroke={C.am} strokeWidth="1.5" strokeDasharray="3 3"/>
        <line x1="566" y1="118" x2="566" y2="96" stroke={C.bd} strokeWidth="3"/>
        <circle cx="566" cy="90" r="10" fill="none" stroke={C.am} strokeWidth="2.5"/>
        <circle cx="566" cy="90" r="3" fill={C.am}/>
        <line x1="646" y1="118" x2="646" y2="96" stroke={C.bd} strokeWidth="3"/>
        <circle cx="646" cy="90" r="10" fill="none" stroke={C.am} strokeWidth="2.5"/>
        <circle cx="646" cy="90" r="3" fill={C.am}/>
        <line x1="578" y1="90" x2="634" y2="90" stroke={C.am} strokeWidth="2" strokeDasharray="5 4"/>
        <text x="602" y="146" textAnchor="middle" fill={C.t2} fontSize="13" fontWeight="600" fontFamily={ff}>Funk &amp; Satellit</text>
        <text x="602" y="162" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Richtfunk (Punkt-zu-Punkt),</text>
        <text x="602" y="176" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Satelliteninternet</text>
      </>}
      {n===2&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Schicht 2 – MAC-Adressen und Switches</text>
        <rect x="210" y="70" width="150" height="64" rx="6" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        <text x="285" y="86" textAnchor="middle" fill={C.t2} fontSize="12" fontFamily={ff}>Switch</text>
        {[0,1,2,3].map(i=>(<g key={i}><rect x={226+i*30} y="98" width="20" height="15" rx="2" fill="#1e3a5f" stroke={C.cy} strokeWidth=".5"/><text x={236+i*30} y="128" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>{i+1}</text></g>))}
        <rect x="415" y="58" width="240" height="92" rx="6" fill="#0f2744" stroke={C.cy} strokeWidth="1"/>
        <text x="535" y="76" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>MAC-Tabelle</text>
        <text x="436" y="96" fill={C.t2} fontSize="12" fontFamily={fm}>Port 1 → 2C:54:91:88:C9:E3</text>
        <text x="436" y="112" fill={C.t2} fontSize="12" fontFamily={fm}>Port 2 → 00:1A:2B:3C:4D:5E</text>
        <text x="436" y="128" fill={C.mu} fontSize="12" fontFamily={fm}>Port 3 → wird gerade gelernt</text>
        <line x1="360" y1="102" x2="420" y2="102" stroke={C.bd} strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x="425" y="172" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Der Switch lernt, welches Gerät an welchem Port hängt</text>
      </>}
      {n===3&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Schicht 3 – IP-Adressen und Routing</text>
        <rect x="200" y="70" width="140" height="80" rx="8" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
        <text x="270" y="92" textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>Netz A</text>
        <text x="270" y="110" textAnchor="middle" fill={C.cy} fontSize="12" fontFamily={fm}>192.168.1.0/24</text>
        <circle cx="245" cy="130" r="7" fill="#1e3a5f" stroke={C.bl} strokeWidth="1"/>
        <circle cx="270" cy="130" r="7" fill="#1e3a5f" stroke={C.bl} strokeWidth="1"/>
        <circle cx="295" cy="130" r="7" fill="#1e3a5f" stroke={C.bl} strokeWidth="1"/>
        <circle cx="420" cy="110" r="26" fill="#14532d" stroke={C.gr} strokeWidth="1.5"/>
        <text x="420" y="106" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="600" fontFamily={ff}>Router</text>
        <text x="420" y="119" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily={ff}>Gateway</text>
        <rect x="500" y="70" width="140" height="80" rx="8" fill="#0f2744" stroke={C.am} strokeWidth="1"/>
        <text x="570" y="92" textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>Netz B</text>
        <text x="570" y="110" textAnchor="middle" fill={C.am} fontSize="12" fontFamily={fm}>10.0.0.0/24</text>
        <circle cx="545" cy="130" r="7" fill="#2a1a0f" stroke={C.am} strokeWidth="1"/>
        <circle cx="570" cy="130" r="7" fill="#2a1a0f" stroke={C.am} strokeWidth="1"/>
        <circle cx="595" cy="130" r="7" fill="#2a1a0f" stroke={C.am} strokeWidth="1"/>
        <line x1="340" y1="110" x2="394" y2="110" stroke={C.gr} strokeWidth="2"/>
        <line x1="446" y1="110" x2="500" y2="110" stroke={C.gr} strokeWidth="2"/>
        <text x="420" y="170" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Der Router vermittelt zwischen den Netzen</text>
      </>}
      {n===4&&<>
        <text x="430" y="22" textAnchor="middle" fill={C.cy} fontSize="16" fontWeight="600" fontFamily={ff}>Schicht 4 – TCP, UDP und Ports</text>

        <rect x="470" y="46" width="165" height="140" rx="8" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        <text x="552" y="66" textAnchor="middle" fill={C.t2} fontSize="13" fontWeight="600" fontFamily={ff}>Server</text>
        {[{p:"80",l:"HTTP",col:"#22c55e"},{p:"443",l:"HTTPS",col:"#38bdf8"},{p:"3389",l:"RDP",col:"#a78bfa"},{p:"53",l:"DNS",col:C.am}].map((x,i)=>(
          <g key={i}><rect x="484" y={76+i*26} width="52" height="20" rx="4" fill="#0f2744" stroke={x.col} strokeWidth="1"/>
          <text x="510" y={90+i*26} textAnchor="middle" fill={x.col} fontSize="12" fontWeight="700" fontFamily={fm}>:{x.p}</text>
          <text x="580" y={90+i*26} textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>{x.l}</text></g>
        ))}

        <rect x="200" y="60" width="80" height="30" rx="15" fill="#14532d" stroke={C.gr} strokeWidth="1.5"/>
        <text x="240" y="80" textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="700" fontFamily={ff}>TCP</text>
        <text x="240" y="102" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>zuverlässig, mit</text>
        <text x="240" y="113" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Bestätigung</text>

        <rect x="200" y="140" width="80" height="30" rx="15" fill="#2a1a0f" stroke={C.am} strokeWidth="1.5"/>
        <text x="240" y="160" textAnchor="middle" fill={C.am} fontSize="13" fontWeight="700" fontFamily={ff}>UDP</text>
        <text x="240" y="182" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>schnell, ohne</text>
        <text x="240" y="193" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Bestätigung</text>

        {/* TCP → HTTP, HTTPS, RDP (alle drei sind TCP-basiert) */}
        <path d="M280 75 C 380 70 420 78 484 86" fill="none" stroke={C.gr} strokeWidth="1.5" strokeDasharray="5 3"/>
        <path d="M280 75 C 380 90 420 100 484 112" fill="none" stroke={C.gr} strokeWidth="1.5" strokeDasharray="5 3"/>
        <path d="M280 75 C 380 105 420 122 484 138" fill="none" stroke={C.gr} strokeWidth="1.5" strokeDasharray="5 3"/>
        {/* UDP → DNS (klassisches UDP-Beispiel) */}
        <path d="M280 155 C 380 150 420 164 484 164" fill="none" stroke={C.am} strokeWidth="1.5" strokeDasharray="5 3"/>

        <text x="360" y="215" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>HTTP, HTTPS und RDP laufen über TCP · DNS meist über UDP</text>
      </>}
      {n===5&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Schicht 5 – Sitzungen verwalten</text>
        <rect x="210" y="80" width="100" height="66" rx="8" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        <rect x="222" y="90" width="76" height="34" rx="3" fill="#0f2744"/>
        <text x="260" y="162" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Client</text>
        <rect x="530" y="72" width="100" height="82" rx="8" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        {[0,1,2].map(i=>(<rect key={i} x="542" y={84+i*20} width="76" height="12" rx="2" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>))}
        <text x="580" y="170" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Server</text>
        <line x1="310" y1="105" x2="530" y2="105" stroke={C.gr} strokeWidth="2.5"/>
        <circle cx="420" cy="105" r="14" fill="#14532d" stroke={C.gr} strokeWidth="1.5"/>
        <text x="420" y="110" textAnchor="middle" fontSize="13" fontFamily={ff}>🕐</text>
        <text x="420" y="88" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="600" fontFamily={ff}>Sitzung aktiv</text>
        <line x1="310" y1="135" x2="530" y2="135" stroke={C.co} strokeWidth="1.5" strokeDasharray="6 4" opacity=".6"/>
        <text x="420" y="152" textAnchor="middle" fill={C.co} fontSize="12" fontFamily={ff} opacity=".8">Timeout → Sitzung wird beendet</text>
      </>}
      {n===6&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Schicht 6 – Verschlüsselung (TLS)</text>
        <rect x="205" y="76" width="110" height="76" rx="8" fill="#0c1a2e" stroke={C.bd} strokeWidth="1.5"/>
        <rect x="205" y="76" width="110" height="18" rx="8" fill="#1e2d42"/>
        <circle cx="216" cy="85" r="3" fill="#ef4444"/><circle cx="227" cy="85" r="3" fill={C.am}/><circle cx="238" cy="85" r="3" fill={C.gr}/>
        <rect x="216" y="102" width="88" height="12" rx="6" fill="#0f2744"/>
        <text x="260" y="170" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Browser</text>
        <rect x="525" y="80" width="105" height="72" rx="8" fill="#0c1a2e" stroke={C.bd} strokeWidth="1.5"/>
        {[0,1,2].map(i=>(<rect key={i} x="537" y={92+i*18} width="80" height="10" rx="2" fill="#0f2744" stroke={C.bd} strokeWidth=".5"/>))}
        <text x="577" y="170" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Webserver</text>
        <line x1="315" y1="114" x2="525" y2="114" stroke={C.cy} strokeWidth="2.5"/>
        <rect x="398" y="94" width="44" height="40" rx="6" fill="#0c2a2a" stroke={C.cy} strokeWidth="1.5"/>
        <rect x="410" y="108" width="20" height="16" rx="2" fill="none" stroke={C.cy} strokeWidth="1.5"/>
        <path d="M413 108 v-5 a7 7 0 0 1 14 0 v5" fill="none" stroke={C.cy} strokeWidth="1.5"/>
        <text x="420" y="150" textAnchor="middle" fill={C.cy} fontSize="12" fontWeight="600" fontFamily={ff}>TLS-verschlüsselt</text>
      </>}
      {n===7&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Schicht 7 – Anwendungen und Protokolle</text>
        <rect x="230" y="44" width="400" height="120" rx="8" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        <rect x="230" y="44" width="400" height="24" rx="8" fill="#1e2d42"/>
        <circle cx="245" cy="56" r="4" fill="#ef4444"/><circle cx="259" cy="56" r="4" fill={C.am}/><circle cx="273" cy="56" r="4" fill={C.gr}/>
        <rect x="290" y="49" width="320" height="14" rx="7" fill="#0f2744"/>
        <text x="302" y="60" fill={C.mu} fontSize="12" fontFamily={fm}>https://firma.de</text>
        <rect x="248" y="80" width="170" height="10" rx="3" fill="#1e3a5f"/>
        <rect x="248" y="98" width="280" height="8" rx="3" fill="#0f2744"/>
        <rect x="248" y="112" width="240" height="8" rx="3" fill="#0f2744"/>
        <rect x="248" y="126" width="260" height="8" rx="3" fill="#0f2744"/>
        {[{l:"HTTP",x:250},{l:"SMTP",x:330},{l:"DNS",x:410}].map((p,i)=>(
          <g key={i}><rect x={p.x} y="176" width="70" height="22" rx="11" fill="#0f2744" stroke={C.cy} strokeWidth="1"/>
          <text x={p.x+35} y="191" textAnchor="middle" fill={C.cy} fontSize="12" fontWeight="600" fontFamily={fm}>{p.l}</text></g>
        ))}
      </>}
    </SVG>
  );
  return(
    <SVG>
      {mid==="b"&&n===1&&<>
        <text x="430" y="30" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>OS als Schicht</text>
        {[{l:"Anwendungen",s:"Browser, Office",y:44,c:"#14532d",b:C.gr},{l:"Betriebssystem",s:"Windows / Linux",y:96,c:"#0f2744",b:C.cy},{l:"Hardware",s:"CPU, RAM, SSD",y:148,c:"#1e2d42",b:C.bd}].map((x,i)=>(
          <g key={i}><rect x="195" y={x.y} width="460" height="44" rx="6" fill={x.c} stroke={x.b} strokeWidth="1.5"/>
          <text x="425" y={x.y+18} textAnchor="middle" fill={C.t} fontSize="15" fontWeight="600" fontFamily={ff}>{x.l}</text>
          <text x="425" y={x.y+34} textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>{x.s}</text></g>
        ))}
      </>}
      {mid==="b"&&n===2&&<>
        <rect x="195" y="48" width="195" height="150" rx="10" fill="#0f2744" stroke={C.bl} strokeWidth="1.5"/>
        <text x="292" y="104" textAnchor="middle" fontSize="30" fontFamily={ff}>🪟</text>
        <text x="292" y="140" textAnchor="middle" fill={C.t} fontSize="15" fontWeight="700" fontFamily={ff}>Windows</text>
        <text x="292" y="160" textAnchor="middle" fill={C.mu} fontSize="14" fontFamily={ff}>GUI · AD · kostenpflichtig</text>
        <rect x="420" y="48" width="195" height="150" rx="10" fill="#0f2744" stroke={C.gr} strokeWidth="1.5"/>
        <text x="517" y="104" textAnchor="middle" fontSize="30" fontFamily={ff}>🐧</text>
        <text x="517" y="140" textAnchor="middle" fill={C.t} fontSize="15" fontWeight="700" fontFamily={ff}>Linux</text>
        <text x="517" y="160" textAnchor="middle" fill={C.mu} fontSize="14" fontFamily={ff}>Server · Cloud · kostenlos</text>
      </>}
      {mid==="b"&&n===3&&<>
        {[{l:"C:\\",x:415,y:44,root:true},{l:"Daten",x:315,y:96},{l:"Windows",x:515,y:96},{l:"Buchhaltung",x:245,y:152},{l:"IT",x:375,y:152}].map((nd,i)=>(
          <g key={i}><rect x={nd.x-55} y={nd.y} width={110} height={28} rx="4" fill={nd.root?"#0f2744":"#1e2d42"} stroke={nd.root?C.cy:C.bd} strokeWidth={nd.root?1.5:0.5}/>
          <text x={nd.x} y={nd.y+18} textAnchor="middle" fill={nd.root?C.cy:C.t2} fontSize="14" fontWeight={nd.root?"700":"400"} fontFamily={ff}>{nd.l}</text></g>
        ))}
        <line x1="415" y1="72" x2="315" y2="96" stroke={C.bd} strokeWidth="1"/>
        <line x1="415" y1="72" x2="515" y2="96" stroke={C.bd} strokeWidth="1"/>
        <line x1="315" y1="124" x2="245" y2="152" stroke={C.bd} strokeWidth="1"/>
        <line x1="315" y1="124" x2="375" y2="152" stroke={C.bd} strokeWidth="1"/>
      </>}
      {mid==="b"&&n===4&&<>
        <rect x="195" y="44" width="455" height="165" rx="6" fill="#1e2d42" stroke={C.bd} strokeWidth="1"/>
        <rect x="195" y="44" width="455" height="22" rx="6" fill={C.bl} opacity=".25"/>
        <text x="240" y="59" fill={C.mu} fontSize="13" fontFamily={ff}>Prozess</text>
        <text x="590" y="59" fill={C.mu} fontSize="13" fontFamily={ff}>CPU%</text>
        {[{nm:"Windows Update",cpu:80,alert:true},{nm:"explorer.exe",cpu:2},{nm:"chrome.exe",cpu:12},{nm:"antivirus.exe",cpu:5}].map((p,i)=>(
          <g key={i}><rect x="195" y={68+i*30} width="455" height="30" fill={p.alert?"#450a0a":i%2===0?"#1a2535":"#1e2d42"}/>
          <text x="210" y={68+i*30+18} fill={p.alert?"#fca5a5":C.t2} fontSize="14" fontFamily={ff}>{p.nm}</text>
          <rect x="545" y={68+i*30+7} width={p.cpu*0.9} height="14" rx="2" fill={p.cpu>50?C.co:C.bl} opacity=".8"/>
          <text x="640" y={68+i*30+18} fill={p.alert?"#fca5a5":C.mu} fontSize="13" fontFamily={ff}>{p.cpu}%</text></g>
        ))}
      </>}
      {mid==="b"&&n===5&&<>
        {["Max","Anna","Tom"].map((u,i)=>(
          <g key={i}><circle cx={235+i*60} cy={82} r={22} fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
          <text x={235+i*60} y={78} textAnchor="middle" fontSize="15" fontFamily={ff}>👤</text>
          <text x={235+i*60} y={94} textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>{u}</text>
          <line x1={235+i*60} y1={104} x2={292} y2={128} stroke={C.bd} strokeWidth="1" strokeDasharray="3 2"/></g>
        ))}
        <rect x="232" y="128" width="120" height="32" rx="6" fill="#1e3a5f" stroke={C.bl} strokeWidth="1.5"/>
        <text x="292" y="148" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Buchhaltung</text>
        <line x1="352" y1="144" x2="412" y2="144" stroke={C.bd} strokeWidth="1.5" strokeDasharray="4 3"/>
        <rect x="412" y="128" width="218" height="32" rx="6" fill="#14532d" stroke={C.gr} strokeWidth="1.5"/>
        <text x="521" y="148" textAnchor="middle" fill="#86efac" fontSize="14" fontWeight="600" fontFamily={ff}>C:\Daten\Buchhaltung</text>
      </>}
      {mid==="b"&&n===6&&<>
        <rect x="190" y="40" width="460" height="168" rx="8" fill="#0a0f1a" stroke={C.bd} strokeWidth="1"/>
        <rect x="190" y="40" width="460" height="22" rx="8" fill="#1e2d42"/>
        <circle cx="207" cy="51" r="5" fill="#ef4444"/><circle cx="223" cy="51" r="5" fill={C.am}/><circle cx="239" cy="51" r="5" fill={C.gr}/>
        <text x="420" y="52" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>Windows PowerShell</text>
        {[{t:"PS C:\\> Get-Service | Where Status -eq Running",c:C.cy},{t:"Status   Name               DisplayName",c:C.t2},{t:"------   ----               -----------",c:C.mu},{t:"Running  Spooler            Print Spooler",c:C.t},{t:"Running  WinRM              Windows Remote...",c:C.t},{t:"PS C:\\> _",c:C.gr}].map((l,i)=>(
          <text key={i} x="205" y={74+i*20} fill={l.c} fontSize="12" fontFamily={fm}>{l.t}</text>
        ))}
      </>}
      {mid==="si"&&n===1&&<>
        {[{l:"Vertraulichkeit",s:"Nur Berechtigte sehen Daten",e:"🔒",y:48,c:"#0f2744",b:C.cy},{l:"Integrität",s:"Daten sind unverändert",e:"✅",y:102,c:"#14532d",b:C.gr},{l:"Verfügbarkeit",s:"Systeme sind erreichbar",e:"⚡",y:156,c:"#2a1a0f",b:C.am}].map((z,i)=>(
          <g key={i}><rect x="195" y={z.y} width="455" height="44" rx="8" fill={z.c} stroke={z.b} strokeWidth="1.5"/>
          <text x="222" y={z.y+20} fontSize="16" fontFamily={ff}>{z.e}</text>
          <text x="252" y={z.y+18} fill={C.t} fontSize="15" fontWeight="600" fontFamily={ff}>{z.l}</text>
          <text x="252" y={z.y+34} fill={C.t2} fontSize="14" fontFamily={ff}>{z.s}</text></g>
        ))}
      </>}
      {mid==="si"&&n===2&&<>
        <text x="430" y="36" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Risiko = Wahrscheinlichkeit × Schadenshöhe</text>
        {[{l:"Wahrscheinlichkeit",low:"selten",high:"häufig",y:70},{l:"Schadenshöhe",low:"gering",high:"kritisch",y:140}].map((r,i)=>(
          <g key={i}><text x="210" y={r.y} fill={C.t2} fontSize="14" fontFamily={ff}>{r.l}</text>
          <rect x="210" y={r.y+8} width="420" height="16" rx="8" fill={C.s2}/>
          <rect x="210" y={r.y+8} width="280" height="16" rx="8" fill={C.am} opacity=".6"/>
          <text x="210" y={r.y+38} fill={C.mu} fontSize="13" fontFamily={ff}>{r.low}</text>
          <text x="620" y={r.y+38} textAnchor="end" fill={C.mu} fontSize="13" fontFamily={ff}>{r.high}</text></g>
        ))}
      </>}
      {mid==="si"&&n===3&&<>
        <text x="430" y="22" textAnchor="middle" fill={C.cy} fontSize="16" fontWeight="600" fontFamily={ff}>Die häufigsten Bedrohungen</text>
        {[{e:"🎣",t:"Phishing",s:"Gefälschte E-Mails",x:205,y:38},{e:"🎭",t:"Social Eng.",s:"Menschen manipulieren",x:365,y:38},{e:"🦠",t:"Viren",s:"Hängen sich an Dateien",x:525,y:38},{e:"🪱",t:"Würmer",s:"Verbreiten sich selbst",x:205,y:126},{e:"🐴",t:"Trojaner",s:"Tarnen sich als Nützling",x:365,y:126},{e:"🔒",t:"Ransomware",s:"Verschlüsselt Daten",x:525,y:126}].map((a,i)=>(
          <g key={i}><rect x={a.x} y={a.y} width={150} height={78} rx="8" fill="#2a0f1a" stroke={C.co} strokeWidth="1"/>
          <text x={a.x+18} y={a.y+30} fontSize="20" fontFamily={ff}>{a.e}</text>
          <text x={a.x+52} y={a.y+28} fill={C.co} fontSize="15" fontWeight="600" fontFamily={ff}>{a.t}</text>
          <text x={a.x+14} y={a.y+54} fill={C.t2} fontSize="14" fontFamily={ff}>{a.s}</text></g>
        ))}
      </>}
      {mid==="si"&&n===4&&<>
        <rect x="195" y="44" width="200" height="160" rx="8" fill="#0f2744" stroke={C.bl} strokeWidth="1.5"/>
        <text x="295" y="80" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Symmetrisch</text>
        <text x="295" y="104" textAnchor="middle" fontSize="22" fontFamily={ff}>🔑</text>
        <text x="295" y="136" textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>1 Schlüssel</text>
        <text x="295" y="154" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>AES · schnell</text>
        <rect x="425" y="44" width="210" height="160" rx="8" fill="#14532d" stroke={C.gr} strokeWidth="1.5"/>
        <text x="530" y="80" textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="600" fontFamily={ff}>Asymmetrisch</text>
        <text x="500" y="104" textAnchor="middle" fontSize="17" fontFamily={ff}>🔓</text>
        <text x="560" y="104" textAnchor="middle" fontSize="17" fontFamily={ff}>🔐</text>
        <text x="530" y="136" textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>öffentlich + privat</text>
        <text x="530" y="154" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>TLS · RSA · sicher</text>
      </>}
      {mid==="si"&&n===5&&<>
        <rect x="215" y="60" width="90" height="130" rx="6" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
        <text x="260" y="90" textAnchor="middle" fontSize="17" fontFamily={ff}>🌐</text>
        <text x="260" y="112" textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>Internet</text>
        <rect x="335" y="76" width="70" height="98" rx="6" fill="#2a1a0f" stroke={C.am} strokeWidth="1.5"/>
        <text x="370" y="110" textAnchor="middle" fontSize="16" fontFamily={ff}>🧱</text>
        <text x="370" y="130" textAnchor="middle" fill={C.am} fontSize="13" fontWeight="600" fontFamily={ff}>Firewall</text>
        <rect x="435" y="60" width="90" height="130" rx="6" fill="#14532d" stroke={C.gr} strokeWidth="1"/>
        <text x="480" y="90" textAnchor="middle" fontSize="17" fontFamily={ff}>🏢</text>
        <text x="480" y="112" textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>Internes Netz</text>
        <rect x="555" y="76" width="80" height="98" rx="6" fill="#0c2a2a" stroke={C.cy} strokeWidth="1"/>
        <text x="595" y="110" textAnchor="middle" fontSize="16" fontFamily={ff}>🔐</text>
        <text x="595" y="130" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>VPN</text>
        <line x1="305" y1="125" x2="335" y2="125" stroke={C.co} strokeWidth="2" strokeDasharray="4 3"/>
        <line x1="405" y1="125" x2="435" y2="125" stroke={C.gr} strokeWidth="2"/>
      </>}
      {mid==="si"&&n===6&&<>
        {[{e:"⏱️",t:"72 Stunden",s:"Meldepflicht bei Datenpanne"},{e:"🎯",t:"Zweckbindung",s:"Daten nur für definierten Zweck"},{e:"👁️",t:"Auskunftsrecht",s:"Jeder darf seine Daten einsehen"},{e:"📋",t:"Lizenzrecht",s:"Software nur wie erlaubt nutzen"}].map((p,i)=>(
          <g key={i}><text x="215" y={70+i*38} fontSize="15" fontFamily={ff}>{p.e}</text>
          <text x="245" y={68+i*38} fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{p.t}</text>
          <text x="245" y={84+i*38} fill={C.t2} fontSize="14" fontFamily={ff}>{p.s}</text></g>
        ))}
      </>}
      {mid==="db"&&n===1&&<>
        <rect x="195" y="44" width="195" height="148" rx="8" fill="#0f2744" stroke={C.bl} strokeWidth="1.5"/>
        <text x="292" y="78" textAnchor="middle" fill={C.cy} fontSize="15" fontWeight="600" fontFamily={ff}>SQL</text>
        <text x="292" y="104" textAnchor="middle" fontSize="24" fontFamily={ff}>🗃️</text>
        <text x="292" y="134" textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>Tabellen · Beziehungen</text>
        <text x="292" y="152" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>strukturiert</text>
        <rect x="425" y="44" width="210" height="148" rx="8" fill="#0c2a2a" stroke={C.gr} strokeWidth="1.5"/>
        <text x="530" y="78" textAnchor="middle" fill="#86efac" fontSize="15" fontWeight="600" fontFamily={ff}>NoSQL</text>
        <text x="530" y="104" textAnchor="middle" fontSize="24" fontFamily={ff}>📦</text>
        <text x="530" y="134" textAnchor="middle" fill={C.t2} fontSize="14" fontFamily={ff}>Dokumente · Key-Value</text>
        <text x="530" y="152" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>flexibel · skalierbar</text>
      </>}
      {mid==="db"&&n===2&&<>
        <rect x="195" y="44" width="200" height="120" rx="6" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
        <rect x="195" y="44" width="200" height="22" rx="6" fill={C.bl} opacity=".3"/>
        <text x="295" y="59" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Kunden</text>
        {[{k:"🔑 KundenID",v:"PK"},{k:"Name",v:"Max"},{k:"Stadt",v:"München"}].map((r,i)=>(
          <g key={i}><text x="210" y={80+i*20} fill={C.t2} fontSize="14" fontFamily={ff}>{r.k}</text>
          <text x="375" y={80+i*20} textAnchor="end" fill={C.mu} fontSize="13" fontFamily={ff}>{r.v}</text></g>
        ))}
        <line x1="395" y1="104" x2="430" y2="104" stroke={C.bd} strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x="412" y="100" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>1:n</text>
        <rect x="430" y="44" width="210" height="140" rx="6" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
        <rect x="430" y="44" width="210" height="22" rx="6" fill={C.bl} opacity=".3"/>
        <text x="535" y="59" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Bestellungen</text>
        {[{k:"🔑 BestellID",v:"PK"},{k:"🔗 KundenID",v:"FK"},{k:"Produkt",v:"Laptop"},{k:"Betrag",v:"999"}].map((r,i)=>(
          <g key={i}><text x="445" y={80+i*20} fill={C.t2} fontSize="14" fontFamily={ff}>{r.k}</text>
          <text x="625" y={80+i*20} textAnchor="end" fill={C.mu} fontSize="13" fontFamily={ff}>{r.v}</text></g>
        ))}
      </>}
      {mid==="db"&&n===3&&<>
        <rect x="195" y="40" width="455" height="170" rx="8" fill="#0a0f1a" stroke={C.bd} strokeWidth="1"/>
        <rect x="195" y="40" width="455" height="22" rx="8" fill="#1e2d42"/>
        <circle cx="212" cy="51" r="5" fill="#ef4444"/><circle cx="228" cy="51" r="5" fill={C.am}/><circle cx="244" cy="51" r="5" fill={C.gr}/>
        <text x="420" y="52" textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>SQL Editor</text>
        {[{t:"SELECT Name, Stadt",c:C.cy},{t:"FROM Kunden",c:C.bl},{t:"WHERE Stadt = 'München'",c:C.am},{t:"ORDER BY Name ASC;",c:C.t2},{t:"",c:""},{t:"-- 3 Zeilen gefunden",c:C.gr}].map((l,i)=>(
          i===4?null:<text key={i} x="210" y={74+i*20} fill={l.c} fontSize="12" fontFamily={fm}>{l.t}</text>
        ))}
      </>}
      {mid==="db"&&n===4&&<>
        <text x="295" y="48" textAnchor="middle" fill={C.co} fontSize="13" fontWeight="600" fontFamily={ff}>Vor Normalisierung</text>
        <rect x="195" y="56" width="200" height="100" rx="6" fill="#2a0f0f" stroke={C.co} strokeWidth="1"/>
        {["BestellID · KundenID","Kundenname","Adresse (3x!)","Adresse (3x!)"].map((r,i)=>(
          <text key={i} x="205" y={74+i*18} fill={i>1?C.co:C.t2} fontSize="13" fontFamily={ff}>{r}</text>
        ))}
        <text x="530" y="48" textAnchor="middle" fill={C.gr} fontSize="13" fontWeight="600" fontFamily={ff}>Nach Normalisierung</text>
        <rect x="415" y="56" width="110" height="80" rx="6" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
        <text x="470" y="74" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Kunden</text>
        {["KundenID (PK)","AdressID (FK)"].map((r,i)=>(<text key={i} x="425" y={88+i*16} fill={C.t2} fontSize="13" fontFamily={ff}>{r}</text>))}
        <rect x="540" y="56" width="110" height="80" rx="6" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
        <text x="595" y="74" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Adressen</text>
        {["AdressID (PK)","Straße, PLZ"].map((r,i)=>(<text key={i} x="550" y={88+i*16} fill={C.t2} fontSize="13" fontFamily={ff}>{r}</text>))}
      </>}
      {mid==="db"&&n===5&&<>
        {[{m:"GET",c:C.gr,x:205},{m:"POST",c:C.bl,x:315},{m:"PUT",c:C.am,x:425},{m:"DELETE",c:C.co,x:528}].map((b,i)=>(
          <g key={i}><rect x={b.x} y={48} width={95} height={44} rx="6" fill="#0f2744" stroke={b.c} strokeWidth="1.5"/>
          <text x={b.x+47} y={68} textAnchor="middle" fill={b.c} fontSize="12" fontWeight="700" fontFamily={fm}>{b.m}</text></g>
        ))}
        <rect x="195" y="110" width="455" height="60" rx="6" fill="#0a0f1a" stroke={C.bd} strokeWidth="1"/>
        <text x="210" y="130" fill={C.cy} fontSize="12" fontFamily={fm}>GET /api/kunden/42</text>
        <text x="210" y="150" fill={C.gr} fontSize="12" fontFamily={fm}>{'{"id":42, "name":"Max", "stadt":"München"}'}</text>
      </>}
      {mid==="db"&&n===6&&<>
        {[{l:"System A",s:"CSV-Export",e:"📦",x:195,c:C.bd},{l:"Middleware",s:"ETL · Transform",e:"⚙️",x:340,c:C.cy},{l:"System B",s:"JSON-Import",e:"🏢",x:490,c:C.gr}].map((sys,i)=>(
          <g key={i}><rect x={sys.x} y={50} width={130} height={110} rx="8" fill="#0f2744" stroke={sys.c} strokeWidth="1.5"/>
          <text x={sys.x+65} y={82} textAnchor="middle" fontSize="22" fontFamily={ff}>{sys.e}</text>
          <text x={sys.x+65} y={106} textAnchor="middle" fill={C.t} fontSize="14" fontWeight="600" fontFamily={ff}>{sys.l}</text>
          <text x={sys.x+65} y={124} textAnchor="middle" fill={C.mu} fontSize="13" fontFamily={ff}>{sys.s}</text>
          {i<2&&<line x1={sys.x+130} y1={105} x2={sys.x+145} y2={105} stroke={C.bd} strokeWidth="1.5" strokeDasharray="4 3"/>}</g>
        ))}
        <text x="422" y="195" textAnchor="middle" fill={C.mu} fontSize="14" fontFamily={ff}>Extract → Transform → Load</text>
      </>}
      {mid==="si"&&n===7&&<>
        <text x="430" y="22" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Physische Sicherheit im Alltag</text>

        {/* Kachel 1: Bildschirm sperren */}
        <rect x="200" y="40" width="130" height="150" rx="8" fill="#0c1a2e" stroke={C.bl} strokeWidth="1"/>
        <rect x="212" y="54" width="106" height="62" rx="4" fill="#0f2744" stroke={C.bd} strokeWidth="1"/>
        <rect x="248" y="72" width="20" height="16" rx="2" fill="none" stroke={C.cy} strokeWidth="1.5"/>
        <path d="M251 72 v-5 a7 7 0 0 1 14 0 v5" fill="none" stroke={C.cy} strokeWidth="1.5"/>
        <rect x="248" y="120" width="30" height="6" rx="2" fill={C.bd}/>
        <text x="265" y="150" textAnchor="middle" fill={C.t2} fontSize="12" fontWeight="600" fontFamily={ff}>Bildschirm sperren</text>
        <text x="265" y="166" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={fm}>Win + L</text>

        {/* Kachel 2: Zutrittsschleuse mit Drehkreuz */}
        <rect x="345" y="40" width="200" height="150" rx="8" fill="#0c1a2e" stroke={C.am} strokeWidth="1"/>
        {/* Ausweisleser: Terminal mit Display, Kartenslot, eingesteckter Karte, gruener LED */}
        <rect x="356" y="60" width="26" height="46" rx="3" fill="#1e2d42" stroke={C.am} strokeWidth="1.5"/>
        <rect x="360" y="66" width="18" height="10" rx="1" fill="#0f2744"/>
        <rect x="360" y="82" width="18" height="3" rx="1" fill="#0a0f1a"/>
        <rect x="346" y="80" width="15" height="9" rx="1.5" fill={C.cy}/>
        <circle cx="369" cy="96" r="3" fill={C.gr}/>
        {/* Obere Fuehrungsstange der Schleuse */}
        <line x1="392" y1="54" x2="536" y2="54" stroke={C.bd} strokeWidth="4" strokeLinecap="round"/>
        {/* Ampeln an der Stange */}
        <circle cx="404" cy="46" r="5" fill={C.gr}/>
        <circle cx="508" cy="46" r="5" fill={C.co}/>
        {/* Drehkreuz-Pfosten mit drei Dreharmen */}
        <rect x="418" y="54" width="6" height="100" rx="3" fill={C.bd}/>
        <line x1="421" y1="100" x2="447" y2="88" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
        <line x1="421" y1="100" x2="447" y2="114" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
        <line x1="421" y1="100" x2="397" y2="116" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
        {/* Person 1: berechtigt, komplett mit Beinen und Fuessen, Ausweis in der Hand */}
        <circle cx="443" cy="84" r="8" fill="#38bdf8"/>
        <rect x="436" y="93" width="14" height="20" rx="6" fill="#38bdf8"/>
        <line x1="440" y1="113" x2="438" y2="127" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <line x1="446" y1="113" x2="448" y2="127" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <line x1="438" y1="128" x2="432" y2="128" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <line x1="448" y1="128" x2="454" y2="128" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <rect x="450" y="98" width="9" height="6" rx="1" fill="#fff"/>
        {/* Gruener Haken gross und klar neben Person 1 */}
        <circle cx="464" cy="74" r="9" fill="#052e16" stroke={C.gr} strokeWidth="2"/>
        <path d="M459 74 l4 4 l7 -8" fill="none" stroke={C.gr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Sperrbalken stoppt Person 2 */}
        <line x1="472" y1="102" x2="524" y2="102" stroke={C.co} strokeWidth="5" strokeLinecap="round"/>
        {/* Person 2: unbefugt, komplett, mit rotem X */}
        <circle cx="503" cy="78" r="7" fill="none" stroke={C.co} strokeWidth="2"/>
        <rect x="497" y="86" width="12" height="17" rx="5" fill="none" stroke={C.co} strokeWidth="2"/>
        <line x1="500" y1="103" x2="497" y2="118" stroke={C.co} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="506" y1="103" x2="509" y2="118" stroke={C.co} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="497" y1="119" x2="492" y2="119" stroke={C.co} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="509" y1="119" x2="514" y2="119" stroke={C.co} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="518" y1="62" x2="532" y2="76" stroke={C.co} strokeWidth="3" strokeLinecap="round"/>
        <line x1="532" y1="62" x2="518" y2="76" stroke={C.co} strokeWidth="3" strokeLinecap="round"/>
        <text x="445" y="168" textAnchor="middle" fill={C.t2} fontSize="12" fontWeight="600" fontFamily={ff}>Tailgating verhindern</text>
        <text x="445" y="182" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Schleuse: nur 1 Person pro Ausweis</text>

        {/* Kachel 3: USB-Stick mit klarem Totenkopf */}
        <rect x="558" y="40" width="118" height="150" rx="8" fill="#0c1a2e" stroke={C.co} strokeWidth="1"/>
        {/* Gekreuzte Knochen hinter dem Schaedel */}
        <line x1="598" y1="60" x2="636" y2="94" stroke={C.co} strokeWidth="4" strokeLinecap="round"/>
        <line x1="636" y1="60" x2="598" y2="94" stroke={C.co} strokeWidth="4" strokeLinecap="round"/>
        <circle cx="598" cy="60" r="3" fill={C.co}/><circle cx="636" cy="60" r="3" fill={C.co}/>
        <circle cx="598" cy="94" r="3" fill={C.co}/><circle cx="636" cy="94" r="3" fill={C.co}/>
        {/* Schaedel: Kopf, Augenhoehlen, Nase, Kiefer mit Zaehnen */}
        <ellipse cx="617" cy="72" rx="14" ry="13" fill="#0c1a2e" stroke={C.co} strokeWidth="2"/>
        <ellipse cx="611" cy="70" rx="3.5" ry="4.5" fill={C.co}/>
        <ellipse cx="623" cy="70" rx="3.5" ry="4.5" fill={C.co}/>
        <polygon points="617,77 614,82 620,82" fill={C.co}/>
        <rect x="610" y="84" width="14" height="7" rx="2" fill="#0c1a2e" stroke={C.co} strokeWidth="1.5"/>
        <line x1="614" y1="84" x2="614" y2="91" stroke={C.co} strokeWidth="1"/>
        <line x1="617" y1="84" x2="617" y2="91" stroke={C.co} strokeWidth="1"/>
        <line x1="620" y1="84" x2="620" y2="91" stroke={C.co} strokeWidth="1"/>
        {/* USB-Stick: Stecker mit Kontakten, Kragen, Gehaeuse, Oese */}
        <rect x="572" y="122" width="17" height="15" rx="1" fill="#94a3b8" stroke="#64748b" strokeWidth="1"/>
        <rect x="576" y="126" width="4" height="3" fill="#0a0f1a"/>
        <rect x="582" y="126" width="4" height="3" fill="#0a0f1a"/>
        <rect x="589" y="120" width="4" height="19" rx="1" fill="#64748b"/>
        <rect x="593" y="118" width="46" height="23" rx="5" fill="#1e2d42" stroke={C.co} strokeWidth="1.5"/>
        <circle cx="601" cy="129" r="2" fill={C.co}/>
        <circle cx="631" cy="129" r="3" fill="#0c1a2e" stroke="#64748b" strokeWidth="1.5"/>
        <text x="617" y="164" textAnchor="middle" fill={C.t2} fontSize="12" fontWeight="600" fontFamily={ff}>Fremde USB-Sticks</text>
        <text x="617" y="179" textAnchor="middle" fill={C.co} fontSize="11" fontWeight="600" fontFamily={ff}>Malware-Gefahr!</text>
      </>}
      {mid==="sk"&&n===1&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Manuell vs. automatisiert</text>
        <rect x="205" y="50" width="180" height="130" rx="8" fill="#2a0f1a" stroke={C.co} strokeWidth="1"/>
        <text x="295" y="72" textAnchor="middle" fill={C.co} fontSize="13" fontWeight="600" fontFamily={ff}>Manuell</text>
        {[0,1,2,3,4].map(i=>(<circle key={i} cx={235+i*30} cy="98" r="6" fill="#450a0a" stroke={C.co} strokeWidth="1"/>))}
        <text x="295" y="128" textAnchor="middle" fill={C.co} fontSize="12" fontFamily={ff}>50 Server einzeln prüfen</text>
        <text x="295" y="156" textAnchor="middle" fill={C.co} fontSize="15" fontWeight="700" fontFamily={ff}>⏱ 2 Stunden</text>
        <text x="415" y="120" textAnchor="middle" fill={C.t2} fontSize="16" fontFamily={ff}>→</text>
        <rect x="450" y="50" width="180" height="130" rx="8" fill="#14532d" stroke={C.gr} strokeWidth="1"/>
        <text x="540" y="72" textAnchor="middle" fill="#86efac" fontSize="13" fontWeight="600" fontFamily={ff}>Mit Skript</text>
        <rect x="490" y="86" width="100" height="30" rx="4" fill="#052e16" stroke={C.gr} strokeWidth="1"/>
        <text x="540" y="105" textAnchor="middle" fill="#86efac" fontSize="12" fontFamily={fm}>check.ps1</text>
        <text x="540" y="136" textAnchor="middle" fill="#86efac" fontSize="12" fontFamily={ff}>läuft automatisch durch</text>
        <text x="540" y="158" textAnchor="middle" fill="#86efac" fontSize="15" fontWeight="700" fontFamily={ff}>⚡ 2 Minuten</text>
      </>}
      {mid==="sk"&&n===2&&<>
        <rect x="200" y="40" width="440" height="150" rx="8" fill="#0a0f1a" stroke={C.bd} strokeWidth="1"/>
        <rect x="200" y="40" width="440" height="22" rx="8" fill="#1e2d42"/>
        <circle cx="216" cy="51" r="4" fill="#ef4444"/><circle cx="230" cy="51" r="4" fill={C.am}/><circle cx="244" cy="51" r="4" fill={C.gr}/>
        <text x="420" y="55" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Windows PowerShell</text>
        <text x="214" y="82" fill={C.cy} fontSize="12" fontFamily={fm}>PS&gt; Get-Service | Where Status -eq Stopped</text>
        {[{nm:"Spooler",st:"Stopped"},{nm:"BITS",st:"Stopped"}].map((s,i)=>(
          <g key={i}><rect x="214" y={94+i*34} width="200" height="28" rx="4" fill="#0f2744" stroke={C.cy} strokeWidth="1"/>
          <text x="226" y={112+i*34} fill={C.t} fontSize="12" fontFamily={fm}>{s.nm}</text>
          <text x="360" y={112+i*34} fill={C.co} fontSize="12" fontFamily={fm}>{s.st}</text></g>
        ))}
        <text x="470" y="112" fill={C.t2} fontSize="12" fontFamily={ff}>← Objekte,</text>
        <text x="470" y="126" fill={C.t2} fontSize="12" fontFamily={ff}>kein Text!</text>
        <text x="420" y="178" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Die Pipeline reicht Objekte an den nächsten Befehl weiter</text>
      </>}
      {mid==="sk"&&n===3&&<>
        <rect x="200" y="40" width="440" height="155" rx="8" fill="#0a0f1a" stroke={C.bd} strokeWidth="1"/>
        <rect x="200" y="40" width="440" height="22" rx="8" fill="#1e2d42"/>
        <text x="420" y="55" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>skript.ps1</text>
        <text x="214" y="84" fill={C.am} fontSize="12" fontFamily={fm}>$server = "srv01","srv02","srv03"</text>
        <text x="214" y="104" fill={C.cy} fontSize="12" fontFamily={fm}>foreach ($s in $server)</text>
        <text x="232" y="124" fill={C.t2} fontSize="12" fontFamily={fm}>$dienst = Get-Service -Computer $s</text>
        <text x="232" y="144" fill={C.gr} fontSize="12" fontFamily={fm}>Write-Host "$s geprüft"</text>
        <text x="214" y="180" fill={C.mu} fontSize="12" fontFamily={ff}>Die Schleife wiederholt sich für jeden Server automatisch</text>
      </>}
      {mid==="sk"&&n===4&&<>
        <rect x="200" y="40" width="440" height="155" rx="8" fill="#0a0f1a" stroke={C.gr} strokeWidth="1"/>
        <rect x="200" y="40" width="440" height="22" rx="8" fill="#14532d"/>
        <text x="420" y="55" textAnchor="middle" fill="#86efac" fontSize="12" fontFamily={ff}>Linux Terminal (Bash)</text>
        <text x="214" y="84" fill={C.gr} fontSize="12" fontFamily={fm}>$ ps aux | grep nginx</text>
        <text x="214" y="102" fill={C.t2} fontSize="12" fontFamily={fm}>www-data  1234  nginx: worker process</text>
        <text x="214" y="126" fill={C.gr} fontSize="12" fontFamily={fm}>$ systemctl restart nginx</text>
        <text x="214" y="144" fill={C.t2} fontSize="12" fontFamily={fm}>nginx.service neu gestartet ✓</text>
        <text x="214" y="180" fill={C.mu} fontSize="12" fontFamily={ff}>grep filtert, die Pipe | verbindet Befehle – wie in PowerShell</text>
      </>}
      {mid==="sk"&&n===5&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Aufgaben automatisch planen</text>
        <circle cx="270" cy="105" r="42" fill="#0c1a2e" stroke={C.bl} strokeWidth="1.5"/>
        <line x1="270" y1="105" x2="270" y2="76" stroke={C.cy} strokeWidth="2" strokeLinecap="round"/>
        <line x1="270" y1="105" x2="292" y2="112" stroke={C.cy} strokeWidth="2" strokeLinecap="round"/>
        {[0,90,180,270].map(a=>(<circle key={a} cx={270+38*Math.cos(a*Math.PI/180)} cy={105+38*Math.sin(a*Math.PI/180)} r="2" fill={C.mu}/>))}
        <text x="270" y="172" textAnchor="middle" fill={C.t2} fontSize="12" fontFamily={ff}>Zeitplan</text>
        <rect x="370" y="76" width="260" height="34" rx="6" fill="#0a0f1a" stroke={C.gr} strokeWidth="1"/>
        <text x="384" y="98" fill={C.gr} fontSize="12" fontFamily={fm}>*/5 * * * *  check_services.sh</text>
        <text x="500" y="130" textAnchor="middle" fill={C.t2} fontSize="12" fontFamily={ff}>Cronjob: läuft alle 5 Minuten</text>
        <text x="500" y="152" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Windows-Pendant: Task Scheduler</text>
      </>}
      {mid==="sk"&&n===6&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Monitoring: alle Server im Blick</text>
        {[{nm:"srv01",ok:true,x:210},{nm:"srv02",ok:true,x:330},{nm:"srv03",ok:false,x:450}].map((s,i)=>(
          <g key={i}><rect x={s.x} y="55" width="100" height="70" rx="8" fill={s.ok?"#14532d":"#450a0a"} stroke={s.ok?"#22c55e":"#ef4444"} strokeWidth="1.5"/>
          <text x={s.x+50} y="82" textAnchor="middle" fill={C.t} fontSize="12" fontWeight="600" fontFamily={fm}>{s.nm}</text>
          <text x={s.x+50} y="108" textAnchor="middle" fontSize="16" fontFamily={ff}>{s.ok?"✓":"✗"}</text></g>
        ))}
        <line x1="500" y1="130" x2="560" y2="158" stroke={C.co} strokeWidth="1.5" strokeDasharray="4 3"/>
        <rect x="545" y="152" width="90" height="44" rx="8" fill="#2a0f1a" stroke={C.co} strokeWidth="1.5"/>
        <text x="590" y="172" textAnchor="middle" fontSize="15" fontFamily={ff}>📧</text>
        <text x="590" y="188" textAnchor="middle" fill={C.co} fontSize="12" fontWeight="600" fontFamily={ff}>Alarm-Mail</text>
        <text x="360" y="160" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Das Skript meldet Ausfälle, bevor Nutzer anrufen</text>
      </>}
      {mid==="pr"&&n===1&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Organigramm der IT-Abteilung</text>
        <rect x="360" y="42" width="140" height="32" rx="6" fill="#1e3a5f" stroke={C.cy} strokeWidth="1.5"/>
        <text x="430" y="62" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>IT-Leitung</text>
        {[{l:"Helpdesk",s:"1st Level",x:220},{l:"Systemadmin",s:"2nd Level",x:370},{l:"Netzwerk",s:"3rd Level",x:520}].map((b,i)=>(
          <g key={i}><rect x={b.x} y="110" width="120" height="44" rx="6" fill="#0f2744" stroke={C.bl} strokeWidth="1"/>
          <text x={b.x+60} y="128" textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{b.l}</text>
          <text x={b.x+60} y="144" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>{b.s}</text>
          <line x1="430" y1="74" x2={b.x+60} y2="110" stroke={C.bd} strokeWidth="1"/></g>
        ))}
        <text x="430" y="185" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Eskalation: 1st → 2nd → 3rd Level</text>
      </>}
      {mid==="pr"&&n===2&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Erst verstehen, dann lösen</text>
        <rect x="205" y="52" width="180" height="46" rx="10" fill="#2a1a0f" stroke={C.am} strokeWidth="1"/>
        <polygon points="230,98 222,112 246,98" fill="#2a1a0f"/>
        <text x="295" y="72" textAnchor="middle" fill={C.am} fontSize="13" fontFamily={ff}>„Das Internet ist langsam!"</text>
        <text x="295" y="88" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>– Kunde</text>
        <rect x="430" y="70" width="200" height="110" rx="8" fill="#0f2744" stroke={C.cy} strokeWidth="1"/>
        <text x="530" y="90" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Bedarfsanalyse</text>
        <text x="446" y="112" fill={C.t2} fontSize="12" fontFamily={ff}>IST:  Was liegt vor?</text>
        <text x="446" y="130" fill={C.t2} fontSize="12" fontFamily={ff}>SOLL: Was wird erwartet?</text>
        <text x="446" y="148" fill={C.t2} fontSize="12" fontFamily={ff}>Erst fragen, dann messen,</text>
        <text x="446" y="164" fill={C.t2} fontSize="12" fontFamily={ff}>dann lösen.</text>
      </>}
      {mid==="pr"&&n===3&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Tickets nach Priorität</text>
        {[{l:"KRITISCH",s:"Mailserver down",sla:"SLA: 1 Std.",col:"#ef4444",bg:"#450a0a",x:205},{l:"NORMAL",s:"Drucker defekt",sla:"SLA: 4 Std.",col:"#f59e0b",bg:"#2a1a0f",x:355},{l:"NIEDRIG",s:"Neue Maus",sla:"SLA: 3 Tage",col:"#64748b",bg:"#1a2535",x:505}].map((t,i)=>(
          <g key={i}><rect x={t.x} y="52" width="130" height="96" rx="8" fill={t.bg} stroke={t.col} strokeWidth="1.5"/>
          <rect x={t.x+12} y="64" width="70" height="16" rx="8" fill={t.col} opacity=".25"/>
          <text x={t.x+47} y="76" textAnchor="middle" fill={t.col} fontSize="11" fontWeight="700" fontFamily={ff}>{t.l}</text>
          <text x={t.x+65} y="104" textAnchor="middle" fill={C.t} fontSize="12" fontFamily={ff}>{t.s}</text>
          <text x={t.x+65} y="130" textAnchor="middle" fill={t.col} fontSize="12" fontWeight="600" fontFamily={ff}>{t.sla}</text></g>
        ))}
        <text x="430" y="180" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Kritische Tickets zuerst – der SLA gibt die Reaktionszeit vor</text>
      </>}
      {mid==="pr"&&n===4&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Projektplan (Gantt)</text>
        {[{l:"Hardware",x:230,w:90,y:50},{l:"Netzwerk",x:300,w:100,y:80},{l:"Betriebssysteme",x:380,w:110,y:110},{l:"Software + Nutzer",x:470,w:110,y:140}].map((b,i)=>(
          <g key={i}><rect x={b.x} y={b.y} width={b.w} height="20" rx="4" fill="#1e3a5f" stroke={C.bl} strokeWidth="1"/>
          <text x={b.x+b.w/2} y={b.y+14} textAnchor="middle" fill={C.cy} fontSize="11" fontFamily={ff}>{b.l}</text></g>
        ))}
        <polygon points="610,146 620,156 610,166 600,156" fill={C.gr}/>
        <text x="610" y="184" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily={ff}>Abnahme</text>
        <line x1="220" y1="175" x2="640" y2="175" stroke={C.bd} strokeWidth="1"/>
        {["W1","W2","W3","W4"].map((w,i)=>(<text key={i} x={265+i*100} y="192" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>{w}</text>))}
      </>}
      {mid==="pr"&&n===5&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Abnahmeprotokoll</text>
        <rect x="280" y="42" width="300" height="160" rx="8" fill="#0f1c30" stroke={C.bd} strokeWidth="1.5"/>
        <rect x="280" y="42" width="300" height="26" rx="8" fill="#1e3a5f"/>
        <text x="430" y="60" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Projekt: 20 Arbeitsplätze</text>
        {["Alle PCs starten","Netzwerk verbunden","Drucker erreichbar","Anmeldung funktioniert"].map((z,i)=>(
          <g key={i}><rect x="298" y={78+i*22} width="12" height="12" rx="2" fill="#14532d" stroke={C.gr} strokeWidth="1"/>
          <text x="304" y={88+i*22} textAnchor="middle" fill="#86efac" fontSize="12" fontFamily={ff}>✓</text>
          <text x="320" y={88+i*22} fill={C.t2} fontSize="12" fontFamily={ff}>{z}</text></g>
        ))}
        <line x1="298" y1="182" x2="430" y2="182" stroke={C.mu} strokeWidth="1"/>
        <text x="364" y="194" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>Unterschrift Kunde</text>
      </>}
      {mid==="pr"&&n===6&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="14" fontWeight="600" fontFamily={ff}>Deine Ausbildung im Überblick</text>
        <line x1="220" y1="110" x2="640" y2="110" stroke={C.bd} strokeWidth="2"/>
        {[{l:"Start",s:"Ausbildungsvertrag",x:250,col:"#38bdf8"},{l:"AP1",s:"nach ca. 18 Monaten",x:430,col:"#f59e0b"},{l:"AP2 + Projekt",s:"nach 3 Jahren",x:590,col:"#22c55e"}].map((p,i)=>(
          <g key={i}><circle cx={p.x} cy="110" r="9" fill="#0f1623" stroke={p.col} strokeWidth="2"/>
          <text x={p.x} y="88" textAnchor="middle" fill={p.col} fontSize="13" fontWeight="700" fontFamily={ff}>{p.l}</text>
          <text x={p.x} y="140" textAnchor="middle" fill={C.mu} fontSize="11" fontFamily={ff}>{p.s}</text></g>
        ))}
        <text x="430" y="180" textAnchor="middle" fill={C.t2} fontSize="12" fontFamily={ff}>BBiG regelt Rechte und Pflichten – Schweigepflicht gilt immer</text>
      </>}
    </SVG>
  );
};

const OSIOverview=()=>(
  <div style={{marginBottom:16}}>
    <p style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:8}}>Die 7 Schichten im Überblick</p>
    {[{n:7,nm:"Anwendungsschicht",ex:"HTTP, SMTP, DNS",c:"#14532d",b:"#22c55e"},{n:6,nm:"Darstellungsschicht",ex:"TLS, Verschlüsselung",c:"#0c2a2a",b:"#2dd4bf"},{n:5,nm:"Sitzungsschicht",ex:"Verbindungsaufbau",c:"#0f2744",b:"#38bdf8"},{n:4,nm:"Transportschicht",ex:"TCP, UDP, Ports",c:"#1e1a3a",b:"#a78bfa"},{n:3,nm:"Vermittlungsschicht",ex:"IP, Routing",c:"#2a1a0f",b:"#f97316"},{n:2,nm:"Sicherungsschicht",ex:"MAC, Switches",c:"#2a1f0a",b:"#fbbf24"},{n:1,nm:"Bitübertragungsschicht",ex:"Kabel, Signale",c:"#2a0f1a",b:"#f472b6"}].map((l,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:l.c,border:`0.5px solid ${l.b}`,borderRadius:8,padding:"8px 12px",marginBottom:4}}>
        <span style={{width:22,height:22,borderRadius:"50%",background:l.b,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{l.n}</span>
        <span style={{flex:1}}><span style={{display:"block",fontSize:13,fontWeight:600,color:C.t}}>{l.nm}</span><span style={{fontSize:11,color:C.t2}}>{l.ex}</span></span>
        <span style={{fontSize:11,color:l.b,fontWeight:500}}>{["Application","Presentation","Session","Transport","Network","Data Link","Physical"][i]}</span>
      </div>
    ))}
  </div>
);

const Quiz=({qs,onDone,title})=>{
  const [i,setI]=useState(0);const [sel,setSel]=useState(null);const [sc,setSc]=useState(0);const [done,setDone]=useState(false);
  const [nachweisBusy,setNachweisBusy]=useState(false);
  const [startedAt,setStartedAt]=useState(()=>new Date());
  const {user}=useAuth();
  const q=qs[i];const ans=sel!==null;
  const pick=idx=>{if(ans)return;setSel(idx);if(idx===q.c)setSc(s=>s+1);};
  const next=()=>{if(i===qs.length-1){setDone(true);return;}setI(x=>x+1);setSel(null);};
  const pct=Math.round((sc/qs.length)*100);
  const downloadNachweis=async()=>{
    setNachweisBusy(true);
    await generateLernnachweis({user,kind:"modul",title,score:sc,total:qs.length,topics:[{name:title,correct:sc,total:qs.length}],startedAt,finishedAt:new Date()});
    setNachweisBusy(false);
  };
  if(done)return(
    <div style={{textAlign:"center",padding:"10px 0"}}>
      <div style={{fontSize:48,marginBottom:12}}>{pct>=80?"🎯":pct>=60?"👍":"💪"}</div>
      <h3 style={{fontSize:20,fontWeight:700,marginBottom:6}}>{pct>=80?"Sehr gut!":pct>=60?"Gut gemacht!":"Weiter üben!"}</h3>
      <p style={{fontSize:14,color:C.t2,marginBottom:16}}>{sc} von {qs.length} richtig — {pct}%</p>
      <div style={{height:8,background:C.s2,borderRadius:4,overflow:"hidden",marginBottom:20}}>
        <div style={{height:"100%",width:`${pct}%`,background:pct>=80?C.gr:pct>=60?C.am:"#ef4444",borderRadius:4}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:user&&pct>=50?12:0}}>
        <button onClick={()=>{setI(0);setSel(null);setSc(0);setDone(false);setStartedAt(new Date());}} style={{...ghost}}>🔄 Nochmal</button>
        <button onClick={onDone} style={{...pri}}>✓ Übersicht</button>
      </div>
      {user&&pct>=50&&<button onClick={downloadNachweis} disabled={nachweisBusy} style={{...ghost,width:"100%",justifyContent:"center",opacity:nachweisBusy?.6:1}}>{nachweisBusy?"Wird erstellt...":"📄 Lernnachweis herunterladen"}</button>}
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12,color:C.mu}}>Frage {i+1} / {qs.length}</span><span style={{fontSize:12,color:C.t2}}>{sc} richtig</span></div>
      <div style={{height:3,background:C.s2,borderRadius:2,overflow:"hidden",marginBottom:16}}><div style={{height:"100%",width:`${(i/qs.length)*100}%`,background:`linear-gradient(90deg,${C.bl},${C.cy})`,borderRadius:2}}/></div>
      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}><p style={{fontSize:15,fontWeight:600,lineHeight:1.5,margin:0}}>{q.q}</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {q.o.map((opt,idx)=>{
          let bg=C.s2,bdr=C.bd,col=C.t;
          if(ans){if(idx===q.c){bg="#14532d";bdr="#22c55e";col="#86efac";}else if(idx===sel){bg="#450a0a";bdr="#ef4444";col="#fca5a5";}}
          return(<button key={idx} onClick={()=>pick(idx)} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",width:"100%",background:bg,border:`1px solid ${bdr}`,borderRadius:10,padding:"11px 14px",cursor:ans?"default":"pointer",color:col,fontFamily:"inherit",transition:"all .15s"}}>
            <span style={{width:24,height:24,borderRadius:"50%",background:ans&&idx===q.c?"#22c55e":ans&&idx===sel?"#ef4444":C.bd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0,color:"#fff"}}>{ans&&idx===q.c?"✓":ans&&idx===sel?"✗":["A","B","C","D"][idx]}</span>
            <span style={{fontSize:14,lineHeight:1.4}}>{opt}</span>
          </button>);
        })}
      </div>
      {ans&&<><div style={{background:sel===q.c?"#052e16":"#1c0a0a",border:`0.5px solid ${sel===q.c?"#22c55e":"#ef4444"}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
        <p style={{fontSize:13,color:sel===q.c?"#86efac":"#fca5a5",lineHeight:1.6,margin:0}}><span style={{fontWeight:600}}>{sel===q.c?"✓ Richtig! ":"✗ Leider falsch. "}</span>{q.e}</p>
      </div>
      <button onClick={next} style={{...pri,width:"100%",justifyContent:"center"}}>{i===qs.length-1?"Ergebnis →":"Nächste Frage →"}</button></>}
    </div>
  );
};

const AIChat=({ctx,q1,q2,moduleId})=>{
  const [q,setQ]=useState("");const [a,setA]=useState("");
  const ask=async(question)=>{
    if(!question.trim())return;
    setA("Wird geladen...");
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){setA("Bitte melde dich an, um die KI zu nutzen.");return;}
      const r=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({ctx,question,moduleId})});
      const d=await r.json();
      if(!r.ok){setA(d.error||`Fehler (${r.status}).`);return;}
      setA(d.answer||"Keine Antwort.");
    }catch(e){setA(`Verbindung fehlgeschlagen.`);}
  };
  return(
    <div style={{borderTop:`0.5px solid ${C.bd}`,paddingTop:14}}>
      <p style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Frag nach</p>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
        {[q1,q2].map((qi,i)=>(<button key={i} onClick={()=>{setQ(qi);ask(qi);}} style={{...ghost,textAlign:"left",fontSize:13,padding:"8px 12px",width:"100%"}}>{qi}</button>))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)} placeholder="Eigene Frage..." style={{flex:1,background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>ask(q)} style={{...pri,padding:"10px 14px",flexShrink:0}}>→</button>
      </div>
      {a&&<div style={{marginTop:10,background:"#0f2744",border:`0.5px solid ${C.bl}`,borderRadius:10,padding:12}}><p style={{fontSize:14,color:"#93c5fd",lineHeight:1.6,margin:0}}>{a}</p></div>}
    </div>
  );
};

const Pips=({items,cur,done,go,topicLimit})=>(
  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
    {items.map((it,i)=>{
      const locked=topicLimit!=null&&it.n>topicLimit;
      return(<button key={i} onClick={()=>go(i)} style={{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${i===cur?"#38bdf8":"#2d3f5a"}`,background:i===cur?"#0f2744":done.has(it.n)?"#14532d":C.s1,color:i===cur?"#38bdf8":done.has(it.n)?"#86efac":"#475569",fontSize:locked?11:12,fontWeight:600,cursor:"pointer"}}>{locked?"🔒":it.n}</button>);
    })}
  </div>
);

const Hdr=({back})=>(
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
    <Logo sz={28}/><span style={{fontSize:18,fontWeight:700}}>IT-Dart</span>
    <button onClick={back} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Übersicht</button>
  </div>
);

const OSIBezug=({text})=>(
  <div style={{background:"#0f2744",border:`0.5px solid ${C.bl}`,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"flex-start"}}>
    <span style={{fontSize:16,flexShrink:0}}>🌐</span>
    <div><p style={{fontSize:11,fontWeight:600,color:C.cy,marginBottom:3,textTransform:"uppercase",letterSpacing:".05em"}}>OSI-Bezug</p>
    <p style={{fontSize:13,color:"#93c5fd",lineHeight:1.6,margin:0}}>{text}</p></div>
  </div>
);


const SK=[
  {n:1,nm:"Was ist Skripting?",osi:"Kein direkter OSI-Bezug — aber Skripte können alle Schichten ansprechen: Ping (Schicht 3), Portprüfung (Schicht 4), HTTP-Requests (Schicht 7).",
   th:"Ein Skript ist eine Abfolge von Befehlen die automatisch ausgeführt wird. Statt jeden Befehl manuell einzutippen schreibt man ihn einmal auf — und lässt ihn beliebig oft laufen. Der Unterschied zu einem Programm: Skripte werden interpretiert (Zeile für Zeile ausgeführt), Programme werden kompiliert (in Maschinencode übersetzt).",
   pc:"Der IT-Techniker muss täglich prüfen ob auf 50 Servern bestimmte Dienste laufen. Manuell: 2 Stunden. Mit einem Skript: 2 Minuten — und er bekommt sofort eine Liste welche Server Probleme haben.",
   q1:"Was ist der Unterschied zwischen einem Skript und einem kompilierten Programm?",q2:"Wann lohnt es sich etwas zu automatisieren statt es manuell zu machen?"},
  {n:2,nm:"PowerShell Grundlagen",osi:"PowerShell kann direkt mit Netzwerkschichten kommunizieren: Test-NetConnection prüft Schicht 3/4, Invoke-WebRequest arbeitet auf Schicht 7.",
   th:"PowerShell ist Microsofts moderne Shell und Skriptsprache. Das Besondere: PowerShell gibt Objekte zurück, nicht nur Text. Get-Service gibt kein Text zurück — sondern ein Objekt mit Eigenschaften wie Name, Status, StartType. Diese Objekte kann man direkt weiterverarbeiten, filtern und sortieren.",
   pc:"Der Techniker tippt Get-Service | Where-Object {$_.Status -eq 'Stopped'} — und bekommt sofort alle gestoppten Dienste als strukturierte Liste, nicht als unleserlichen Textblock.",
   q1:"Warum ist es ein Vorteil dass PowerShell Objekte statt Text zurückgibt?",q2:"Was macht die Pipeline (|) in PowerShell?"},
  {n:3,nm:"PowerShell Praxis",osi:"Mit PowerShell kann man Netzwerkprobleme debuggen: Test-NetConnection -ComputerName server01 -Port 443 prüft ob Schicht 4 (Port) erreichbar ist.",
   th:"PowerShell-Skripte nutzen Variablen ($name = 'Wert'), Schleifen (foreach, for, while) und Bedingungen (if/else). Skripte werden als .ps1 Datei gespeichert und mit .\\skript.ps1 ausgeführt. Mit Write-Host gibt man Text aus.",
   pc:"Das Monitoring-Skript: foreach ($server in $server_liste) { if ((Get-Service -ComputerName $server -Name 'Spooler').Status -ne 'Running') { Write-Host 'ALARM: Dienst gestoppt!' }}",
   q1:"Was ist der Unterschied zwischen einer foreach- und einer while-Schleife?",q2:"Wie führt man ein PowerShell-Skript aus?"},
  {n:4,nm:"Bash Grundlagen",osi:"Bash-Skripte auf Linux-Servern verwalten oft Netzwerkdienste: systemctl restart nginx startet einen Webserver auf Schicht 7 neu.",
   th:"Bash ist die Standard-Shell auf Linux- und macOS-Systemen. Grundlegende Befehle: ls (Verzeichnisinhalt), cd (Wechseln), cp/mv/rm (Dateien), grep (suchen), | (Pipeline). Variablen ohne $-Zeichen setzen (name='Wert'), mit $-Zeichen nutzen (echo $name).",
   pc:"Auf dem Linux-Webserver: ps aux | grep nginx prüft ob nginx läuft. Ein Bash-Skript prüft das automatisch jede Minute und startet den Dienst neu falls er gestoppt ist.",
   q1:"Was ist der Hauptunterschied zwischen PowerShell und Bash?",q2:"Was macht der Befehl grep in Linux?"},
  {n:5,nm:"Aufgaben automatisieren",osi:"Automatisierte Aufgaben überwachen Netzwerkdienste auf allen Schichten — von Ping (Schicht 3) bis HTTP-Statuscode (Schicht 7).",
   th:"Unter Windows plant man wiederkehrende Skripte mit dem Task Scheduler. Unter Linux nutzt man Cron. Ein Cronjob '0 6 * * *' läuft täglich um 6 Uhr. '*/5 * * * *' läuft alle 5 Minuten. So laufen Backups, Monitoring und Bereinigungen automatisch.",
   pc:"Der Techniker erstellt einen Cronjob: '*/5 * * * * /home/admin/check_services.sh' — das Monitoring-Skript läuft jetzt alle 5 Minuten und schickt eine E-Mail wenn ein Dienst ausfällt.",
   q1:"Was ist der Unterschied zwischen Task Scheduler und Cron?",q2:"Was bedeutet '0 2 * * *' in einem Cronjob?"},
  {n:6,nm:"Monitoring-Skript",osi:"Das fertige Skript arbeitet auf mehreren Schichten: Test-Connection (Schicht 3), Test-NetConnection -Port (Schicht 4), Invoke-WebRequest (Schicht 7).",
   th:"Ein vollständiges Monitoring-Skript prüft: Ist der Server erreichbar (Ping)? Sind die wichtigen Ports offen (80, 443)? Laufen die kritischen Dienste? Bei Problemen: Log-Eintrag schreiben und E-Mail senden. So erfährt die IT von einem Ausfall bevor der Nutzer anruft.",
   pc:"Das fertige Skript läuft jede Nacht um 3 Uhr, prüft alle 50 Server, schreibt ein Protokoll und schickt dem IT-Leiter eine Zusammenfassung per E-Mail. Entwicklungszeit: 2 Stunden. Tagesersparnis: 2 Stunden.",
   q1:"Welche drei Ebenen sollte ein gutes Monitoring-Skript prüfen?",q2:"Wie schickt man aus PowerShell eine E-Mail?"},
];
const SKQ=[
  {q:"Was ist der Hauptunterschied zwischen Skript und kompiliertem Programm?",o:["Skripte sind in jedem Fall grundsätzlich schneller","Skripte werden interpretiert, Programme in Maschinencode kompiliert","Kompilierte Programme sind grundsätzlich einfacher zu schreiben","Skripte laufen grundsätzlich ausschließlich unter Windows"],c:1,e:"Skripte werden Zeile für Zeile zur Laufzeit interpretiert. Kompilierte Programme werden vorher in Maschinencode übersetzt — schneller aber weniger flexibel."},
  {q:"Was ist das Besondere an PowerShell gegenüber anderen Shells?",o:["PowerShell ist kostenlos","PowerShell gibt Objekte statt nur Text zurück","PowerShell läuft nur auf Windows Server","PowerShell braucht keine Installation"],c:1,e:"PowerShell gibt strukturierte Objekte zurück die man direkt weiterverarbeiten kann. Andere Shells geben nur Text zurück den man erst parsen müsste."},
  {q:"Was macht Get-Service | Where-Object {$_.Status -eq Running}?",o:["Startet alle Dienste","Stoppt laufende Dienste","Zeigt alle laufenden Dienste","Installiert einen neuen Dienst"],c:2,e:"Get-Service holt alle Dienste als Objekte, die Pipeline gibt sie an Where-Object weiter das nur Dienste mit Status Running durchlässt."},
  {q:"Was ist ein Cronjob unter Linux?",o:["Ein Prozess, der dauerhaft im Hintergrund läuft","Eine automatisch geplante Aufgabe die zu bestimmten Zeiten läuft","Ein spezielles Werkzeug zur Erstellung von Backups","Ein Benutzerkonto mit erweiterten Administratorrechten"],c:1,e:"Cron ist ein Zeitplaner unter Linux. Cronjobs legen fest wann Skripte oder Befehle automatisch ausgeführt werden."},
  {q:"Was bedeutet '*/5 * * * *' in einem Cronjob?",o:["Jeden 5. des Monats","Alle 5 Stunden","Alle 5 Minuten","5 Mal am Tag"],c:2,e:"Das erste Feld steht für Minuten. */5 bedeutet alle 5 Minuten. Die anderen * stehen für jede Stunde, jeden Tag, jeden Monat, jeden Wochentag."},
  {q:"Was bewirkt die Pipe | in PowerShell und Bash?",o:["Sie kommentiert die komplette Zeile im gesamten Skript vollständig aus","Sie reicht die Ausgabe eines Befehls als Eingabe an den nächsten weiter","Sie führt denselben Befehl grundsätzlich zweimal direkt hintereinander aus","Sie bricht die Ausführung des gesamten Skripts grundsätzlich sofort ab"],c:1,e:"Die Pipe verbindet Befehle zu einer Kette – in PowerShell fließen dabei Objekte, in Bash Text."},
  {q:"Wozu dient eine foreach-Schleife?",o:["Einen Codeblock für jedes Element einer Liste ausführen","Auftretende Fehler während der Ausführung abfangen","Nicht mehr benötigte Dateien vom System löschen","Neue Variablen für das Skript definieren"],c:0,e:"foreach wiederholt den Codeblock für jedes Element – z.B. denselben Check nacheinander für 50 Server."},
  {q:"Was macht grep unter Linux?",o:["Dateien von einem Ort zum anderen kopieren","Textzeilen nach einem Muster filtern","Laufende Prozesse gezielt und sofort beenden","Zugriffsrechte einer Datei gezielt ändern"],c:1,e:"grep durchsucht Text zeilenweise nach Mustern – klassisches Beispiel: ps aux | grep nginx."},
  {q:"Welches Windows-Werkzeug entspricht dem Linux-Cron?",o:["Der Task-Manager zur Prozessübersicht","Aufgabenplanung (Task Scheduler)","Die Ereignisanzeige zur Protokollauswertung","Der Explorer zur Dateiverwaltung"],c:1,e:"Die Aufgabenplanung startet Programme und Skripte zeitgesteuert – das Windows-Pendant zum Cron-Daemon."},
  {q:"Was ist eine Variable in einem Skript?",o:["Ein fest einprogrammierter Befehl","Ein benannter Speicherplatz für Werte","Eine einzelne gespeicherte Datei","Ein reiner Kommentar ohne Funktion"],c:1,e:"Variablen wie $server speichern Werte, die das Skript mehrfach verwendet oder unterwegs verändert."},
];

const PR=[
  {n:1,nm:"Unternehmensstrukturen &amp; Rollen",osi:"IT-Abteilungen sind oft nach OSI-Schichten organisiert: Helpdesk (Schicht 1-3), Netzwerkteam (Schicht 2-4), Anwendungsbetrieb (Schicht 7).",
   th:"Ein Unternehmen ist in Abteilungen organisiert — dargestellt im Organigramm. Der IT-Betrieb hat typische Rollen: Helpdesk (1st Level), Systemadministrator (2nd Level), Netzwerkingenieur (3rd Level). Vollmachten regeln wer was entscheiden darf.",
   pc:"Der neue Azubi fragt: Wer darf einen Server neu starten? Typisch: Helpdesk darf Dienste neustarten, Admins dürfen Server neustarten, nur der IT-Leiter darf produktive Systeme außer Betrieb nehmen.",
   q1:"Was ist der Unterschied zwischen 1st, 2nd und 3rd Level Support?",q2:"Was ist ein Organigramm und wozu braucht man es?"},
  {n:2,nm:"Kundenkommunikation &amp; Bedarfsanalyse",osi:"Kein direkter OSI-Bezug — aber Kommunikation ist Schicht 8: der Mensch. Technische Lösungen scheitern oft nicht an der Technik sondern an der Kommunikation.",
   th:"Eine Bedarfsanalyse klärt: Was braucht der Kunde wirklich? Was hat er bisher (IST)? Was soll besser werden (SOLL)? Erst verstehen, dann lösen. Adressatengerechte Kommunikation bedeutet: dem IT-Laien anders erklären als dem Entwickler.",
   pc:"Der Kunde sagt: Das Internet ist langsam. Das bedeutet nicht unbedingt ein Netzwerkproblem — es könnte der Browser, der Server, WLAN oder die Leitung sein. Erst fragen, dann messen, dann lösen.",
   q1:"Was ist eine Bedarfsanalyse und warum ist sie wichtig?",q2:"Wie erklärt man einem IT-Laien was ein DNS-Server macht?"},
  {n:3,nm:"Ticketsystem &amp; SLA",osi:"Gute Tickets dokumentieren auf welcher OSI-Schicht das Problem liegt: physisches Kabel (Schicht 1), VLAN (Schicht 2), Routing (Schicht 3), Port blockiert (Schicht 4).",
   th:"Ein Ticketsystem dokumentiert alle Anfragen. Jedes Ticket bekommt eine Priorität: kritisch (System ausgefallen), hoch (viele Nutzer betroffen), normal, niedrig. Ein SLA legt fest wie schnell reagiert werden muss — z.B. kritische Tickets innerhalb 1 Stunde.",
   pc:"Helpdesk bekommt: Drucker druckt nicht → Prio normal, SLA 4 Stunden. Dann: Mailserver ausgefallen → Prio kritisch, SLA 1 Stunde — alle anderen Tickets werden zurückgestellt.",
   q1:"Was ist ein SLA und was passiert wenn er nicht eingehalten wird?",q2:"Welche Informationen sollte ein gutes Ticket enthalten?"},
  {n:4,nm:"Projektmanagement Grundlagen",osi:"IT-Projekte haben technische Abhängigkeiten die an OSI-Schichten hängen: erst Netzwerk (Schicht 1-3), dann Server (Schicht 4-7), dann Anwendung.",
   th:"Ein IT-Projekt folgt Phasen: Initiierung (Was soll gemacht werden?), Planung (Wie, wann, mit wem?), Durchführung, Abschluss (Übergabe, Dokumentation). Wichtige Werkzeuge: Projektplan mit Aufgaben und Terminen, Meilensteine als Zwischenziele, Risikoanalyse.",
   pc:"Auftrag: 20 neue Arbeitsplätze bis Ende des Monats. Der Techniker plant: Woche 1 Hardware, Woche 2 Netzwerk, Woche 3 Betriebssysteme, Woche 4 Software und Benutzer, dann Abnahme.",
   q1:"Was sind die typischen Phasen eines IT-Projekts?",q2:"Was ist ein Meilenstein im Projektplan?"},
  {n:5,nm:"Qualitätssicherung &amp; Dokumentation",osi:"Gute Netzwerkdokumentation enthält alle OSI-Schichten: Verkabelung (1), VLANs (2), IP-Adressen (3), Port-Freigaben (4), Dienste (7).",
   th:"Qualitätssicherung prüft ob das Ergebnis den Anforderungen entspricht: Soll-Ist-Vergleich, Tests, Abnahmeprotokoll. Dokumentation hält fest was gebaut wurde: Netzwerkpläne, Konfigurationen, Handbücher. Schlechte Dokumentation bedeutet: der nächste Techniker weiß nicht was du gemacht hast.",
   pc:"Nach dem Einrichten der 20 Arbeitsplätze erstellt der Techniker ein Abnahmeprotokoll: Alle PCs eingeschaltet? Netzwerk verbunden? Drucker erreichbar? Software installiert? Benutzer können sich anmelden? Der Kunde unterschreibt — Projekt abgeschlossen.",
   q1:"Was ist ein Abnahmeprotokoll und warum ist es wichtig?",q2:"Welche Informationen gehören in eine Netzwerkdokumentation?"},
  {n:6,nm:"Arbeitsrecht &amp; Ausbildung",osi:"Kein direkter OSI-Bezug — aber DSGVO und IT-Sicherheitsrichtlinien sind rechtliche Rahmenbedingungen für den IT-Betrieb auf allen Ebenen.",
   th:"Als Azubi gelten besondere Regeln: Berufsbildungsgesetz (BBiG), Ausbildungsvertrag. Du hast Rechte (Urlaub, Vergütung) und Pflichten (Lernpflicht, Schweigepflicht). Die IHK-Prüfung besteht aus Teil 1 (nach 18 Monaten) und Teil 2 (nach 3 Jahren) plus betrieblichem Projekt.",
   pc:"Der Azubi fragt: Darf ich Kundendaten mit nach Hause nehmen? Nein — Schweigepflicht und DSGVO verbieten das. Selbst intern darf er Daten nur für den jeweiligen Arbeitsauftrag nutzen.",
   q1:"Was ist der Unterschied zwischen AP1 und AP2 der IHK-Prüfung?",q2:"Was bedeutet Schweigepflicht im IT-Betrieb?"},
];
const PRQ=[
  {q:"Was ist der Unterschied zwischen 1st und 2nd Level Support?",o:["1st Level ist in jedem Fall grundsätzlich immer teurer im laufenden Betrieb","1st Level löst einfache Probleme direkt, 2nd Level übernimmt komplexere Fälle","2nd Level verfügt grundsätzlich und in jedem Fall über weniger Erfahrung","1st Level darf grundsätzlich und unter keinen Umständen Tickets erstellen"],c:1,e:"1st Level (Helpdesk) nimmt Anfragen entgegen und löst einfache Probleme direkt. Was nicht lösbar ist wird an 2nd Level eskaliert — spezialisierte Admins mit mehr Rechten."},
  {q:"Was ist ein SLA?",o:["Ein reiner Lizenzvertrag für eingesetzte Software","Eine Vereinbarung über Reaktions- und Lösungszeiten bei Problemen","Ein offizielles Zertifikat für IT-Sicherheitsstandards","Ein detaillierter Plan zur regelmäßigen Datensicherung"],c:1,e:"Ein Service Level Agreement legt fest wie schnell auf Probleme reagiert werden muss. Kritische Störungen z.B. Reaktion innerhalb 1 Stunde, normale Anfragen innerhalb 24 Stunden."},
  {q:"Was ist eine Bedarfsanalyse?",o:["Eine rein technische Prüfung bestehender Systeme","Eine ausschließlich sicherheitsbezogene Analyse des Systems","Das Klären was der Kunde wirklich braucht bevor man eine Lösung anbietet","Ein formales Protokoll direkt nach Abschluss des Projekts"],c:2,e:"Erst verstehen, dann lösen. Die Bedarfsanalyse klärt IST-Zustand und SOLL-Zustand. Ohne Bedarfsanalyse löst man oft das falsche Problem."},
  {q:"Was enthält ein Abnahmeprotokoll?",o:["Den vollständigen Quellcode der gesamten entwickelten Software","Eine Bestätigung dass die Leistung den vereinbarten Anforderungen entspricht","Den detaillierten, vollständigen Stundennachweis des eingesetzten Technikers","Die offizielle, vollständige Rechnung für die erbrachte Dienstleistung"],c:1,e:"Das Abnahmeprotokoll bestätigt dass alle vereinbarten Leistungen erbracht wurden. Mit Unterschrift des Kunden ist das Projekt offiziell abgeschlossen."},
  {q:"Aus welchen Teilen besteht die IHK-Prüfung beim FISI?",o:["Ausschließlich einer einzigen schriftlichen Prüfung","AP1 nach 18 Monaten und AP2 nach 3 Jahren mit betrieblichem Projekt","Ausschließlich einem einzigen betrieblichen Projekt","Insgesamt drei getrennten schriftlichen Prüfungen"],c:1,e:"AP1 (nach ~18 Monaten): schriftliche Grundlagenprüfung. AP2 (nach 3 Jahren): betriebliches Projekt mit Dokumentation und Präsentation plus schriftliche Fachprüfung."},
  {q:"Was bedeutet Eskalation im Support?",o:["Den Kunden am Telefon grundsätzlich deutlich lauter ansprechen","Ein Ticket dokumentiert an die nächsthöhere Support-Ebene übergeben","Ein bereits bearbeitetes Ticket vollständig und unwiderruflich löschen","Die vereinbarte SLA-Zeit einfach eigenmächtig und ohne Rücksprache verlängern"],c:1,e:"Kann der 1st Level nicht lösen, geht das Ticket mit allen bisherigen Erkenntnissen an den 2nd oder 3rd Level."},
  {q:"Wann findet die Abschlussprüfung Teil 1 (AP1) statt?",o:["Am Ende der Ausbildung","Nach etwa 18 Monaten","In der Probezeit","Nach dem ersten Monat"],c:1,e:"Die AP1 liegt etwa zur Mitte der Ausbildung (ca. 18. Monat) und zählt bereits 20 % der Gesamtnote."},
  {q:"Wozu dient ein Gantt-Diagramm?",o:["Ausschließlich technische Netzwerkpläne zeichnen","Die zeitliche Planung von Projektaufgaben visualisieren","Ausschließlich anfallende Kosten abrechnen","Ausschließlich aufgetretene Fehler protokollieren"],c:1,e:"Ein Gantt-Diagramm zeigt Aufgaben als Balken auf der Zeitachse – inklusive Reihenfolge und Meilensteinen."},
  {q:"Welche Pflichten hat ein Azubi nach dem BBiG?",o:["Grundsätzlich Überstunden ohne jeglichen Ausgleich leisten","Lernen, sorgfältig arbeiten und Betriebsgeheimnisse wahren","Eigenständig neue Kunden für den Betrieb akquirieren","Keine — ausschließlich der Betrieb hat jegliche Pflichten"],c:1,e:"Das BBiG verpflichtet unter anderem zum Lernen, zur Sorgfalt, zum Führen des Berichtshefts und zur Verschwiegenheit."},
  {q:"Warum steht die IST-Analyse am Anfang jedes Projekts?",o:["Ausschließlich um wertvolle Zeit im Projekt zu gewinnen","Um den tatsächlichen Zustand zu erfassen, bevor Lösungen geplant werden","Weil es gesetzlich in jedem Fall zwingend vorgeschrieben ist","Ausschließlich um die Projektkosten künstlich zu erhöhen"],c:1,e:"Ohne sauberes IST kein sinnvolles SOLL: Erst verstehen, was vorhanden ist und wo es klemmt – dann lösen."},
];

const DATA={g:{items:G,quiz:GQ,title:"Grundlagen IT &amp; Hardware",intro:"Bevor Netzwerke, Server oder Betriebssysteme Sinn ergeben, musst du verstehen was ein Computer überhaupt ist. Wir starten bei null — mit dem, was jeder IT-Techniker am ersten Tag wissen muss.",case:"💼",caseTitle:"Neuer PC im Büro — von der Lieferung bis zum ersten Login"},o:{items:O,quiz:OQ,title:"Netzwerktechnik",intro:"Das OSI-Modell ist das Grundgerüst der gesamten Netzwerktechnik. Du wirst es in jedem weiteren Modul wiedersehen — hier lernst du die 7 Schichten als solides Fundament, anhand eines echten Netzwerkausfalls.",case:"🔌",caseTitle:"Netzwerkausfall — Techniker geht alle 7 Schichten durch"},b:{items:B,quiz:BQ,title:"Betriebssysteme &amp; Server",intro:"Das Betriebssystem ist die unsichtbare Schaltzentrale jedes Computers. Ohne OS läuft keine Anwendung, kein Dienst, kein Netzwerk. Wir begleiten einen Techniker beim Einrichten eines frisch installierten Windows-Servers.",case:"🖥️",caseTitle:"Windows Server im Einsatz — vom ersten Start bis zur fertigen Konfiguration"},si:{items:SI,quiz:SIQ,title:"IT-Sicherheit",intro:"IT-Sicherheit ist kein Produkt das man kauft — es ist ein Prozess. Die meisten Angriffe nutzen keine technischen Lücken, sondern menschliche. Wir begleiten einen IT-Betrieb nach einem echten Sicherheitsvorfall.",case:"🎣",caseTitle:"Phishing-Vorfall — was passiert, wie reagiert die IT, was hätte es verhindert?"},db:{items:DB,quiz:DBQ,title:"Datenbanken &amp; Daten",intro:"Fast jede Software die wir kennen steckt dahinter eine Datenbank. Von der einfachen Kundenliste bis zur komplexen API-Anbindung — Daten sind das Herzstück moderner IT-Systeme.",case:"🏢",caseTitle:"Neue Kundenverwaltung — von der Datenbankstruktur bis zur API-Anbindung",intro:"Fast jede Software die wir kennen steckt dahinter eine Datenbank. Von der einfachen Kundenliste bis zur komplexen API-Anbindung — Daten sind das Herzstück moderner IT-Systeme."},sk:{items:SK,quiz:SKQ,title:"Skripting &amp; Automatisierung",case:"💻",caseTitle:"50 Server täglich prüfen — manuell 2 Stunden, mit Skript 2 Minuten",intro:"Wer Aufgaben automatisiert spart Zeit, vermeidet Fehler und kann sich auf das Wesentliche konzentrieren. Wir begleiten einen Techniker der ein Monitoring-System für 50 Server aufbaut."},pr:{items:PR,quiz:PRQ,title:"Beruf &amp; Projekt",case:"👥",caseTitle:"IT-Projekt von der Bedarfsanalyse bis zur Abnahme",intro:"IT ist mehr als Technik — Kommunikation, Organisation und Recht sind genauso wichtig. Wir begleiten einen Azubi durch ein komplettes IT-Projekt."}};

export default function ITDart({onOpenExam,onOpenLegal}){
  const [view,setView]=useState("cover");
  const [mod,setMod]=useState(null);
  const [idx,setIdx]=useState(0);
  const [phase,setPhase]=useState("intro"); // intro|learn|quiz
  const [done,setDone]=useState({});
  const {user,isPremium,isAdmin,isTrainer,signOut}=useAuth();
  const hydratedFor=useRef(null); // user.id once progress has been loaded from Supabase

  useEffect(()=>{
    hydratedFor.current=null;
    if(!user){setDone({});return;}
    let cancelled=false;
    supabase.from("progress").select("data").eq("user_id",user.id).single()
      .then(({data})=>{
        if(cancelled)return;
        const loaded=data?.data||{};
        setDone(Object.fromEntries(Object.entries(loaded).map(([k,v])=>[k,new Set(v)])));
        hydratedFor.current=user.id;
      });
    return ()=>{cancelled=true;};
  },[user?.id]);

  useEffect(()=>{
    if(!user||hydratedFor.current!==user.id)return;
    const plain=Object.fromEntries(Object.entries(done).map(([k,v])=>[k,[...v]]));
    const t=setTimeout(()=>{
      supabase.from("progress").upsert({user_id:user.id,data:plain,updated_at:new Date().toISOString()}).then(()=>{});
    },600);
    return ()=>clearTimeout(t);
  },[done,user?.id]);

  const mark=(mid,n)=>setDone(d=>({...d,[mid]:new Set([...(d[mid]||[]),n])}));
  const doneFor=mid=>(done[mid]||new Set());
  const totalDone=Object.values(done).reduce((s,v)=>s+v.size,0);
  const totalItems=6+7+6+7+6+6+6;

  const isFreeMod=m=>FREE_MODULE_IDS.includes(m.id);
  const canOpen=m=>isFreeMod(m)||isPremium;

  const openMod=m=>{
    if(!canOpen(m)){setMod(m);setView("locked");return;}
    setMod(m);setIdx(0);setPhase(doneFor(m.id).size>0?"learn":"intro");setView("mod");
  };

  if(view==="auth")return <AuthScreen onClose={()=>setView("overview")}/>;
  if(view==="admin")return isAdmin?<AdminScreen onClose={()=>setView("overview")}/>:null;
  if(view==="delete-account")return <DeleteAccountScreen onClose={()=>setView("overview")}/>;
  if(view==="statistik")return <StatistikScreen onClose={()=>setView("overview")}/>;
  if(view==="trainer")return isTrainer?<TrainerScreen onClose={()=>setView("overview")}/>:null;

  if(view==="locked"&&mod)return(
    <div style={wrap}><div style={{...inner,textAlign:"center",paddingTop:40}}>
      <button onClick={()=>setView("overview")} style={{...ghost,marginBottom:24}}>← Übersicht</button>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}} dangerouslySetInnerHTML={{__html:mod.t}}/>
      {!user?(<>
        <p style={{fontSize:14,color:C.t2,marginBottom:20,lineHeight:1.6}}>Dieses Modul ist Teil von IT-Dart Premium. Melde dich zuerst an, um deinen Zugang zu sehen.</p>
        <button onClick={()=>setView("auth")} style={{...pri,width:"100%",justifyContent:"center"}}>Anmelden / Registrieren →</button>
      </>):(<>
        <p style={{fontSize:14,color:C.t2,marginBottom:20,lineHeight:1.6}}>Dieses Modul ist Teil von IT-Dart Premium. Dein Konto ({user.email}) hat noch keinen Premium-Zugang.</p>
        <p style={{fontSize:13,color:C.mu}}>Melde dich bei uns, um Premium freizuschalten.</p>
      </>)}
    </div></div>
  );

  if(view==="cover")return(
    <div style={wrap}><div style={{...inner,textAlign:"center",paddingTop:40,paddingBottom:40}}>
      <Logo sz={72}/>
      <h1 style={{fontSize:28,fontWeight:700,marginTop:20,marginBottom:8}}>IT-Dart – Bleib am Dart!</h1>
      <img src={coverImg} alt="IT-Dart" style={{width:"100%",maxWidth:340,borderRadius:14,margin:"16px auto",display:"block",boxShadow:"0 8px 32px rgba(37,99,235,0.25)"}}/>
      <p style={{fontSize:14,color:C.cy,fontWeight:500,marginBottom:4}}>IT-Infrastruktur verstehen. Praxisorientiert lernen.</p><p style={{fontSize:12,color:C.mu,marginBottom:24}}>Ausgerichtet auf den Fachinformatiker für Systemintegration (FISI)</p>
      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"20px",marginBottom:24,textAlign:"left"}}>
        <p style={{fontSize:14,color:C.t2,lineHeight:1.8,margin:0}}>IT-Dart ist ein interaktiver Lernpfad für angehende Fachinformatiker und alle, die IT-Infrastruktur wirklich verstehen wollen. Kein Frontalunterricht — Theorie, Praxisfall und eine KI, die deine Fragen beantwortet.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {[{e:"⚙️",t:"7 Module, aufeinander aufbauend"},{e:"🔧",t:"Praxisfälle aus dem echten IT-Alltag"},{e:"🔗",t:"Alles hängt zusammen — du siehst wie"},{e:"🎯",t:"Quiz am Ende jedes Moduls"},{e:"🤖",t:"KI beantwortet deine Fragen live"}].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.s2,borderRadius:10,padding:"10px 14px"}}>
            <span style={{fontSize:20}}>{f.e}</span><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>setView("overview")} style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15}}>Lernpfad starten →</button>
      <div style={{marginTop:14,textAlign:"center"}}>
        {user?(
          <span style={{fontSize:12,color:C.mu}}>Angemeldet als {user.email} · <button onClick={signOut} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Abmelden</button></span>
        ):(
          <button onClick={()=>setView("auth")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Anmelden / Registrieren</button>
        )}
      </div>
      {onOpenLegal&&<div style={{marginTop:20,textAlign:"center",display:"flex",gap:14,justifyContent:"center"}}>
        <button onClick={()=>onOpenLegal("impressum")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Impressum</button>
        <button onClick={()=>onOpenLegal("datenschutz")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Datenschutz</button>
      </div>}
    </div></div>
  );

  if(view==="overview")return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,paddingBottom:20,borderBottom:`0.5px solid ${C.bd}`}}>
        <Logo sz={44}/>
        <div><div style={{fontSize:22,fontWeight:700,letterSpacing:"-.5px"}}>IT-Dart</div>
        <div style={{fontSize:12,color:C.cy,marginTop:2}}>Bleib am Dart!</div></div>
      </div>
      <div style={{textAlign:"right",marginBottom:16}}>
        {user?(
          <span style={{fontSize:12,color:C.mu}}>{user.email} {isPremium?"· ⭐ Premium":"· Free"} {isAdmin&&<>· <button onClick={()=>setView("admin")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>⚙️ Admin</button></>} {isTrainer&&<>· <button onClick={()=>setView("trainer")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>🎓 Trainer-Ansicht</button></>} · <button onClick={()=>setView("statistik")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>📊 Statistik</button> · <button onClick={signOut} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Abmelden</button> · <button onClick={()=>setView("delete-account")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Konto löschen</button></span>
        ):(
          <button onClick={()=>setView("auth")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Anmelden / Registrieren</button>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
        {MODS.map(m=>{
          const d=doneFor(m.id).size;
          const locked=m.r&&!canOpen(m);
          const preview=!locked&&!isPremium&&FREE_TOPIC_LIMITS[m.id]!=null;
          const sub=m.r&&m.n>0?`${d} von ${m.n} gesehen`:m.s;
          const badge=!m.r?"Bald":locked?"🔒 Premium":preview?`🔓 Vorschau (${FREE_TOPIC_LIMITS[m.id]}/${m.n})`:"Verfügbar";
          const badgeBg=!m.r?"#1e3a5f":locked?"#3a2a0f":preview?"#1e3a5f":"#14532d";
          const badgeCol=!m.r?"#93c5fd":locked?"#fbbf24":preview?"#93c5fd":"#86efac";
          return(<button key={m.id} onClick={()=>{if(m.r)openMod(m);}} style={{display:"flex",alignItems:"center",gap:12,textAlign:"left",width:"100%",background:m.r?"#1a2535":"#141e2e",border:`0.5px solid ${m.r?"#2d3f5a":"#1e2b3e"}`,borderRadius:10,padding:"12px 14px",cursor:m.r?"pointer":"default",color:"inherit",fontFamily:"inherit"}}>
            <span style={{fontSize:22,flexShrink:0}}>{m.e}</span>
            <span style={{flex:1}} dangerouslySetInnerHTML={{__html:`<span style="display:block;font-size:14px;font-weight:600;color:${m.r?C.t:"#475569"}">${m.t}</span><span style="display:block;font-size:12px;color:${m.r?"#64748b":"#334155"};margin-top:2px">${sub}</span>`}}/>
            <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:badgeBg,color:badgeCol,whiteSpace:"nowrap"}}>{badge}</span>
          </button>);
        })}
      </div>
      <div style={{paddingTop:16,borderTop:`0.5px solid ${C.bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:12,color:C.mu}}>Gesamtfortschritt</span>
          <span style={{fontSize:12,color:C.mu}}>{totalDone} / {totalItems} Schritten</span>
        </div>
        <div style={{height:4,background:C.s2,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.round((totalDone/totalItems)*100)}%`,background:`linear-gradient(90deg,${C.bl},${C.cy})`,borderRadius:2,transition:"width .4s"}}/>
        </div>
      </div>
      {onOpenExam&&<button onClick={onOpenExam} style={{...pri,width:"100%",justifyContent:"center",marginTop:20}}>🎯 Prüfungsvorbereitung →</button>}
      <div style={{textAlign:"center",marginTop:16}}>
        <button onClick={()=>setView("cover")} style={{background:"none",border:"none",color:C.mu,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>ℹ️ Über IT-Dart</button>
      </div>
    </div></div>
  );

  if(view==="mod"&&mod){
    const data=DATA[mod.id];
    if(!data)return(<div style={wrap}><div style={inner}><Hdr back={()=>setView("overview")}/><div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"2.5rem 1rem",textAlign:"center"}}><div style={{fontSize:36}}>{mod.e}</div><p style={{fontSize:16,fontWeight:600,margin:"12px 0 6px"}} dangerouslySetInnerHTML={{__html:mod.t}}/><p style={{fontSize:14,color:C.mu}}>Wird bald ausgearbeitet.</p><span style={{display:"inline-block",marginTop:10,fontSize:11,padding:"2px 8px",borderRadius:4,background:"#1e3a5f",color:"#93c5fd",fontWeight:500}}>Folgt bald</span></div></div></div>);
    if(phase==="intro")return(
      <div style={wrap}><div style={inner}>
        <Hdr back={()=>setView("overview")}/>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:C.cy,marginBottom:6}}>Modul {MODS.findIndex(m=>m.id===mod.id)+1} von {MODS.length}</p>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:10}} dangerouslySetInnerHTML={{__html:data.title}}/>
        {data.intro&&<p style={{fontSize:14,color:C.t2,lineHeight:1.7,marginBottom:20}}>{data.intro}</p>}
        {MODULE_IMAGES[mod.id]&&<img src={MODULE_IMAGES[mod.id]} alt={MODULE_IMAGE_ALT[mod.id]} style={{width:"100%",maxWidth:400,borderRadius:12,margin:"12px auto 16px",display:"block",boxShadow:"0 4px 20px rgba(37,99,235,0.3)"}}/>}
        {mod.id==="o"&&<OSIOverview/>}
        <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:24}}>{data.case}</span>
          <div><p style={{fontSize:13,fontWeight:600,marginBottom:2}}>Praxisfall</p><p style={{fontSize:13,color:C.mu}}>{data.caseTitle}</p></div>
        </div>
        <button onClick={()=>{mark(mod.id,1);setPhase("learn");}} style={{...pri,width:"100%",justifyContent:"center"}}>Lernpfad starten →</button>
      </div></div>
    );
    if(phase==="quiz")return(
      <div style={wrap}><div style={inner}>
        <Hdr back={()=>setView("overview")}/>
        <p style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:C.cy,marginBottom:6}}>Modul {MODS.findIndex(m=>m.id===mod.id)+1} · Quiz</p>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}} dangerouslySetInnerHTML={{__html:`${mod.e} ${data.title}`}}/>
        {!isPremium&&data.quiz.length>FREE_QUIZ_N&&<p style={{fontSize:13,color:C.mu,marginBottom:16}}>Kostenlose Vorschau: {FREE_QUIZ_N} von {data.quiz.length} Fragen. Mit Premium: alle Fragen.</p>}
        <Quiz qs={isPremium?data.quiz:data.quiz.slice(0,FREE_QUIZ_N)} onDone={()=>setView("overview")} title={data.title.replace(/&amp;/g,"&")}/>
      </div></div>
    );
    const item=data.items[idx];
    const topicLimit=isPremium?null:FREE_TOPIC_LIMITS[mod.id];
    const topicLocked=topicLimit!=null&&item.n>topicLimit;
    return(
      <div style={wrap}><div style={inner}>
        <Hdr back={()=>setView("overview")}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>setPhase("intro")} title="Zur Modul-Startseite" style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",padding:0,cursor:"pointer",fontSize:14,fontWeight:600,color:C.cy,fontFamily:"inherit",textAlign:"left"}}><span style={{fontSize:13}}>↩</span><span dangerouslySetInnerHTML={{__html:data.title}}/></button>
          <span style={{fontSize:12,color:C.mu}}>Thema {item.n} / {data.items.length}</span>
        </div>
        <Pips items={data.items} cur={idx} done={doneFor(mod.id)} topicLimit={topicLimit} go={i=>{setIdx(i);const n=data.items[i].n;if(topicLimit==null||n<=topicLimit)mark(mod.id,n);}}/>
        {topicLocked?(
          <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"32px 20px",textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:40,marginBottom:10}}>🔒</div>
            <p style={{fontSize:15,fontWeight:600,marginBottom:8}}>Ab hier geht's mit Premium weiter</p>
            <p style={{fontSize:13,color:C.t2,marginBottom:18,lineHeight:1.6}}>Die ersten {topicLimit} Themen von {data.title.replace(/&amp;/g,"&")} sind als Vorschau frei. Die restlichen {data.items.length-topicLimit} Themen sind Teil von IT-Dart Premium.</p>
            {!user?(
              <button onClick={()=>setView("auth")} style={{...pri,width:"100%",justifyContent:"center"}}>Anmelden / Registrieren →</button>
            ):(
              <p style={{fontSize:13,color:C.mu}}>Dein Konto ({user.email}) hat noch keinen Premium-Zugang.</p>
            )}
          </div>
        ):(<>
          <div style={{marginBottom:14}}><Scene mid={mod.id} n={item.n}/></div>
          <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"14px 16px",marginBottom:8}}>
            <p style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:C.cy,marginBottom:6}}>Theorie</p>
            <p style={{fontSize:15,fontWeight:600,marginBottom:6}} dangerouslySetInnerHTML={{__html:item.nm}}/>
            <p style={{fontSize:14,color:C.t2,lineHeight:1.7}}>{item.th}</p>
          </div>
          <div style={{background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"14px 16px",marginBottom:8}}>
            <p style={{fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:C.mu,marginBottom:6}}>{data.case} Praxisfall: {data.caseTitle}</p>
            <p style={{fontSize:14,color:C.t2,lineHeight:1.7}}>{item.pc}</p>
          </div>
          {item.osi&&<OSIBezug text={item.osi}/>}
        </>)}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          <button disabled={idx===0} onClick={()=>setIdx(i=>i-1)} style={{...ghost,flex:1,justifyContent:"center",opacity:idx===0?.45:1}}>← Zurück</button>
          {!topicLocked&&<button onClick={()=>{if(idx===data.items.length-1)setPhase("quiz");else{const ni=idx+1;setIdx(ni);const n=data.items[ni].n;if(topicLimit==null||n<=topicLimit)mark(mod.id,n);}}} style={{...pri,flex:1,justifyContent:"center"}}>
            {idx===data.items.length-1?"🎯 Zum Quiz →":"Weiter →"}
          </button>}
        </div>
        {!topicLocked&&<AIChat key={`${mod.id}-${item.n}`} ctx={`Thema "${item.nm}" aus dem ${data.title}-Modul. Theorie: ${item.th}`} q1={item.q1} q2={item.q2} moduleId={mod.id}/>}
      </div></div>
    );
  }
  return null;
}

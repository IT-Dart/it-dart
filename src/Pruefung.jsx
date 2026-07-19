import { useState, useMemo } from "react";
import { useAuth } from "./lib/AuthContext";
import { generateLernnachweis } from "./lib/lernnachweis";
import AuthScreen from "./AuthScreen";

const C={bg:"#f8fafc",s1:"#ffffff",s2:"#f1f5f9",bd:"#e2e8f0",bl:"#1d4ed8",cy:"#0ea5e9",t:"#0f172a",t2:"#475569",mu:"#94a3b8",gr:"#16a34a",am:"#d97706",co:"#dc2626"};
const ff="system-ui,sans-serif";
const wrap={background:C.bg,color:C.t,minHeight:"100vh",padding:"20px 16px 60px",fontFamily:ff};
const inner={maxWidth:540,margin:"0 auto"};

const PRUEFUNG=[
  {id:1,kat:"Grundlagen",q:"Ein Techniker soll erklären was der Unterschied zwischen RAM und Festplatte ist. Welche Aussage ist korrekt?",o:["RAM und Festplatte sind beide flüchtig","RAM ist schnell und flüchtig, die Festplatte ist langsam und dauerhaft","RAM ist langsam und dauerhaft, die Festplatte ist schnell und flüchtig","RAM und Festplatte sind beide dauerhaft"],c:1,e:"RAM (Arbeitsspeicher) ist sehr schnell, verliert aber alle Daten bei Stromausfall (flüchtig). Die Festplatte speichert dauerhaft, ist aber deutlich langsamer."},
  {id:2,kat:"Grundlagen",q:"Ein PC startet nicht und gibt Pieptöne aus. Auf welcher Ebene liegt das Problem?",o:["Betriebssystem","Anwendungssoftware","Hardware/BIOS (POST-Fehler)","Netzwerk"],c:2,e:"Pieptöne beim Start kommen vom BIOS/UEFI während des POST (Power-On Self-Test). Sie signalisieren einen Hardwarefehler bevor das Betriebssystem überhaupt lädt."},
  {id:3,kat:"Grundlagen",q:"Welche Speichereinheit ist die größte?",o:["Megabyte","Gigabyte","Kilobyte","Terabyte"],c:3,e:"Reihenfolge: Bit → Byte → Kilobyte → Megabyte → Gigabyte → Terabyte. Ein Terabyte entspricht ca. 1.000 Gigabyte."},
  {id:4,kat:"Grundlagen",q:"Was ist die Aufgabe des Mainboards?",o:["Grafik berechnen","Alle Komponenten verbinden und koordinieren","Daten dauerhaft speichern","Netzwerkverbindungen verwalten"],c:1,e:"Das Mainboard verbindet alle Komponenten: CPU, RAM, Festplatten, Grafikkarte und Peripheriegeräte. Es stellt Busse und Schnittstellen für die Kommunikation bereit."},
  {id:5,kat:"Grundlagen",q:"Ein PC ist sehr langsam und die Festplattenaktivitäts-LED leuchtet dauerhaft. Was ist die wahrscheinlichste Ursache?",o:["Zu wenig RAM — der PC lagert Daten auf die Festplatte aus","Die Festplatte ist defekt","Der Prozessor ist überhitzt","Das Betriebssystem ist veraltet"],c:0,e:"Wenn der RAM voll ist, lagert das Betriebssystem Daten auf die Festplatte aus (Swap). Da Festplatten viel langsamer als RAM sind, wird der PC deutlich langsamer."},
  {id:6,kat:"Grundlagen",q:"Was bedeutet die Hexadezimalzahl 'FF'?",o:["255 im Dezimalsystem","256 im Dezimalsystem","128 im Dezimalsystem","100 im Dezimalsystem"],c:0,e:"FF in Hexadezimal: F=15, also FF = 15×16 + 15 = 255. Hexadezimal wird u.a. für MAC-Adressen und Farben verwendet."},
  {id:7,kat:"Grundlagen",q:"Was ist der Unterschied zwischen UEFI und BIOS?",o:["UEFI ist nur für Linux","UEFI ist moderner, hat eine GUI und unterstützt größere Festplatten","BIOS ist schneller als UEFI","UEFI wird nicht mehr verwendet"],c:1,e:"UEFI ist der Nachfolger des BIOS. Es bietet eine grafische Oberfläche, unterstützt Festplatten über 2 TB und ermöglicht Secure Boot."},
  {id:8,kat:"Grundlagen",q:"Welchen Vorteil hat die SSD gegenüber einer HDD?",o:["Günstigerer Preis pro GB","Höhere Speicherkapazität","Keine beweglichen Teile — schneller und stoßunempfindlicher","Bessere Kompatibilität mit alten Systemen"],c:2,e:"SSDs nutzen Flash-Speicher ohne bewegliche Teile. Das macht sie schneller, leiser, stoßunempfindlicher und energieeffizienter."},
  {id:9,kat:"Grundlagen",q:"Welcher Anschluss verbindet einen Monitor mit einem PC?",o:["USB-A","RJ45","HDMI oder DisplayPort","SATA"],c:2,e:"HDMI und DisplayPort sind die gängigen Schnittstellen für Monitore. SATA ist für Festplatten, RJ45 für Netzwerkkabel."},
  {id:10,kat:"Grundlagen",q:"Was ist ein Treiber?",o:["Ein Programm zum Abspielen von Videos","Software die dem Betriebssystem ermöglicht mit einem Hardwaregerät zu kommunizieren","Ein Systemoptimierungs-Programm","Eine Art Firewall"],c:1,e:"Ein Treiber ist ein Programm das als Übersetzer zwischen Betriebssystem und Hardware funktioniert. Ohne Treiber kann das OS ein Gerät nicht nutzen."},
  {id:11,kat:"Grundlagen",q:"Wie viele Bit hat ein Byte?",o:["4","16","8","32"],c:2,e:"1 Byte = 8 Bit. Das ist die kleinste adressierbare Speichereinheit in modernen Computern."},
  {id:12,kat:"Grundlagen",q:"Was passiert in den ersten Sekunden nach dem Einschalten eines PCs?",o:["Der PC lädt Updates","BIOS/UEFI prüft Hardware (POST), dann lädt der Bootloader das Betriebssystem","Der Virenscanner scannt","Der PC verbindet sich mit dem Netzwerk"],c:1,e:"Beim Start: BIOS/UEFI startet → POST → Bootloader lädt → Betriebssystem-Kernel → Dienste → Desktop."},
  {id:13,kat:"Netzwerk & OSI",q:"Ein Benutzer kann keine Webseiten öffnen, Kollegen im selben Büro haben kein Problem. Was prüft der Techniker zuerst?",o:["Den Webserver im Internet","Die IP-Konfiguration des betroffenen PCs","Den Internetzugang des Unternehmens","Den DNS-Server"],c:1,e:"Da nur ein PC betroffen ist, liegt das Problem lokal. Zuerst IP-Konfiguration prüfen: Hat der PC eine IP? Stimmt Gateway und DNS?"},
  {id:14,kat:"Netzwerk & OSI",q:"Welche OSI-Schicht ist für die physische Übertragung von Bits zuständig?",o:["Schicht 2 – Data Link","Schicht 3 – Network","Schicht 1 – Physical","Schicht 4 – Transport"],c:2,e:"Schicht 1 (Physical) überträgt rohe Bits als elektrische Signale, Lichtsignale oder Funkwellen."},
  {id:15,kat:"Netzwerk & OSI",q:"Was ist der Unterschied zwischen Switch und Hub?",o:["Kein Unterschied","Switch leitet gezielt an den Empfänger weiter, Hub sendet an alle Ports","Hub ist schneller","Switch arbeitet auf Schicht 3"],c:1,e:"Ein Hub sendet an alle Ports (ineffizient). Ein Switch lernt welches Gerät an welchem Port hängt und sendet gezielt."},
  {id:16,kat:"Netzwerk & OSI",q:"PC hat IP 192.168.1.50 mit Maske 255.255.255.0. Was ist die Netzwerkadresse?",o:["192.168.1.50","192.168.1.1","192.168.1.0","192.168.0.0"],c:2,e:"Bei 255.255.255.0 (/24) sind die ersten drei Oktette das Netzwerk: 192.168.1.0. Hosts: .1 bis .254."},
  {id:17,kat:"Netzwerk & OSI",q:"Was ist die Aufgabe des DNS?",o:["IP-Adressen vergeben","Domainnamen in IP-Adressen auflösen","Pakete routen","Verbindungen verschlüsseln"],c:1,e:"DNS übersetzt Domainnamen wie www.google.com in IP-Adressen — erst dann kann der Browser eine Verbindung aufbauen."},
  {id:18,kat:"Netzwerk & OSI",q:"Benutzer kann Kollegen im gleichen Raum anpingen, aber nicht den Server im Rechenzentrum. Ursache?",o:["Kabel defekt","Keine IP-Adresse","Gateway oder Routing falsch konfiguriert","Server ausgeschaltet"],c:2,e:"Kollege im gleichen Subnetz erreichbar (Schicht 2), Server in anderem Netz nicht — deutet auf Gateway-Problem (Schicht 3) hin."},
  {id:19,kat:"Netzwerk & OSI",q:"Was ist ein VLAN?",o:["Ein verschlüsseltes Netzwerk","Logische Trennung eines physischen Netzwerks in virtuelle Netze","Schnelleres WLAN","Protokoll zur IP-Vergabe"],c:1,e:"VLANs trennen ein physisches Netzwerk logisch. Geräte im gleichen VLAN kommunizieren direkt, zwischen VLANs muss ein Router vermitteln."},
  {id:20,kat:"Netzwerk & OSI",q:"Welches Protokoll vergibt automatisch IP-Adressen?",o:["DNS","HTTP","DHCP","FTP"],c:2,e:"DHCP vergibt automatisch IP-Adressen, Subnetzmasken, Gateways und DNS-Server an Geräte."},
  {id:21,kat:"Netzwerk & OSI",q:"Was ist der Unterschied zwischen TCP und UDP?",o:["TCP ist schneller","TCP ist verbindungsorientiert und zuverlässig, UDP schneller aber unzuverlässig","UDP bestätigt jeden Empfang","TCP nur für Video"],c:1,e:"TCP: Verbindung, Bestätigung, Neuübertragung bei Verlust — zuverlässig aber langsamer. UDP: Kein Handshake — schneller, für Streaming/VoIP."},
  {id:22,kat:"Netzwerk & OSI",q:"Auf welcher OSI-Schicht arbeitet ein Router?",o:["Schicht 1 – Physical","Schicht 2 – Data Link","Schicht 3 – Network","Schicht 4 – Transport"],c:2,e:"Router arbeiten auf Schicht 3 (Network) und leiten Pakete anhand von IP-Adressen zwischen Netzwerken weiter."},
  {id:23,kat:"Netzwerk & OSI",q:"Was bedeutet '/24' in der Adresse 192.168.1.0/24?",o:["24 Geräte im Netz","Erste 24 Bit sind Netzwerkteil — entspricht 255.255.255.0","Netzwerk hat 24 Subnetze","Router hat 24 Ports"],c:1,e:"/24 bedeutet die ersten 24 Bit sind das Netzwerk. Entspricht 255.255.255.0 — 254 nutzbare Hosts (.1 bis .254)."},
  {id:24,kat:"Netzwerk & OSI",q:"Webseite öffnet nicht, aber Ping funktioniert. Wahrscheinlichste Ursache?",o:["Kabel defekt","Port durch Firewall blockiert","IP-Adresse falsch","DNS ausgefallen"],c:1,e:"Ping nutzt ICMP (kein Port). Webseiten brauchen Port 80/443. Ping geht, Browser nicht → Firewall blockiert den Port (Schicht 4)."},
  {id:25,kat:"Netzwerk & OSI",q:"Was ist eine MAC-Adresse?",o:["IP-Adresse für WLAN","Eindeutige Hardware-Adresse jeder Netzwerkkarte","Verschlüsseltes Passwort","Router-Adresse"],c:1,e:"MAC-Adresse: weltweit eindeutige 48-Bit-Adresse die jeder Netzwerkkarte eingebrannt ist. Arbeitet auf Schicht 2."},
  {id:26,kat:"Netzwerk & OSI",q:"Was ist der Unterschied zwischen HTTP und HTTPS?",o:["HTTPS ist schneller","HTTPS verschlüsselt per TLS, HTTP überträgt unverschlüsselt","HTTP ist moderner","Kein Unterschied"],c:1,e:"HTTPS verschlüsselt mit TLS. HTTP überträgt im Klartext — gefährlich für Passwörter und sensible Daten."},
  {id:27,kat:"Netzwerk & OSI",q:"Welche OSI-Schicht ist für TLS-Verschlüsselung zuständig?",o:["Schicht 4 – Transport","Schicht 5 – Session","Schicht 6 – Presentation","Schicht 7 – Application"],c:2,e:"Schicht 6 (Presentation) ist für Datendarstellung und Verschlüsselung zuständig. TLS verschlüsselt auf dieser Schicht."},
  {id:28,kat:"Netzwerk & OSI",q:"Was ist ein Subnetz?",o:["Zweiter Router","Logisch abgeteilter Teil eines größeren IP-Netzwerks","Verschlüsselter Bereich","Netz ohne Internet"],c:1,e:"Subnetting teilt ein großes Netz in kleinere Bereiche — bessere Performance, Sicherheit und Verwaltung."},
  {id:29,kat:"Netzwerk & OSI",q:"Was ist NAT (Network Address Translation)?",o:["Datenverschlüsselung","Übersetzung privater in öffentliche IP-Adressen für den Internetzugang","DNS-Protokoll","Eine Firewall"],c:1,e:"NAT erlaubt vielen Geräten mit privaten IP-Adressen über eine öffentliche IP ins Internet zu gehen. Der Router übersetzt die Adressen."},
  {id:30,kat:"Netzwerk & OSI",q:"Wofür nutzt ein Techniker 'ipconfig /all' auf Windows?",o:["PC neu starten","Alle Netzwerkkonfigurationen anzeigen (IP, Gateway, DNS, MAC)","Kabel testen","DNS-Cache leeren"],c:1,e:"ipconfig /all zeigt alle Netzwerkinformationen: IP, Subnetzmaske, Gateway, DNS, MAC. Wichtigstes Diagnose-Tool für Netzwerkprobleme."},
  {id:31,kat:"Betriebssysteme",q:"Was ist Active Directory?",o:["Dateiserver","Verzeichnisdienst zur zentralen Verwaltung von Benutzern, Computern und Gruppen","Antivirenprogramm","Backup-System"],c:1,e:"Active Directory ermöglicht zentrale Verwaltung aller Benutzer, Computer, Drucker und Richtlinien in einem Unternehmensnetzwerk."},
  {id:32,kat:"Betriebssysteme",q:"Unterschied lokaler Benutzer vs. Domänenbenutzer?",o:["Kein Unterschied","Lokaler Benutzer nur auf einem Gerät, Domänenbenutzer an allen Domänengeräten","Domänenbenutzer haben mehr Speicher","Lokale Benutzer sind sicherer"],c:1,e:"Lokale Benutzer: nur auf dem jeweiligen Computer. Domänenbenutzer: im AD gespeichert, können sich an jedem Domänencomputer anmelden."},
  {id:33,kat:"Betriebssysteme",q:"Was ist Virtualisierung?",o:["Verschlüsselungsmethode","Mehrere virtuelle Computer auf einem physischen Server betreiben","Backup-Verfahren","Datenbanktyp"],c:1,e:"Virtualisierung ermöglicht mehrere VMs auf einem Server — bessere Ressourcennutzung, schnellere Bereitstellung, einfachere Verwaltung."},
  {id:34,kat:"Betriebssysteme",q:"Benutzer kann sich nicht anmelden. Warum prüft der Techniker den Domänencontroller?",o:["DC speichert Passwörter im Klartext","Domänenanmeldungen werden am DC authentifiziert","DC startet alle PCs","Ohne DC kein Internet"],c:1,e:"Bei Domänenanmeldungen prüft der PC die Credentials am Domänencontroller. Ist er nicht erreichbar, schlägt die Anmeldung fehl."},
  {id:35,kat:"Betriebssysteme",q:"Was ist RAID?",o:["Netzwerkprotokoll","Methode mehrere Festplatten für Datensicherheit oder Performance zu kombinieren","Betriebssystem","Backup-Programm"],c:1,e:"RAID kombiniert Festplatten. RAID 1 (Spiegelung): Ausfallsicherheit. RAID 0 (Striping): Geschwindigkeit. RAID 5: beides kombiniert."},
  {id:36,kat:"Betriebssysteme",q:"Unterschied NTFS vs. FAT32?",o:["FAT32 ist neuer","NTFS unterstützt Zugriffsrechte, Dateien über 4 GB und Journaling — FAT32 nicht","FAT32 ist schneller","Kein praktischer Unterschied"],c:1,e:"NTFS: Berechtigungen, Dateien über 4 GB, Verschlüsselung, Journaling. FAT32: einfacher, aber 4 GB Dateigrößenlimit, keine Berechtigungen."},
  {id:37,kat:"Betriebssysteme",q:"Was macht 'systemctl restart nginx' unter Linux?",o:["Installiert nginx","Startet den nginx-Dienst neu","Löscht nginx","Zeigt Status von nginx"],c:1,e:"systemctl verwaltet Dienste unter Linux. restart stoppt und startet neu. start/stop/status/enable sind weitere wichtige Optionen."},
  {id:38,kat:"Betriebssysteme",q:"Was ist eine Gruppenrichtlinie (Group Policy)?",o:["Firewall-Einstellung","Zentrale Konfiguration die Einstellungen auf alle Computer und Benutzer der Domäne anwendet","Backup-Plan","Netzwerkprotokoll"],c:1,e:"GPOs ermöglichen zentrale Verwaltung: Passwortrichtlinien, Desktop, Software, Sicherheitseinstellungen — für alle Nutzer gleichzeitig."},
  {id:39,kat:"Betriebssysteme",q:"Unterschied Prozess vs. Dienst (Service)?",o:["Kein Unterschied","Prozess ist ein laufendes Programm, Dienst läuft im Hintergrund ohne GUI und startet meist automatisch","Dienste sind schneller","Prozesse verbrauchen mehr RAM"],c:1,e:"Jedes laufende Programm ist ein Prozess. Dienste sind spezielle Prozesse die ohne Benutzerinteraktion im Hintergrund laufen."},
  {id:40,kat:"Betriebssysteme",q:"Server soll täglich um 2 Uhr Backup erstellen. Was nutzt der Admin?",o:["Einen Wecker","Task Scheduler (Windows) oder Cron (Linux)","Macht es manuell","Windows Update"],c:1,e:"Task Scheduler (Windows) oder Cron (Linux) ermöglichen automatisches Ausführen von Skripten und Programmen zu definierten Zeiten."},
  {id:41,kat:"Betriebssysteme",q:"Unterschied physische vs. virtuelle Maschine?",o:["VMs sind schneller","Physisch ist echte Hardware, virtuell läuft als Software auf einem Hypervisor","VMs haben mehr RAM","Kein Unterschied"],c:1,e:"Eine VM wird durch einen Hypervisor (VMware, Hyper-V) emuliert. Sie teilt physische Ressourcen des Host-Servers mit anderen VMs."},
  {id:42,kat:"Betriebssysteme",q:"Was bedeutet die 3-2-1 Backup-Strategie?",o:["3 Backups/Tag, 2 Server, 1 Cloud","3 Kopien, auf 2 verschiedenen Medien, davon 1 außerhalb des Gebäudes","3 Server, 2 Backups, 1 Test","3 Tage, 2 Wochen, 1 Monat"],c:1,e:"3-2-1: Mindestens 3 Kopien, auf 2 verschiedenen Medien, davon 1 an einem anderen Standort. Schutz vor Feuer, Diebstahl, Hardwareausfall."},
  {id:43,kat:"Betriebssysteme",q:"Unterschied 32-Bit vs. 64-Bit Betriebssystem?",o:["64-Bit ist doppelt schneller","64-Bit kann mehr RAM adressieren und ist für moderne Software optimiert","32-Bit ist sicherer","Kein Unterschied mehr"],c:1,e:"32-Bit: max. 4 GB RAM. 64-Bit: theoretisch Exabytes. Moderne Software und Betriebssysteme sind auf 64-Bit ausgelegt."},
  {id:44,kat:"Betriebssysteme",q:"Linux-Server zeigt '/' zu 95% voll. Was tun?",o:["Server neu starten","Speicher analysieren und nicht benötigte Dateien/Logs löschen","Betriebssystem neu installieren","Nichts — normal"],c:1,e:"Bei über 90% drohen Systemprobleme. Mit 'du -sh /*' analysieren welche Verzeichnisse viel Platz belegen — oft große Log-Dateien."},
  {id:45,kat:"Betriebssysteme",q:"Was ist LDAP?",o:["Backup-Protokoll","Protokoll für den Zugriff auf Verzeichnisdienste wie Active Directory","Netzwerküberwachungs-Tool","Verschlüsselungsprotokoll"],c:1,e:"LDAP (Lightweight Directory Access Protocol) ist das Standardprotokoll für Verzeichnisdienste. Active Directory basiert auf LDAP."},
  {id:46,kat:"IT-Sicherheit",q:"Mitarbeiter erhält E-Mail von 'support@micros0ft.com' mit Bitte sein Passwort zu bestätigen. Was ist das?",o:["Legitime Microsoft-Mail","Phishing-Versuch","Spam","Automatische Sicherheitsmeldung"],c:1,e:"Klassischer Phishing-Versuch. 'micros0ft.com' (Null statt o) ist gefälscht. Legitime Unternehmen fragen niemals per E-Mail nach Passwörtern."},
  {id:47,kat:"IT-Sicherheit",q:"Was ist das CIA-Prinzip?",o:["Amerikanischer Geheimdienst","Confidentiality, Integrity, Availability — die drei Schutzziele","Firewall-Konfiguration","Verschlüsselungsstandard"],c:1,e:"CIA: Vertraulichkeit (nur Berechtigte sehen Daten), Integrität (Daten unverändert), Verfügbarkeit (Systeme erreichbar)."},
  {id:48,kat:"IT-Sicherheit",q:"Was ist Ransomware?",o:["Antivirenprogramm","Schadsoftware die Daten verschlüsselt und Lösegeld fordert","Spam-Filter","Backup-Tool"],c:1,e:"Ransomware verschlüsselt alle erreichbaren Dateien und fordert Lösegeld. Schutz: aktuelle Backups, Updates, keine verdächtigen Anhänge."},
  {id:49,kat:"IT-Sicherheit",q:"Unterschied symmetrische vs. asymmetrische Verschlüsselung?",o:["Symmetrisch ist sicherer","Symmetrisch: ein Schlüssel für beide Seiten. Asymmetrisch: Schlüsselpaar öffentlich/privat","Asymmetrisch ist schneller","Kein Unterschied"],c:1,e:"Symmetrisch (AES): gleicher Schlüssel zum Ver- und Entschlüsseln — schnell. Asymmetrisch (RSA): öffentlich verschlüsseln, privat entschlüsseln — sicherer für Schlüsselaustausch."},
  {id:50,kat:"IT-Sicherheit",q:"Kundendaten möglicherweise gestohlen. Was schreibt die DSGVO vor?",o:["Nichts","Datenschutzbehörde innerhalb 72 Stunden informieren","30 Tage Zeit","Nur wenn Angreifer bekannt"],c:1,e:"Art. 33 DSGVO: Bei Datenschutzverletzung muss die Aufsichtsbehörde innerhalb 72 Stunden informiert werden."},
  {id:51,kat:"IT-Sicherheit",q:"Was ist Social Engineering?",o:["Programmierparadigma","Manipulation von Menschen um vertrauliche Informationen zu erlangen","Netzwerktopologie","Sicherheitsprotokoll"],c:1,e:"Social Engineering nutzt menschliche Schwächen statt technischer Lücken — z.B. als IT-Support ausgeben und nach Passwörtern fragen."},
  {id:52,kat:"IT-Sicherheit",q:"Was ist eine DMZ im Netzwerk?",o:["Sicherer Bereich ohne Server","Netzwerksegment das öffentliche Server vom internen Netz trennt","Verschlüsselter Tunnel","Bereich ohne Firewall"],c:1,e:"DMZ: Netzwerksegment zwischen Internet und internem Netz. Öffentliche Server (Web, Mail) in der DMZ — werden sie kompromittiert, ist das interne Netz noch geschützt."},
  {id:53,kat:"IT-Sicherheit",q:"Unterschied Firewall vs. IDS?",o:["Kein Unterschied","Firewall blockiert nach Regeln, IDS überwacht und meldet verdächtigen Verkehr","IDS blockiert, Firewall meldet","IDS ist schneller"],c:1,e:"Firewall: filtert aktiv nach Regeln. IDS (Intrusion Detection System): analysiert auf verdächtige Muster und schlägt Alarm — blockiert nicht selbst."},
  {id:54,kat:"IT-Sicherheit",q:"Was bedeutet das Prinzip der minimalen Rechtevergabe?",o:["Jeder bekommt Adminrechte","Jeder bekommt nur die Rechte die er für seine Arbeit braucht","Rechte werden nie vergeben","Alle haben gleiche Rechte"],c:1,e:"Least Privilege: minimale notwendige Rechte für Benutzer, Systeme und Anwendungen. Begrenzt Schaden bei kompromittierten Konten."},
  {id:55,kat:"IT-Sicherheit",q:"Was ist ein VPN?",o:["Schnelleres WLAN","Verschlüsselter Tunnel für sichere Verbindungen über unsichere Netzwerke","Antivirenprogramm","IP-Vergabe-Protokoll"],c:1,e:"VPN erstellt einen verschlüsselten Tunnel. Homeoffice-Mitarbeiter nutzen VPN um sicher auf das Firmennetzwerk zuzugreifen."},
  {id:56,kat:"IT-Sicherheit",q:"Was ist Zwei-Faktor-Authentifizierung (2FA)?",o:["Passwort mit 2 Zeichen","Kombination aus zwei Authentifizierungsmethoden (z.B. Passwort + SMS-Code)","Zwei Benutzer melden gleichzeitig an","Doppeltes Passwort"],c:1,e:"2FA kombiniert zwei Faktoren: Wissen (Passwort) + Besitz (Smartphone) oder Biometrie. Gestohlenes Passwort allein reicht nicht."},
  {id:57,kat:"IT-Sicherheit",q:"Was ist Patch-Management?",o:["Netzwerkkabel reparieren","Systematisches Installieren von Software-Updates und Sicherheits-Patches","Backup-Verfahren","Benutzerrechte verwalten"],c:1,e:"Patch-Management stellt sicher dass alle Systeme aktuelle Updates haben. Ungepatchte Systeme sind häufige Einfallstore für Angreifer."},
  {id:58,kat:"IT-Sicherheit",q:"Was ist ein Brute-Force-Angriff?",o:["Physischer Angriff","Systematisches Ausprobieren aller möglichen Passwörter","Phishing-Angriff","Netzwerkangriff"],c:1,e:"Bei Brute-Force werden automatisiert alle möglichen Passwörter durchprobiert. Schutz: starke Passwörter, Kontosperrung nach Fehlversuchen, 2FA."},
  {id:59,kat:"IT-Sicherheit",q:"Was ist eine Schutzbedarfsanalyse?",o:["Netzwerkgeschwindigkeit messen","Bewertung welche Daten und Systeme welchen Schutzbedarf haben","Backup-Test","Firewall konfigurieren"],c:1,e:"Schutzbedarfsanalyse: Für jedes System bewerten — wie hoch ist der Schaden bei Verlust von Vertraulichkeit, Integrität oder Verfügbarkeit?"},
  {id:60,kat:"IT-Sicherheit",q:"Unterschied Virus vs. Trojaner?",o:["Kein Unterschied","Virus verbreitet sich selbst, Trojaner tarnt sich als nützliches Programm","Trojaner harmloser","Viren nur für Windows"],c:1,e:"Virus: verbreitet sich durch Infizierung anderer Dateien. Trojaner: tarnt sich als legitimes Programm — der Nutzer installiert ihn selbst."},
  {id:61,kat:"Datenbanken",q:"Was ist ein Primärschlüssel?",o:["Erstes Feld jeder Tabelle","Eindeutiger Wert der jeden Datensatz identifiziert — nicht NULL oder doppelt","Datenbankpasswort","Tabellenname"],c:1,e:"Primärschlüssel identifiziert jeden Datensatz eindeutig. Darf nicht leer oder doppelt sein. Häufig eine automatisch hochzählende ID."},
  {id:62,kat:"Datenbanken",q:"Was macht: SELECT * FROM Kunden WHERE Stadt = 'München'?",o:["Löscht Kunden aus München","Erstellt neue Tabelle","Gibt alle Kundendatensätze zurück bei denen Stadt München ist","Aktualisiert die Stadt"],c:2,e:"SELECT liest Daten. * = alle Spalten. FROM Kunden = Tabelle. WHERE Stadt = 'München' = Filter. Ergebnis: alle Kunden aus München."},
  {id:63,kat:"Datenbanken",q:"Was ist Normalisierung?",o:["Datenbank verschlüsseln","Redundanz durch Aufteilen von Daten in Tabellen entfernen","Datenbankgeschwindigkeit erhöhen","Backups erstellen"],c:1,e:"Normalisierung beseitigt Redundanz. Adresse nur einmal gespeichert = nur einmal ändern nötig — keine Inkonsistenzen."},
  {id:64,kat:"Datenbanken",q:"Was ist ein Fremdschlüssel?",o:["Passwort für fremde Benutzer","Feld das auf den Primärschlüssel einer anderen Tabelle verweist","Verschlüsselter Primärschlüssel","Schlüssel eines anderen Unternehmens"],c:1,e:"Fremdschlüssel verweist auf den Primärschlüssel einer anderen Tabelle — so werden Beziehungen hergestellt."},
  {id:65,kat:"Datenbanken",q:"Welcher SQL-Befehl fügt einen neuen Datensatz ein?",o:["UPDATE","SELECT","INSERT INTO","CREATE"],c:2,e:"INSERT INTO Tabelle (Spalten) VALUES (Werte) fügt neue Datensätze ein. UPDATE ändert bestehende. SELECT liest. DELETE löscht."},
  {id:66,kat:"Datenbanken",q:"Was ist eine REST-API?",o:["Datenbank","Schnittstelle die HTTP-Methoden für Datenaustausch zwischen Systemen nutzt","Betriebssystem","Verschlüsselungsprotokoll"],c:1,e:"REST-API: GET (lesen), POST (erstellen), PUT (aktualisieren), DELETE (löschen) — ermöglicht Kommunikation zwischen Systemen."},
  {id:67,kat:"Datenbanken",q:"Unterschied SQL vs. NoSQL?",o:["SQL ist schneller","SQL: relationale Tabellen mit Schema. NoSQL: flexibel für unstrukturierte Daten","NoSQL hat keine Abfragen","SQL ist veraltet"],c:1,e:"SQL: strukturierte Tabellen, feste Beziehungen (MySQL, PostgreSQL). NoSQL: flexibel für große unstrukturierte Daten (MongoDB, Redis)."},
  {id:68,kat:"Datenbanken",q:"Was ist ETL?",o:["Netzwerkprotokoll","Extract, Transform, Load — Daten zwischen Systemen übertragen","Backup-Verfahren","Datenbankabfrage"],c:1,e:"ETL: Daten aus Quellsystem extrahieren, ins benötigte Format umwandeln, ins Zielsystem laden. Typisch bei Systemintegration."},
  {id:69,kat:"Datenbanken",q:"Was ist JSON?",o:["Programmiersprache","Leichtgewichtiges Dateiformat für strukturierten Datenaustausch","Datenbanktyp","Netzwerkprotokoll"],c:1,e:"JSON (JavaScript Object Notation): leichtgewichtig, für Menschen lesbar, von fast allen Sprachen und APIs unterstützt."},
  {id:70,kat:"Datenbanken",q:"Was macht SQL JOIN?",o:["Verbindet zwei Datenbanken","Kombiniert Datensätze aus zwei Tabellen anhand eines gemeinsamen Feldes","Löscht Duplikate","Erstellt neue Tabelle"],c:1,e:"JOIN verknüpft Tabellen: Kunden JOIN Bestellungen ON Kunden.ID = Bestellungen.KundenID — Daten aus beiden Tabellen in einer Abfrage."},
  {id:71,kat:"Datenbanken",q:"Was ist Middleware?",o:["Datenbankebene","Software die verschiedene Systeme verbindet und Datenformate übersetzt","Betriebssystem","Netzwerkgerät"],c:1,e:"Middleware sitzt zwischen Systemen, übersetzt Formate und koordiniert Datenaustausch — wichtig wenn alte und neue Systeme zusammenarbeiten."},
  {id:72,kat:"Datenbanken",q:"Was ist eine Datenbank-Transaktion?",o:["Datenbankabfrage","Gruppe von Operationen die alle erfolgreich ausgeführt werden oder gar nicht","Backup","Benutzer-Login"],c:1,e:"Transaktion garantiert Konsistenz: Überweisung wird nur gebucht wenn sowohl Abbuchung als auch Gutschrift klappen. Sonst Rollback."},
  {id:73,kat:"Skripting",q:"Vorteil von PowerShell gegenüber cmd?",o:["Schneller","Gibt Objekte statt Text zurück — ermöglicht komplexe Automatisierung","cmd funktioniert nicht mehr","Braucht keine Installation"],c:1,e:"PowerShell gibt strukturierte Objekte zurück die man direkt weiterverarbeiten kann. cmd gibt nur Text zurück."},
  {id:74,kat:"Skripting",q:"Was macht das '|' (Pipe) in PowerShell/Bash?",o:["Bedeutet ODER","Leitet Ausgabe eines Befehls als Eingabe an den nächsten weiter","Startet neuen Prozess","Kommentiert eine Zeile aus"],c:1,e:"Die Pipe verbindet Befehle: Get-Process | Sort-Object CPU — Prozessliste wird direkt sortiert. Ermöglicht mächtige Befehlsketten."},
  {id:75,kat:"Skripting",q:"Was ist ein Cronjob?",o:["Linux-Prozess der dauerhaft läuft","Automatisch geplante Aufgabe unter Linux die zu bestimmten Zeiten ausgeführt wird","Backup-Tool","Admin-Benutzer"],c:1,e:"Cron ist ein Zeitplaner. Cronjobs legen fest wann Skripte automatisch ausgeführt werden — täglich, stündlich, minütlich."},
  {id:76,kat:"Skripting",q:"Welcher PowerShell-Befehl zeigt alle laufenden Prozesse?",o:["Show-Process","List-Process","Get-Process","Display-Process"],c:2,e:"Get-Process zeigt alle Prozesse mit Name, PID, CPU- und RAM-Verbrauch. Mit | Where-Object filtern."},
  {id:77,kat:"Skripting",q:"Was macht 'grep' in Linux?",o:["Kopiert Dateien","Sucht nach Mustern in Dateien oder Ausgaben","Zeigt freien Speicher","Listet Prozesse"],c:1,e:"grep durchsucht Text nach Mustern. cat syslog | grep 'ERROR' zeigt nur Zeilen mit 'ERROR'."},
  {id:78,kat:"Skripting",q:"Unterschied Skript vs. kompiliertes Programm?",o:["Skripte immer schneller","Skripte werden interpretiert, Programme vorher in Maschinencode übersetzt","Kompilierte Programme einfacher","Kein Unterschied"],c:1,e:"Skripte: zur Laufzeit interpretiert — flexibel aber langsamer. Kompilierte Programme: vorher übersetzt — schneller."},
  {id:79,kat:"Skripting",q:"Linux-Befehl um Verzeichnisinhalt anzuzeigen?",o:["dir","show","ls","list"],c:2,e:"ls (list) zeigt Verzeichnisinhalt. ls -la zeigt alle Dateien mit Details. Windows-Äquivalent: 'dir'."},
  {id:80,kat:"Skripting",q:"PowerShell-Befehl um Port 443 auf einem Server zu prüfen?",o:["Ping-Port 443","Test-NetConnection -ComputerName server01 -Port 443","Check-Port server01 443","Get-Port server01"],c:1,e:"Test-NetConnection prüft ob ein TCP-Port erreichbar ist — nützlich um Firewall-Regeln zu testen."},
  {id:81,kat:"Skripting",q:"Was ist eine Variable in einem Skript?",o:["Fester Wert der sich nie ändert","Benannter Speicherplatz der einen Wert enthält der sich ändern kann","Konstante","Kommentar"],c:1,e:"Variablen speichern Werte. PowerShell: $name = 'Max'. Bash: name='Max'. Der Wert kann sich während der Ausführung ändern."},
  {id:82,kat:"Skripting",q:"Was macht 'chmod 755 skript.sh' unter Linux?",o:["Löscht das Skript","Verschlüsselt es","Setzt Berechtigungen: Eigentümer alles, Gruppe und andere lesen+ausführen","Erstellt das Skript"],c:2,e:"chmod setzt Dateiberechtigungen. 7=rwx (Eigentümer), 5=rx (Gruppe), 5=rx (andere). Skripte müssen ausführbar sein."},
  {id:83,kat:"Beruf & Projekt",q:"Was ist ein Ticket im IT-Helpdesk?",o:["Zugangscode","Dokumentierte Anfrage oder Störungsmeldung die bearbeitet und nachverfolgt wird","Benutzerpasswort","Rechnung"],c:1,e:"Ein Ticket dokumentiert Anfragen mit Beschreibung, Priorität, Bearbeiter, Status. Ermöglicht Nachverfolgung und Qualitätssicherung."},
  {id:84,kat:"Beruf & Projekt",q:"Was ist ein SLA?",o:["Softwarelizenzvertrag","Vertragliche Vereinbarung über Qualität und Reaktionszeiten von IT-Services","Sicherheitszertifikat","Backup-Plan"],c:1,e:"SLA legt fest welche Servicequalität garantiert wird: z.B. Reaktion bei kritischen Störungen innerhalb 1 Stunde."},
  {id:85,kat:"Beruf & Projekt",q:"Was bedeutet 1st, 2nd und 3rd Level Support?",o:["Drei Ticketsysteme","Drei Eskalationsstufen: Helpdesk → Spezialisten → Hersteller","OSI-Schichten","Benutzergruppen"],c:1,e:"1st Level: einfache Probleme direkt lösen. 2nd Level: komplexere Fälle (Admins). 3rd Level: Hersteller für unlösbare Probleme."},
  {id:86,kat:"Beruf & Projekt",q:"Was ist eine Bedarfsanalyse?",o:["Technische Systemprüfung","Strukturiertes Ermitteln was der Kunde wirklich braucht bevor man eine Lösung entwickelt","Kostenkalkulation","Abnahmeprotokoll"],c:1,e:"Bedarfsanalyse: IST-Zustand und SOLL-Zustand klären. Erst den Bedarf verstehen, dann die richtige Lösung anbieten."},
  {id:87,kat:"Beruf & Projekt",q:"Was ist ein Abnahmeprotokoll?",o:["Reparaturnachweis","Dokument das bestätigt dass eine Leistung vollständig und wie vereinbart erbracht wurde","Betriebsanleitung","Backup-Protokoll"],c:1,e:"Abnahmeprotokoll: formale Bestätigung des Kunden. Schützt Dienstleister vor Nachforderungen, Kunden vor unfertigen Lieferungen."},
  {id:88,kat:"Beruf & Projekt",q:"Was ist ein Pflichtenheft?",o:["Liste der Azubi-Pflichten","Dokument das beschreibt wie der Auftragnehmer die Anforderungen technisch umsetzt","Arbeitsvertrag","Sicherheitskonzept"],c:1,e:"Lastenheft (WAS? — Auftraggeber) + Pflichtenheft (WIE? — Auftragnehmer). Das Pflichtenheft ist die verbindliche technische Spezifikation."},
  {id:89,kat:"Beruf & Projekt",q:"Typische Phasen eines IT-Projekts?",o:["Planen, Hacken, Testen","Initiierung, Planung, Durchführung, Abschluss","Start, Mitte, Ende","Analyse, Design, Code"],c:1,e:"Initiierung (Auftrag klären) → Planung (Aufgaben, Termine) → Durchführung (Umsetzung) → Abschluss (Abnahme, Dokumentation)."},
  {id:90,kat:"Beruf & Projekt",q:"Was ist ein Meilenstein im Projektplan?",o:["Ende des Projekts","Wichtiger Zwischenpunkt der einen definierten Zustand markiert","Aufgabe mit hoher Priorität","Projektrisiko"],c:1,e:"Meilensteine sind Zwischenziele: 'Bis 15.03 Hardware installiert'. Helfen Fortschritt zu messen und Verzug früh zu erkennen."},
  {id:91,kat:"Beruf & Projekt",q:"Was ist adressatengerechte Kommunikation?",o:["Immer Fachbegriffe","Sprache an den Wissensstand des Gesprächspartners anpassen","Immer einfache Sprache","Schriftlich statt mündlich"],c:1,e:"Adressatengerecht: IT-Laien einfach ohne Fachjargon erklären, erfahrenen Kollegen technisch präzise. Gleiche Botschaft, verschiedene Verpackung."},
  {id:92,kat:"Beruf & Projekt",q:"Was ist Qualitätssicherung in einem IT-Projekt?",o:["Backups erstellen","Prozess der sicherstellt dass das Ergebnis den Anforderungen entspricht","Netzwerkgeschwindigkeit testen","Dokumentation schreiben"],c:1,e:"QS prüft ob Projektergebnis den Anforderungen entspricht: Reviews, Tests, Soll-Ist-Vergleiche. Frühzeitige QS spart Zeit und Kosten."},
  {id:93,kat:"Beruf & Projekt",q:"Was ist die Schweigepflicht im IT-Beruf?",o:["Nicht mit Kollegen reden","Pflicht vertrauliche Informationen nicht an Unbefugte weiterzugeben","Keine E-Mails schreiben","Keine Fehler melden"],c:1,e:"Als IT-Fachmann hat man Zugang zu sensiblen Daten. Schweigepflicht verbietet Weitergabe ohne Berechtigung — auch nach dem Ausscheiden."},
  {id:94,kat:"Beruf & Projekt",q:"Unterschied Teil 1 vs. Teil 2 der IHK-Prüfung für FISI?",o:["Teil 1 ist schwerer","Teil 1 nach 18 Monaten (Grundlagen), Teil 2 nach 3 Jahren mit betrieblichem Projekt","Teil 2 ist kürzer","Es gibt nur einen Teil"],c:1,e:"AP1 (~18 Monate): Grundlagen schriftlich. AP2 (3 Jahre): betriebliches Projekt + Präsentation + schriftliche Fachprüfung."},
  {id:95,kat:"Beruf & Projekt",q:"Was ist ein Gantt-Diagramm?",o:["Netzwerktopologie-Diagramm","Visuelle Darstellung von Projektaufgaben über die Zeit","IP-Adressplan","Sicherheitskonzept"],c:1,e:"Gantt: Alle Projektaufgaben als Balken auf Zeitachse. Zeigt welche Aufgaben parallel laufen, Abhängigkeiten und ob Zeitplan gehalten wird."},
  {id:96,kat:"Beruf & Projekt",q:"Was ist das ITIL-Framework?",o:["Netzwerkprotokoll","Framework mit Best Practices für IT-Service-Management","Sicherheitsstandard","Programmiersprache"],c:1,e:"ITIL beschreibt Best Practices für IT-Prozesse: Incident Management, Change Management, Service Desk und mehr."},
  {id:97,kat:"Beruf & Projekt",q:"Unterschied Lastenheft vs. Pflichtenheft?",o:["Kein Unterschied","Lastenheft: WAS will der Auftraggeber. Pflichtenheft: WIE setzt der Auftragnehmer es um","Pflichtenheft kommt zuerst","Lastenheft für Software, Pflichtenheft für Hardware"],c:1,e:"Lastenheft (Auftraggeber): Anforderungen WAS. Pflichtenheft (Auftragnehmer): technische Spezifikation WIE. Pflichtenheft basiert auf Lastenheft."},
  {id:98,kat:"Beruf & Projekt",q:"Was ist Change Management in der IT?",o:["Passwörter wechseln","Kontrollierter Prozess für Planung, Genehmigung und Durchführung von Änderungen an IT-Systemen","Neue Mitarbeiter ausbilden","Dokumentation aktualisieren"],c:1,e:"Change Management verhindert unkontrollierte Änderungen die zu Ausfällen führen. Jede Änderung muss beantragt, bewertet und genehmigt werden."},
  {id:99,kat:"Beruf & Projekt",q:"Was ist Eskalation im Helpdesk?",o:["Beschwerde beim Chef","Weiterleiten eines Problems an höhere Support-Ebene weil aktuelle Ebene es nicht lösen kann","Ticket löschen","Automatische E-Mail"],c:1,e:"Eskalation: Problem weiterleiten wenn nicht lösbar oder SLA droht zu platzen. 1st → 2nd → 3rd Level. Gute Dokumentation entscheidend."},
  {id:100,kat:"Beruf & Projekt",q:"Was muss ein FISI-Azubi für das betriebliche Abschlussprojekt erstellen?",o:["Nur den technischen Teil","Projektantrag, Dokumentation, Präsentation und Fachgespräch","Nur eine Präsentation","Einen Programmiercode"],c:1,e:"Betriebliches Projekt: Projektantrag → Dokumentation (max. 15 Seiten) → Präsentation (15 Min.) → Fachgespräch (15 Min.) vor dem Prüfungsausschuss."},
];

const KATS=["Alle",...[...new Set(PRUEFUNG.map(f=>f.kat))]];
const FREE_KATS=["Grundlagen","Netzwerk & OSI"]; // deckt sich mit den freien Modulen 1+2

const shuffle=arr=>[...arr].sort(()=>Math.random()-0.5);

export default function Pruefung({onExit}){
  const {user,isPremium}=useAuth();
  const [kat,setKat]=useState("Alle");
  const [modus,setModus]=useState(null); // null=start, "quiz"=läuft, "done"=fertig, "locked"=Premium nötig
  const [fragen,setFragen]=useState([]);
  const [idx,setIdx]=useState(0);
  const [sel,setSel]=useState(null);
  const [score,setScore]=useState(0);
  const [falsch,setFalsch]=useState([]);
  const [showAuth,setShowAuth]=useState(false);
  const [nachweisBusy,setNachweisBusy]=useState(false);
  const [lockReason,setLockReason]=useState(null); // "account" | "premium"

  const starten=(n)=>{
    if(!user){setLockReason("account");setModus("locked");return;}
    if(n>20&&!isPremium){setLockReason("premium");setModus("locked");return;}
    const pool=isPremium?(kat==="Alle"?PRUEFUNG:PRUEFUNG.filter(f=>f.kat===kat)):PRUEFUNG.filter(f=>FREE_KATS.includes(f.kat));
    const auswahl=shuffle(pool).slice(0,n);
    setFragen(auswahl);setIdx(0);setSel(null);setScore(0);setFalsch([]);setModus("quiz");
  };

  const pick=i=>{
    if(sel!==null)return;
    setSel(i);
    if(i===fragen[idx].c)setScore(s=>s+1);
    else setFalsch(f=>[...f,fragen[idx]]);
  };

  const next=()=>{
    if(idx===fragen.length-1){setModus("done");return;}
    setIdx(i=>i+1);setSel(null);
  };

  const reset=()=>{setModus(null);setSel(null);setIdx(0);setShowAuth(false);};

  const q=fragen[idx];
  const ans=sel!==null;
  const pct=fragen.length>0?Math.round((score/fragen.length)*100):0;

  const topicStats=useMemo(()=>{
    const stats={};
    fragen.forEach(f=>{stats[f.kat]=stats[f.kat]||{name:f.kat,correct:0,total:0};stats[f.kat].total++;});
    fragen.forEach(f=>{if(!falsch.includes(f))stats[f.kat].correct++;});
    return Object.values(stats);
  },[fragen,falsch]);

  const downloadNachweis=async()=>{
    setNachweisBusy(true);
    await generateLernnachweis({user,kind:"pruefung",title:`Prüfungsvorbereitung (${fragen.length} Fragen)`,score,total:fragen.length,topics:topicStats});
    setNachweisBusy(false);
  };

  const katCount=kat==="Alle"?PRUEFUNG.length:PRUEFUNG.filter(f=>f.kat===kat).length;

  if(showAuth)return <AuthScreen onClose={()=>setShowAuth(false)}/>;

  if(modus==="locked")return(
    <div style={wrap}><div style={{...inner,textAlign:"center",paddingTop:40}}>
      <button onClick={reset} style={{background:"none",border:`0.5px solid ${C.bd}`,borderRadius:8,color:C.t2,padding:"6px 12px",fontSize:13,cursor:"pointer",marginBottom:24}}>← Zurück</button>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      {lockReason==="account"?(<>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8,color:C.t}}>Die Prüfungsvorbereitung erfordert ein Konto</h2>
        <p style={{fontSize:14,color:C.t2,marginBottom:20,lineHeight:1.6}}>Auch der Schnelltest (20 Fragen) ist nur mit einem kostenlosen Konto nutzbar — so bleibt die Prüfungsvorbereitung für alle fair und funktioniert nicht als endlose Gratis-Fragensammlung.</p>
        <button onClick={()=>setShowAuth(true)} style={{background:C.bl,color:"#fff",border:"none",borderRadius:10,padding:"12px 18px",fontSize:14,fontWeight:500,cursor:"pointer",width:"100%",fontFamily:ff}}>Anmelden / Registrieren →</button>
      </>):(<>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8,color:C.t}}>Halb- &amp; Vollprüfung sind Premium</h2>
        <p style={{fontSize:14,color:C.t2,marginBottom:8,lineHeight:1.6}}>Dein Konto ({user.email}) hat noch keinen Premium-Zugang.</p>
        <p style={{fontSize:13,color:C.mu}}>Melde dich bei uns, um Premium freizuschalten.</p>
      </>)}
    </div></div>
  );

  return(
    <div style={wrap}><div style={inner}>
      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:C.bl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎯</div>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>IT-Dart Prüfungsvorbereitung</div>
          <div style={{fontSize:11,color:C.mu}}>Fachinformatiker für Systemintegration · 100 Fragen</div>
        </div>
        {modus&&<button onClick={reset} style={{marginLeft:"auto",background:"none",border:`0.5px solid ${C.bd}`,borderRadius:8,color:C.t2,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>↩ Neu</button>}
        {onExit&&<button onClick={onExit} style={{marginLeft:modus?8:"auto",background:"none",border:`0.5px solid ${C.bd}`,borderRadius:8,color:C.t2,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>← Zur App</button>}
      </div>

      {/* STARTSCREEN */}
      {!modus&&<>
        <div style={{textAlign:"center",paddingTop:20,paddingBottom:32}}>
          <div style={{fontSize:56,marginBottom:16}}>🎯</div>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:8,color:C.t}}>Prüfungsvorbereitung</h2>
          <p style={{fontSize:14,color:C.t2,lineHeight:1.7,marginBottom:8}}>{!user?"Ein kostenloses Konto genügt für den Schnelltest (20 Fragen). Mit Premium: alle 100 Fragen aus allen 7 Bereichen.":isPremium?"100 Fragen aus allen Themenbereichen — zufällig gemischt, mit sofortigem Feedback und Erklärung.":"Im kostenlosen Schnelltest: 20 Fragen aus Grundlagen & Netzwerktechnik. Mit Premium: alle 100 Fragen aus allen 7 Bereichen."}</p>
          <p style={{fontSize:13,color:C.mu,marginBottom:32}}>Fachinformatiker für Systemintegration (FISI) · IHK-Stil</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:32}}>
            {[{n:20,l:"Schnelltest"},{n:50,l:"Halbprüfung"},{n:100,l:"Vollprüfung"}].map(({n,l})=>{
              const locked=!user||(n>20&&!isPremium);
              const lockLabel=!user?"🔒 Konto nötig":"🔒 Premium";
              return(
                <button key={n} onClick={()=>starten(n)} style={{flex:1,maxWidth:120,padding:"16px 8px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.s1,color:C.t,cursor:"pointer",fontFamily:ff,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:20,fontWeight:700,color:C.bl,marginBottom:4}}>{n}</div>
                  <div style={{fontSize:11,color:C.t2}}>{l}</div>
                  {locked&&<div style={{fontSize:10,color:C.am,marginTop:4,fontWeight:600}}>{lockLabel}</div>}
                </button>
              );
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
            {[{e:"🕐",t:"Zeit einteilen",s:"Beantworte zuerst die einfachen Fragen. Schwierige Fragen die Nummer notieren, überspringen und am Ende zurückkehren — bloß nicht vergessen!"},
              {e:"❌",t:"Ausschlussverfahren",s:"Erst offensichtlich falsche Antworten streichen, dann aus den verbleibenden wählen."},
              {e:"📖",t:"Aufgabe komplett lesen",s:"Die Antwort steckt oft im Situationstext — lies die Frage bis zum Ende bevor du antwortest."}
            ].map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <span style={{fontSize:20,flexShrink:0}}>{tip.e}</span>
                <div><p style={{fontSize:13,fontWeight:600,color:C.t,margin:"0 0 2px"}}>{tip.t}</p>
                <p style={{fontSize:12,color:C.t2,margin:0,lineHeight:1.5}}>{tip.s}</p></div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {/* QUIZ */}
      {modus==="quiz"&&q&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:12,color:C.mu}}>Frage {idx+1} / {fragen.length}</span>
          <span style={{fontSize:12,color:C.t2}}>{score} richtig · {kat}</span>
        </div>
        <div style={{height:3,background:C.s2,borderRadius:2,overflow:"hidden",marginBottom:16}}>
          <div style={{height:"100%",width:`${(idx/fragen.length)*100}%`,background:`linear-gradient(90deg,${C.bl},${C.cy})`,borderRadius:2}}/>
        </div>
        <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
          <span style={{fontSize:10,color:C.cy,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{q.kat}</span>
          <p style={{fontSize:15,fontWeight:600,lineHeight:1.5,margin:"6px 0 0"}}>{q.q}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {q.o.map((opt,i)=>{
            let bg=C.s2,bdr=C.bd,col=C.t;
            if(ans){if(i===q.c){bg="#14532d";bdr="#22c55e";col="#86efac";}else if(i===sel){bg="#450a0a";bdr="#ef4444";col="#fca5a5";}}
            return(
              <button key={i} onClick={()=>pick(i)} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",width:"100%",background:bg,border:`1px solid ${bdr}`,borderRadius:10,padding:"11px 14px",cursor:ans?"default":"pointer",color:col,fontFamily:ff,transition:"all .15s"}}>
                <span style={{width:24,height:24,borderRadius:"50%",background:ans&&i===q.c?"#16a34a":ans&&i===sel?"#dc2626":C.bd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0,color:"#fff"}}>
                  {ans&&i===q.c?"✓":ans&&i===sel?"✗":["A","B","C","D"][i]}
                </span>
                <span style={{fontSize:14,lineHeight:1.4}}>{opt}</span>
              </button>
            );
          })}
        </div>
        {ans&&<>
          <div style={{background:sel===q.c?"#f0fdf4":"#fef2f2",border:`0.5px solid ${sel===q.c?"#22c55e":"#ef4444"}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <p style={{fontSize:13,color:sel===q.c?"#15803d":"#b91c1c",lineHeight:1.6,margin:0}}>
              <span style={{fontWeight:600}}>{sel===q.c?"✓ Richtig! ":"✗ Falsch. "}</span>{q.e}
            </p>
          </div>
          <button onClick={next} style={{background:C.bl,color:"#fff",border:"none",borderRadius:10,padding:"13px 18px",fontSize:14,fontWeight:500,cursor:"pointer",width:"100%",fontFamily:ff}}>
            {idx===fragen.length-1?"Ergebnis anzeigen →":"Nächste Frage →"}
          </button>
        </>}
      </>}

      {/* ERGEBNIS */}
      {modus==="done"&&<>
        <div style={{textAlign:"center",padding:"20px 0 24px"}}>
          <div style={{fontSize:56,marginBottom:12}}>{pct>=80?"🎯":pct>=60?"👍":"💪"}</div>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{pct>=80?"Sehr gut!":pct>=60?"Gut gemacht!":"Weiter üben!"}</h2>
          <p style={{fontSize:15,color:C.t2,marginBottom:6}}>{score} von {fragen.length} richtig — {pct}%</p>
          <p style={{fontSize:12,color:C.mu,marginBottom:20}}>{pct>=80?"Prüfungsniveau erreicht":"Noch etwas üben, dann klappt's!"}</p>
          <div style={{height:10,background:C.s2,borderRadius:5,overflow:"hidden",marginBottom:24}}>
            <div style={{height:"100%",width:`${pct}%`,background:pct>=80?C.gr:pct>=60?C.am:"#ef4444",borderRadius:5,transition:"width .6s"}}/>
          </div>
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:user&&pct>=50?12:0}}>
              <button onClick={()=>starten(fragen.length)} style={{background:C.s1,color:C.t2,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"11px 18px",fontSize:13,cursor:"pointer",fontFamily:ff}}>🔄 Nochmal</button>
              <button onClick={reset} style={{background:C.bl,color:"#fff",border:"none",borderRadius:10,padding:"11px 18px",fontSize:13,cursor:"pointer",fontFamily:ff}}>← Neue Runde</button>
            </div>
            {user&&pct>=50&&<button onClick={downloadNachweis} disabled={nachweisBusy} style={{background:"none",color:C.bl,border:`0.5px solid ${C.bl}`,borderRadius:10,padding:"11px 18px",fontSize:13,cursor:"pointer",fontFamily:ff,opacity:nachweisBusy?.6:1,width:"100%",maxWidth:280,margin:"0 auto",display:"block"}}>{nachweisBusy?"Wird erstellt...":"📄 Lernnachweis herunterladen"}</button>}
          </div>
        </div>

        {falsch.length>0&&<>
          <p style={{fontSize:13,fontWeight:600,color:C.co,marginBottom:10}}>✗ Falsch beantwortet ({falsch.length} Fragen)</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {falsch.map((f,i)=>(
              <div key={i} style={{background:"#fef2f2",border:"0.5px solid #ef4444",borderRadius:10,padding:"12px 14px"}}>
                <span style={{fontSize:10,color:C.co,fontWeight:600,textTransform:"uppercase"}}>{f.kat}</span>
                <p style={{fontSize:13,color:"#7f1d1d",margin:"4px 0 6px",lineHeight:1.5}}>{f.q}</p>
                <p style={{fontSize:12,color:"#15803d",margin:0}}>✓ {f.o[f.c]}</p>
              </div>
            ))}
          </div>
        </>}
      </>}
    </div></div>
  );
}

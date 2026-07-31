import { useState, useMemo, useEffect } from "react";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { authFetch } from "./lib/authFetch";
import { generateLernnachweis, logLernnachweis } from "./lib/lernnachweis";
import { tagestippFuerHeute } from "./lib/tagestipps";
import FeedbackUmfrage from "./FeedbackUmfrage";
import { describeError } from "./lib/errorText";
import AuthScreen from "./AuthScreen";
import { Logo } from "./ITDart";
import iconHeaderImg from "./assets/icon-pruefung-header.jpg";
import iconZeitImg from "./assets/icon-pruefung-zeit.jpg";
import iconAusschlussImg from "./assets/icon-pruefung-ausschluss.jpg";
import iconLesenImg from "./assets/icon-pruefung-lesen.jpg";

const C={bg:"#f8fafc",s1:"#ffffff",s2:"#f1f5f9",bd:"#e2e8f0",bl:"#1d4ed8",cy:"#0ea5e9",t:"#0f172a",t2:"#475569",mu:"#94a3b8",gr:"#16a34a",am:"#d97706",co:"#dc2626"};
const ff="system-ui,sans-serif";
const wrap={background:C.bg,color:C.t,minHeight:"100vh",padding:"20px 16px 60px",fontFamily:ff};
const inner={maxWidth:540,margin:"0 auto"};

const PRUEFUNG=[
  {id:1,kat:"Grundlagen",q:"Ein Techniker soll erklären was der Unterschied zwischen RAM und Festplatte ist. Welche Aussage ist korrekt?",o:["RAM und Festplatte sind beide flüchtig","RAM ist schnell und flüchtig, die Festplatte ist langsam und dauerhaft","RAM ist langsam und dauerhaft, die Festplatte ist schnell und flüchtig","RAM und Festplatte sind beide dauerhaft"],c:1,e:"RAM (Arbeitsspeicher) ist sehr schnell, verliert aber alle Daten bei Stromausfall (flüchtig). Die Festplatte speichert dauerhaft, ist aber deutlich langsamer."},
  {id:2,kat:"Grundlagen",q:"Ein PC startet nicht und gibt Pieptöne aus. Auf welcher Ebene liegt das Problem?",o:["Ein Fehler im Betriebssystem beim Start","Eine fehlerhaft installierte Anwendung","Hardware/BIOS (POST-Fehler)","Ein Problem mit der Netzwerkverbindung"],c:2,e:"Pieptöne beim Start kommen vom BIOS/UEFI während des POST (Power-On Self-Test). Sie signalisieren einen Hardwarefehler bevor das Betriebssystem überhaupt lädt."},
  {id:3,kat:"Grundlagen",q:"Welche Speichereinheit ist die größte?",o:["Megabyte","Gigabyte","Kilobyte","Terabyte"],c:3,e:"Reihenfolge: Bit → Byte → Kilobyte → Megabyte → Gigabyte → Terabyte. Ein Terabyte entspricht ca. 1.000 Gigabyte."},
  {id:4,kat:"Grundlagen",q:"Was ist die Aufgabe des Mainboards?",o:["Grafikberechnungen für die Bildausgabe durchführen","Alle Komponenten verbinden und koordinieren","Daten dauerhaft auf einem Datenträger speichern","Ausschließlich Netzwerkverbindungen verwalten"],c:1,e:"Das Mainboard verbindet alle Komponenten: CPU, RAM, Festplatten, Grafikkarte und Peripheriegeräte. Es stellt Busse und Schnittstellen für die Kommunikation bereit."},
  {id:5,kat:"Grundlagen",q:"Ein PC ist sehr langsam und die Festplattenaktivitäts-LED leuchtet dauerhaft. Was ist die wahrscheinlichste Ursache?",o:["Zu wenig RAM — der PC lagert Daten auf die Festplatte aus","Die Festplatte ist mechanisch beschädigt und fällt bald komplett aus","Der Prozessor ist überhitzt und drosselt deshalb die Leistung","Das Betriebssystem ist veraltet und wurde lange nicht aktualisiert"],c:0,e:"Wenn der RAM voll ist, lagert das Betriebssystem Daten auf die Festplatte aus (Swap). Da Festplatten viel langsamer als RAM sind, wird der PC deutlich langsamer."},
  {id:6,kat:"Grundlagen",q:"Was bedeutet die Hexadezimalzahl 'FF'?",o:["255 im Dezimalsystem","256 im Dezimalsystem","128 im Dezimalsystem","100 im Dezimalsystem"],c:0,e:"FF in Hexadezimal: F=15, also FF = 15×16 + 15 = 255. Hexadezimal wird u.a. für MAC-Adressen und Farben verwendet."},
  {id:7,kat:"Grundlagen",q:"Was ist der Unterschied zwischen UEFI und BIOS?",o:["UEFI ist ausschließlich für Linux-Systeme verfügbar","UEFI ist moderner, hat eine GUI und unterstützt größere Festplatten","BIOS ist in jedem Fall schneller als ein modernes UEFI","UEFI wurde inzwischen komplett durch das BIOS abgelöst"],c:1,e:"UEFI ist der Nachfolger des BIOS. Es bietet eine grafische Oberfläche, unterstützt Festplatten über 2 TB und ermöglicht Secure Boot."},
  {id:8,kat:"Grundlagen",q:"Welchen Vorteil hat die SSD gegenüber einer HDD?",o:["Deutlich günstigerer Preis pro Gigabyte Speicherplatz","Grundsätzlich höhere maximale Speicherkapazität","Keine beweglichen Teile — schneller und stoßunempfindlicher","Bessere Kompatibilität mit sehr alten Computersystemen"],c:2,e:"SSDs nutzen Flash-Speicher ohne bewegliche Teile. Das macht sie schneller, leiser, stoßunempfindlicher und energieeffizienter."},
  {id:9,kat:"Grundlagen",q:"Welcher Anschluss verbindet einen Monitor mit einem PC?",o:["USB-A — hauptsächlich für externe Geräte","RJ45 — der Anschluss für Netzwerkkabel","HDMI oder DisplayPort","SATA — die interne Festplattenschnittstelle"],c:2,e:"HDMI und DisplayPort sind die gängigen Schnittstellen für Monitore. SATA ist für Festplatten, RJ45 für Netzwerkkabel."},
  {id:10,kat:"Grundlagen",q:"Was ist ein Treiber?",o:["Ein Programm speziell zum Abspielen von Video- und Audiodateien","Software die dem Betriebssystem ermöglicht mit einem Hardwaregerät zu kommunizieren","Ein Programm zur allgemeinen Optimierung der Systemleistung","Eine spezielle Art von Firewall-Software zum Schutz des Systems"],c:1,e:"Ein Treiber ist ein Programm das als Übersetzer zwischen Betriebssystem und Hardware funktioniert. Ohne Treiber kann das OS ein Gerät nicht nutzen."},
  {id:11,kat:"Grundlagen",q:"Wie viele Bit hat ein Byte?",o:["4","16","8","32"],c:2,e:"1 Byte = 8 Bit. Das ist die kleinste adressierbare Speichereinheit in modernen Computern."},
  {id:12,kat:"Grundlagen",q:"Was passiert in den ersten Sekunden nach dem Einschalten eines PCs?",o:["Der PC lädt automatisch die neuesten Windows-Updates herunter","BIOS/UEFI prüft Hardware (POST), dann lädt der Bootloader das Betriebssystem","Der installierte Virenscanner durchsucht sofort das gesamte System","Der PC baut zuerst eine Verbindung zum Firmennetzwerk auf"],c:1,e:"Beim Start: BIOS/UEFI startet → POST → Bootloader lädt → Betriebssystem-Kernel → Dienste → Desktop."},
  {id:13,kat:"Netzwerk & OSI",q:"Ein Benutzer kann keine Webseiten öffnen, Kollegen im selben Büro haben kein Problem. Was prüft der Techniker zuerst?",o:["Den Webserver im Internet","Die IP-Konfiguration des betroffenen PCs","Den Internetzugang des Unternehmens","Den DNS-Server"],c:1,e:"Da nur ein PC betroffen ist, liegt das Problem lokal. Zuerst IP-Konfiguration prüfen: Hat der PC eine IP? Stimmt Gateway und DNS?"},
  {id:14,kat:"Netzwerk & OSI",q:"Welche OSI-Schicht ist für die physische Übertragung von Bits zuständig?",o:["Schicht 2 – Data Link","Schicht 3 – Network","Schicht 1 – Physical","Schicht 4 – Transport"],c:2,e:"Schicht 1 (Physical) überträgt rohe Bits als elektrische Signale, Lichtsignale oder Funkwellen."},
  {id:15,kat:"Netzwerk & OSI",q:"Was ist der Unterschied zwischen Switch und Hub?",o:["Es gibt technisch keinen relevanten Unterschied zwischen beiden","Switch leitet gezielt an den Empfänger weiter, Hub sendet an alle Ports","Ein Hub ist grundsätzlich schneller als ein vergleichbarer Switch","Ein Switch arbeitet ausschließlich auf der Vermittlungsschicht 3"],c:1,e:"Ein Hub sendet an alle Ports (ineffizient). Ein Switch lernt welches Gerät an welchem Port hängt und sendet gezielt."},
  {id:16,kat:"Netzwerk & OSI",q:"PC hat IP 192.168.1.50 mit Maske 255.255.255.0. Was ist die Netzwerkadresse?",o:["192.168.1.50","192.168.1.1","192.168.1.0","192.168.0.0"],c:2,e:"Bei 255.255.255.0 (/24) sind die ersten drei Oktette das Netzwerk: 192.168.1.0. Hosts: .1 bis .254."},
  {id:17,kat:"Netzwerk & OSI",q:"Was ist die Aufgabe des DNS?",o:["Automatisch IP-Adressen an Geräte vergeben","Domainnamen in IP-Adressen auflösen","Datenpakete zwischen Netzwerken weiterleiten","Verbindungen zwischen zwei Rechnern verschlüsseln"],c:1,e:"DNS übersetzt Domainnamen wie www.google.com in IP-Adressen — erst dann kann der Browser eine Verbindung aufbauen."},
  {id:18,kat:"Netzwerk & OSI",q:"Benutzer kann Kollegen im gleichen Raum anpingen, aber nicht den Server im Rechenzentrum. Ursache?",o:["Das Netzwerkkabel am Arbeitsplatz ist defekt","Der PC hat gar keine gültige IP-Adresse erhalten","Gateway oder Routing falsch konfiguriert","Der Server im Rechenzentrum ist ausgeschaltet"],c:2,e:"Kollege im gleichen Subnetz erreichbar (Schicht 2), Server in anderem Netz nicht — deutet auf Gateway-Problem (Schicht 3) hin."},
  {id:19,kat:"Netzwerk & OSI",q:"Was ist ein VLAN?",o:["Ein besonders stark verschlüsseltes physisches Netzwerk","Logische Trennung eines physischen Netzwerks in virtuelle Netze","Eine Technik für schnelleres und stabileres WLAN","Ein Protokoll zur automatischen Vergabe von IP-Adressen"],c:1,e:"VLANs trennen ein physisches Netzwerk logisch. Geräte im gleichen VLAN kommunizieren direkt, zwischen VLANs muss ein Router vermitteln."},
  {id:20,kat:"Netzwerk & OSI",q:"Welches Protokoll vergibt automatisch IP-Adressen?",o:["DNS","HTTP","DHCP","FTP"],c:2,e:"DHCP vergibt automatisch IP-Adressen, Subnetzmasken, Gateways und DNS-Server an Geräte."},
  {id:21,kat:"Netzwerk & OSI",q:"Was ist der Unterschied zwischen TCP und UDP?",o:["TCP ist in jeder erdenklichen Netzwerksituation grundsätzlich immer schneller als UDP","TCP ist verbindungsorientiert und zuverlässig, UDP schneller aber unzuverlässig","UDP bestätigt zuverlässig und vollständig jeden einzelnen empfangenen Datenblock","TCP wird in der Praxis ausschließlich für Video- und Audio-Streaming eingesetzt"],c:1,e:"TCP: Verbindung, Bestätigung, Neuübertragung bei Verlust — zuverlässig aber langsamer. UDP: Kein Handshake — schneller, für Streaming/VoIP."},
  {id:22,kat:"Netzwerk & OSI",q:"Auf welcher OSI-Schicht arbeitet ein Router?",o:["Schicht 1 – Physical","Schicht 2 – Data Link","Schicht 3 – Network","Schicht 4 – Transport"],c:2,e:"Router arbeiten auf Schicht 3 (Network) und leiten Pakete anhand von IP-Adressen zwischen Netzwerken weiter."},
  {id:23,kat:"Netzwerk & OSI",q:"Was bedeutet '/24' in der Adresse 192.168.1.0/24?",o:["Das Netzwerk besteht aus genau 24 Geräten","Erste 24 Bit sind Netzwerkteil — entspricht 255.255.255.0","Das Netzwerk ist in 24 gleich große Subnetze aufgeteilt","Der zuständige Router verfügt über 24 Ports"],c:1,e:"/24 bedeutet die ersten 24 Bit sind das Netzwerk. Entspricht 255.255.255.0 — 254 nutzbare Hosts (.1 bis .254)."},
  {id:24,kat:"Netzwerk & OSI",q:"Webseite öffnet nicht, aber Ping funktioniert. Wahrscheinlichste Ursache?",o:["Das Netzwerkkabel ist an der Buchse defekt","Port durch Firewall blockiert","Die eingetragene IP-Adresse ist fehlerhaft konfiguriert","Der zuständige DNS-Server ist komplett ausgefallen"],c:1,e:"Ping nutzt ICMP (kein Port). Webseiten brauchen Port 80/443. Ping geht, Browser nicht → Firewall blockiert den Port (Schicht 4)."},
  {id:25,kat:"Netzwerk & OSI",q:"Was ist eine MAC-Adresse?",o:["Eine spezielle IP-Adresse ausschließlich für WLAN-Geräte","Eindeutige Hardware-Adresse jeder Netzwerkkarte","Ein verschlüsseltes Passwort für den Netzwerkzugang","Die feste Verwaltungsadresse eines Routers"],c:1,e:"MAC-Adresse: weltweit eindeutige 48-Bit-Adresse die jeder Netzwerkkarte eingebrannt ist. Arbeitet auf Schicht 2."},
  {id:26,kat:"Netzwerk & OSI",q:"Was ist der Unterschied zwischen HTTP und HTTPS?",o:["HTTPS ist in jedem Fall spürbar schneller als HTTP","HTTPS verschlüsselt per TLS, HTTP überträgt unverschlüsselt","HTTP ist das modernere und aktuellere der beiden Protokolle","Es besteht praktisch kein relevanter Unterschied"],c:1,e:"HTTPS verschlüsselt mit TLS. HTTP überträgt im Klartext — gefährlich für Passwörter und sensible Daten."},
  {id:27,kat:"Netzwerk & OSI",q:"Welche OSI-Schicht ist für TLS-Verschlüsselung zuständig?",o:["Schicht 4 – Transport","Schicht 5 – Session","Schicht 6 – Presentation","Schicht 7 – Application"],c:2,e:"Schicht 6 (Presentation) ist für Datendarstellung und Verschlüsselung zuständig. TLS verschlüsselt auf dieser Schicht."},
  {id:28,kat:"Netzwerk & OSI",q:"Was ist ein Subnetz?",o:["Ein zweiter, redundant eingesetzter Router im Netzwerk","Logisch abgeteilter Teil eines größeren IP-Netzwerks","Ein besonders stark verschlüsselter Netzwerkbereich","Ein Netzwerk ohne jeglichen Zugang zum Internet"],c:1,e:"Subnetting teilt ein großes Netz in kleinere Bereiche — bessere Performance, Sicherheit und Verwaltung."},
  {id:29,kat:"Netzwerk & OSI",q:"Was ist NAT (Network Address Translation)?",o:["Ein Verfahren zur Verschlüsselung von Datenverkehr im Netzwerk","Übersetzung privater in öffentliche IP-Adressen für den Internetzugang","Ein spezielles Protokoll zur Namensauflösung im Internet","Eine Firewall zum Schutz vor unerwünschtem Datenverkehr"],c:1,e:"NAT erlaubt vielen Geräten mit privaten IP-Adressen über eine öffentliche IP ins Internet zu gehen. Der Router übersetzt die Adressen."},
  {id:30,kat:"Netzwerk & OSI",q:"Wofür nutzt ein Techniker 'ipconfig /all' auf Windows?",o:["Den PC über die Kommandozeile ohne weitere Rückfrage sofort neu starten","Alle Netzwerkkonfigurationen anzeigen (IP, Gateway, DNS, MAC)","Ausschließlich die physische Funktion des Netzwerkkabels testen","Ausschließlich den lokal gespeicherten DNS-Cache des Rechners leeren"],c:1,e:"ipconfig /all zeigt alle Netzwerkinformationen: IP, Subnetzmaske, Gateway, DNS, MAC. Wichtigstes Diagnose-Tool für Netzwerkprobleme."},
  {id:31,kat:"Betriebssysteme",q:"Was ist Active Directory?",o:["Ein zentraler Server, der ausschließlich Dateien für alle Mitarbeiter speichert","Verzeichnisdienst zur zentralen Verwaltung von Benutzern, Computern und Gruppen","Ein Antivirenprogramm, das für die gesamte Domäne zentral verwaltet wird","Ein System, das automatisch regelmäßige Sicherungen aller Daten erstellt"],c:1,e:"Active Directory ermöglicht zentrale Verwaltung aller Benutzer, Computer, Drucker und Richtlinien in einem Unternehmensnetzwerk."},
  {id:32,kat:"Betriebssysteme",q:"Unterschied lokaler Benutzer vs. Domänenbenutzer?",o:["Es gibt zwischen beiden Begriffen technisch gesehen keinen echten Unterschied","Lokaler Benutzer nur auf einem Gerät, Domänenbenutzer an allen Domänengeräten","Domänenbenutzer erhalten grundsätzlich deutlich mehr Speicherplatz zugewiesen","Lokale Benutzerkonten gelten grundsätzlich als sicherer als Domänenkonten"],c:1,e:"Lokale Benutzer: nur auf dem jeweiligen Computer. Domänenbenutzer: im AD gespeichert, können sich an jedem Domänencomputer anmelden."},
  {id:33,kat:"Betriebssysteme",q:"Was ist Virtualisierung?",o:["Eine spezielle Methode zur vollständigen Verschlüsselung sämtlicher Daten","Mehrere virtuelle Computer auf einem physischen Server betreiben","Ein Verfahren zur regelmäßigen, automatisierten Sicherung von Daten","Eine bestimmte Art von relationalem oder nicht-relationalem Datenbanksystem"],c:1,e:"Virtualisierung ermöglicht mehrere VMs auf einem Server — bessere Ressourcennutzung, schnellere Bereitstellung, einfachere Verwaltung."},
  {id:34,kat:"Betriebssysteme",q:"Benutzer kann sich nicht anmelden. Warum prüft der Techniker den Domänencontroller?",o:["Der Domänencontroller speichert alle Passwörter unverschlüsselt im Klartext","Domänenanmeldungen werden am DC authentifiziert","Der Domänencontroller startet automatisch alle angeschlossenen PCs","Ohne Domänencontroller funktioniert der Internetzugang nicht mehr"],c:1,e:"Bei Domänenanmeldungen prüft der PC die Credentials am Domänencontroller. Ist er nicht erreichbar, schlägt die Anmeldung fehl."},
  {id:35,kat:"Betriebssysteme",q:"Was ist RAID?",o:["Ein Protokoll zur reinen Übertragung von Daten innerhalb eines Netzwerks","Methode mehrere Festplatten für Datensicherheit oder Performance zu kombinieren","Ein eigenständiges Betriebssystem speziell für den Servereinsatz","Ein Programm zur automatischen, regelmäßigen Erstellung von Backups"],c:1,e:"RAID kombiniert Festplatten. RAID 1 (Spiegelung): Ausfallsicherheit. RAID 0 (Striping): Geschwindigkeit. RAID 5: beides kombiniert."},
  {id:36,kat:"Betriebssysteme",q:"Unterschied NTFS vs. FAT32?",o:["FAT32 gilt als das technisch neuere der beiden Dateisysteme","NTFS unterstützt Zugriffsrechte, Dateien über 4 GB und Journaling — FAT32 nicht","FAT32 ist in der Praxis unter allen Umständen grundsätzlich schneller als NTFS","Es gibt in der praktischen Anwendung keinen relevanten Unterschied zwischen beiden"],c:1,e:"NTFS: Berechtigungen, Dateien über 4 GB, Verschlüsselung, Journaling. FAT32: einfacher, aber 4 GB Dateigrößenlimit, keine Berechtigungen."},
  {id:37,kat:"Betriebssysteme",q:"Was macht 'systemctl restart nginx' unter Linux?",o:["Installiert nginx","Startet den nginx-Dienst neu","Löscht nginx","Zeigt Status von nginx"],c:1,e:"systemctl verwaltet Dienste unter Linux. restart stoppt und startet neu. start/stop/status/enable sind weitere wichtige Optionen."},
  {id:38,kat:"Betriebssysteme",q:"Was ist eine Gruppenrichtlinie (Group Policy)?",o:["Eine einzelne, isolierte Einstellung innerhalb der lokalen Windows-Firewall","Zentrale Konfiguration die Einstellungen auf alle Computer und Benutzer der Domäne anwendet","Ein Plan zur regelmäßigen Sicherung besonders wichtiger Unternehmensdaten","Ein Protokoll zur reinen Kommunikation zwischen einzelnen Netzwerkgeräten"],c:1,e:"GPOs ermöglichen zentrale Verwaltung: Passwortrichtlinien, Desktop, Software, Sicherheitseinstellungen — für alle Nutzer gleichzeitig."},
  {id:39,kat:"Betriebssysteme",q:"Unterschied Prozess vs. Dienst (Service)?",o:["Es gibt zwischen den beiden Begriffen technisch gesehen keinen echten Unterschied","Prozess ist ein laufendes Programm, Dienst läuft im Hintergrund ohne GUI und startet meist automatisch","Dienste laufen grundsätzlich und in jedem Fall deutlich schneller als normale Prozesse","Prozesse verbrauchen grundsätzlich und immer deutlich mehr Arbeitsspeicher als Dienste"],c:1,e:"Jedes laufende Programm ist ein Prozess. Dienste sind spezielle Prozesse die ohne Benutzerinteraktion im Hintergrund laufen."},
  {id:40,kat:"Betriebssysteme",q:"Server soll täglich um 2 Uhr Backup erstellen. Was nutzt der Admin?",o:["Stellt sich dafür einfach einen Wecker im Büro","Task Scheduler (Windows) oder Cron (Linux)","Führt das Backup jede Nacht manuell selbst durch","Nutzt dafür die Windows-Update-Funktion"],c:1,e:"Task Scheduler (Windows) oder Cron (Linux) ermöglichen automatisches Ausführen von Skripten und Programmen zu definierten Zeiten."},
  {id:41,kat:"Betriebssysteme",q:"Unterschied physische vs. virtuelle Maschine?",o:["Virtuelle Maschinen sind grundsätzlich und in jedem Fall schneller als physische Systeme","Physisch ist echte Hardware, virtuell läuft als Software auf einem Hypervisor","Virtuelle Maschinen verfügen grundsätzlich über deutlich mehr Arbeitsspeicher","Es besteht in der Praxis praktisch kein Unterschied zwischen beiden Varianten"],c:1,e:"Eine VM wird durch einen Hypervisor (VMware, Hyper-V) emuliert. Sie teilt physische Ressourcen des Host-Servers mit anderen VMs."},
  {id:42,kat:"Betriebssysteme",q:"Was bedeutet die 3-2-1 Backup-Strategie?",o:["3 Backups pro Tag, verteilt auf 2 Server und 1 Cloud-Dienst","3 Kopien, auf 2 verschiedenen Medien, davon 1 außerhalb des Gebäudes","3 Server im Einsatz, 2 Backup-Läufe, 1 wöchentlicher Test","Aufbewahrung über 3 Tage, 2 Wochen und 1 Monat gestaffelt"],c:1,e:"3-2-1: Mindestens 3 Kopien, auf 2 verschiedenen Medien, davon 1 an einem anderen Standort. Schutz vor Feuer, Diebstahl, Hardwareausfall."},
  {id:43,kat:"Betriebssysteme",q:"Unterschied 32-Bit vs. 64-Bit Betriebssystem?",o:["64-Bit-Systeme sind grundsätzlich doppelt so schnell wie 32-Bit","64-Bit kann mehr RAM adressieren und ist für moderne Software optimiert","32-Bit-Systeme gelten grundsätzlich als sicherer","Es besteht heute kein relevanter Unterschied mehr zwischen beiden"],c:1,e:"32-Bit: max. 4 GB RAM. 64-Bit: theoretisch Exabytes. Moderne Software und Betriebssysteme sind auf 64-Bit ausgelegt."},
  {id:44,kat:"Betriebssysteme",q:"Linux-Server zeigt '/' zu 95% voll. Was tun?",o:["Den Server einfach ohne weitere Prüfung neu starten","Speicher analysieren und nicht benötigte Dateien/Logs löschen","Gleich das komplette Betriebssystem neu installieren","Nichts unternehmen, das ist völlig normal"],c:1,e:"Bei über 90% drohen Systemprobleme. Mit 'du -sh /*' analysieren welche Verzeichnisse viel Platz belegen — oft große Log-Dateien."},
  {id:45,kat:"Betriebssysteme",q:"Was ist LDAP?",o:["Ein Protokoll speziell zur Sicherung von Backup-Daten","Protokoll für den Zugriff auf Verzeichnisdienste wie Active Directory","Ein Tool zur laufenden Überwachung des Netzwerkverkehrs","Ein Protokoll zur Verschlüsselung von Datenverbindungen"],c:1,e:"LDAP (Lightweight Directory Access Protocol) ist das Standardprotokoll für Verzeichnisdienste. Active Directory basiert auf LDAP."},
  {id:46,kat:"IT-Sicherheit",q:"Mitarbeiter erhält E-Mail von 'support@micros0ft.com' mit Bitte sein Passwort zu bestätigen. Was ist das?",o:["Legitime Microsoft-Mail","Phishing-Versuch","Spam","Automatische Sicherheitsmeldung"],c:1,e:"Klassischer Phishing-Versuch. 'micros0ft.com' (Null statt o) ist gefälscht. Legitime Unternehmen fragen niemals per E-Mail nach Passwörtern."},
  {id:47,kat:"IT-Sicherheit",q:"Was ist das CIA-Prinzip?",o:["Bezeichnung eines amerikanischen Geheimdienstes","Confidentiality, Integrity, Availability — die drei Schutzziele","Eine bestimmte Konfiguration für Firewall-Regeln","Ein anerkannter internationaler Verschlüsselungsstandard"],c:1,e:"CIA: Vertraulichkeit (nur Berechtigte sehen Daten), Integrität (Daten unverändert), Verfügbarkeit (Systeme erreichbar)."},
  {id:48,kat:"IT-Sicherheit",q:"Was ist Ransomware?",o:["Ein Antivirenprogramm zum Schutz vor Schadsoftware","Schadsoftware die Daten verschlüsselt und Lösegeld fordert","Ein Filter, der unerwünschte Spam-E-Mails aussortiert","Ein Werkzeug zur automatischen Erstellung von Backups"],c:1,e:"Ransomware verschlüsselt alle erreichbaren Dateien und fordert Lösegeld. Schutz: aktuelle Backups, Updates, keine verdächtigen Anhänge."},
  {id:49,kat:"IT-Sicherheit",q:"Unterschied symmetrische vs. asymmetrische Verschlüsselung?",o:["Symmetrische Verschlüsselung gilt in jedem Fall grundsätzlich als sicherer","Symmetrisch: ein Schlüssel für beide Seiten. Asymmetrisch: Schlüsselpaar öffentlich/privat","Asymmetrische Verschlüsselung ist grundsätzlich und immer schneller als symmetrische","Es gibt zwischen beiden Verschlüsselungsverfahren keinen echten praktischen Unterschied"],c:1,e:"Symmetrisch (AES): gleicher Schlüssel zum Ver- und Entschlüsseln — schnell. Asymmetrisch (RSA): öffentlich verschlüsseln, privat entschlüsseln — sicherer für Schlüsselaustausch."},
  {id:50,kat:"IT-Sicherheit",q:"Kundendaten möglicherweise gestohlen. Was schreibt die DSGVO vor?",o:["Gar nichts, eine Meldung ist nicht erforderlich","Datenschutzbehörde innerhalb 72 Stunden informieren","Es besteht eine Frist von 30 Tagen für eine Meldung","Nur melden, wenn der Angreifer bereits bekannt ist"],c:1,e:"Art. 33 DSGVO: Bei Datenschutzverletzung muss die Aufsichtsbehörde innerhalb 72 Stunden informiert werden."},
  {id:51,kat:"IT-Sicherheit",q:"Was ist Social Engineering?",o:["Ein bestimmtes Paradigma in der Softwareentwicklung","Manipulation von Menschen um vertrauliche Informationen zu erlangen","Eine bestimmte Art, ein Netzwerk physisch aufzubauen","Ein standardisiertes Protokoll für sichere Verbindungen"],c:1,e:"Social Engineering nutzt menschliche Schwächen statt technischer Lücken — z.B. als IT-Support ausgeben und nach Passwörtern fragen."},
  {id:52,kat:"IT-Sicherheit",q:"Was ist eine DMZ im Netzwerk?",o:["Ein besonders gesicherter Bereich ganz ohne Server","Netzwerksegment das öffentliche Server vom internen Netz trennt","Ein verschlüsselter Tunnel zwischen zwei Standorten","Ein Netzwerkbereich, der ganz ohne Firewall auskommt"],c:1,e:"DMZ: Netzwerksegment zwischen Internet und internem Netz. Öffentliche Server (Web, Mail) in der DMZ — werden sie kompromittiert, ist das interne Netz noch geschützt."},
  {id:53,kat:"IT-Sicherheit",q:"Unterschied Firewall vs. IDS?",o:["Es gibt zwischen beiden Systemen keinen echten Unterschied","Firewall blockiert nach Regeln, IDS überwacht und meldet verdächtigen Verkehr","Ein IDS blockiert aktiv, während die Firewall nur meldet","Ein IDS arbeitet grundsätzlich schneller als eine Firewall"],c:1,e:"Firewall: filtert aktiv nach Regeln. IDS (Intrusion Detection System): analysiert auf verdächtige Muster und schlägt Alarm — blockiert nicht selbst."},
  {id:54,kat:"IT-Sicherheit",q:"Was bedeutet das Prinzip der minimalen Rechtevergabe?",o:["Jeder Mitarbeiter erhält grundsätzlich volle Adminrechte","Jeder bekommt nur die Rechte die er für seine Arbeit braucht","In diesem Modell werden grundsätzlich keine Rechte vergeben","Alle Beschäftigten erhalten unabhängig von ihrer Rolle die gleichen Rechte"],c:1,e:"Least Privilege: minimale notwendige Rechte für Benutzer, Systeme und Anwendungen. Begrenzt Schaden bei kompromittierten Konten."},
  {id:55,kat:"IT-Sicherheit",q:"Was ist ein VPN?",o:["Eine Technik für spürbar schnelleres WLAN im heimischen Netzwerk","Verschlüsselter Tunnel für sichere Verbindungen über unsichere Netzwerke","Ein spezielles Antivirenprogramm ausschließlich für Firmennetzwerke","Ein Protokoll zur automatischen Vergabe von IP-Adressen im Netzwerk"],c:1,e:"VPN erstellt einen verschlüsselten Tunnel. Homeoffice-Mitarbeiter nutzen VPN um sicher auf das Firmennetzwerk zuzugreifen."},
  {id:56,kat:"IT-Sicherheit",q:"Was ist Zwei-Faktor-Authentifizierung (2FA)?",o:["Ein besonders kurzes Passwort mit nur zwei Zeichen","Kombination aus zwei Authentifizierungsmethoden (z.B. Passwort + SMS-Code)","Zwei verschiedene Benutzer melden sich gleichzeitig am selben Konto an","Das gleiche Passwort wird einfach zweimal hintereinander eingegeben"],c:1,e:"2FA kombiniert zwei Faktoren: Wissen (Passwort) + Besitz (Smartphone) oder Biometrie. Gestohlenes Passwort allein reicht nicht."},
  {id:57,kat:"IT-Sicherheit",q:"Was ist Patch-Management?",o:["Das physische Reparieren beschädigter Netzwerkkabel","Systematisches Installieren von Software-Updates und Sicherheits-Patches","Ein bestimmtes Verfahren zur regelmäßigen Datensicherung","Die laufende Verwaltung von Benutzerrechten im System"],c:1,e:"Patch-Management stellt sicher dass alle Systeme aktuelle Updates haben. Ungepatchte Systeme sind häufige Einfallstore für Angreifer."},
  {id:58,kat:"IT-Sicherheit",q:"Was ist ein Brute-Force-Angriff?",o:["Ein Angriff, bei dem physisch in ein Gebäude eingebrochen wird","Systematisches Ausprobieren aller möglichen Passwörter","Ein Angriff über eine gefälschte E-Mail mit schädlichem Link","Ein allgemeiner Angriff auf die Netzwerkinfrastruktur"],c:1,e:"Bei Brute-Force werden automatisiert alle möglichen Passwörter durchprobiert. Schutz: starke Passwörter, Kontosperrung nach Fehlversuchen, 2FA."},
  {id:59,kat:"IT-Sicherheit",q:"Was ist eine Schutzbedarfsanalyse?",o:["Eine Messung der aktuellen Geschwindigkeit im Netzwerk","Bewertung welche Daten und Systeme welchen Schutzbedarf haben","Ein regelmäßiger Test, ob vorhandene Backups funktionieren","Das Einrichten und Konfigurieren einer Firewall"],c:1,e:"Schutzbedarfsanalyse: Für jedes System bewerten — wie hoch ist der Schaden bei Verlust von Vertraulichkeit, Integrität oder Verfügbarkeit?"},
  {id:60,kat:"IT-Sicherheit",q:"Unterschied Virus vs. Trojaner?",o:["Es gibt zwischen beiden Begriffen technisch gesehen keinen Unterschied","Virus verbreitet sich selbst, Trojaner tarnt sich als nützliches Programm","Ein Trojaner gilt grundsätzlich als deutlich harmloser als ein Virus","Viren befallen ausschließlich Windows-basierte Betriebssysteme"],c:1,e:"Virus: verbreitet sich durch Infizierung anderer Dateien. Trojaner: tarnt sich als legitimes Programm — der Nutzer installiert ihn selbst."},
  {id:61,kat:"Datenbanken",q:"Was ist ein Primärschlüssel?",o:["Grundsätzlich immer das allererste Feld in jeder Datenbanktabelle","Eindeutiger Wert der jeden Datensatz identifiziert — nicht NULL oder doppelt","Das persönliche Passwort für den Zugriff auf die gesamte Datenbank","Der eindeutige, festgelegte Name einer Tabelle in der Datenbank"],c:1,e:"Primärschlüssel identifiziert jeden Datensatz eindeutig. Darf nicht leer oder doppelt sein. Häufig eine automatisch hochzählende ID."},
  {id:62,kat:"Datenbanken",q:"Was macht: SELECT * FROM Kunden WHERE Stadt = 'München'?",o:["Löscht dauerhaft alle Kundendatensätze aus München","Erstellt eine komplett neue Tabelle namens Kunden","Gibt alle Kundendatensätze zurück bei denen Stadt München ist","Aktualisiert bei allen Kunden das Feld Stadt"],c:2,e:"SELECT liest Daten. * = alle Spalten. FROM Kunden = Tabelle. WHERE Stadt = 'München' = Filter. Ergebnis: alle Kunden aus München."},
  {id:63,kat:"Datenbanken",q:"Was ist Normalisierung?",o:["Die gesamte Datenbank vollständig verschlüsseln","Redundanz durch Aufteilen von Daten in Tabellen entfernen","Die Abfragegeschwindigkeit der Datenbank grundsätzlich erhöhen","Regelmäßig Sicherungskopien der Datenbank erstellen"],c:1,e:"Normalisierung beseitigt Redundanz. Adresse nur einmal gespeichert = nur einmal ändern nötig — keine Inkonsistenzen."},
  {id:64,kat:"Datenbanken",q:"Was ist ein Fremdschlüssel?",o:["Ein spezielles Passwort für externe Benutzerkonten","Feld das auf den Primärschlüssel einer anderen Tabelle verweist","Ein zusätzlich verschlüsselter Primärschlüssel derselben Tabelle","Ein Schlüssel, der einem anderen Unternehmen gehört"],c:1,e:"Fremdschlüssel verweist auf den Primärschlüssel einer anderen Tabelle — so werden Beziehungen hergestellt."},
  {id:65,kat:"Datenbanken",q:"Welcher SQL-Befehl fügt einen neuen Datensatz ein?",o:["UPDATE","SELECT","INSERT INTO","CREATE"],c:2,e:"INSERT INTO Tabelle (Spalten) VALUES (Werte) fügt neue Datensätze ein. UPDATE ändert bestehende. SELECT liest. DELETE löscht."},
  {id:66,kat:"Datenbanken",q:"Was ist eine REST-API?",o:["Eine besondere Art von ausschließlich relationaler Datenbank","Schnittstelle die HTTP-Methoden für Datenaustausch zwischen Systemen nutzt","Ein eigenständiges, komplettes Betriebssystem für Server","Ein spezielles Protokoll ausschließlich zur Verschlüsselung von Daten"],c:1,e:"REST-API: GET (lesen), POST (erstellen), PUT (aktualisieren), DELETE (löschen) — ermöglicht Kommunikation zwischen Systemen."},
  {id:67,kat:"Datenbanken",q:"Unterschied SQL vs. NoSQL?",o:["SQL-Datenbanken sind grundsätzlich und in jedem Fall immer schneller","SQL: relationale Tabellen mit Schema. NoSQL: flexibel für unstrukturierte Daten","NoSQL-Datenbanken unterstützen grundsätzlich und generell keinerlei Abfragen","SQL gilt heute allgemein als vollständig veraltete Technologie"],c:1,e:"SQL: strukturierte Tabellen, feste Beziehungen (MySQL, PostgreSQL). NoSQL: flexibel für große unstrukturierte Daten (MongoDB, Redis)."},
  {id:68,kat:"Datenbanken",q:"Was ist ETL?",o:["Ein Standardprotokoll für die Netzwerkkommunikation","Extract, Transform, Load — Daten zwischen Systemen übertragen","Ein spezielles Verfahren zur Sicherung von Datenbanken","Eine bestimmte Art komplexer Datenbankabfrage"],c:1,e:"ETL: Daten aus Quellsystem extrahieren, ins benötigte Format umwandeln, ins Zielsystem laden. Typisch bei Systemintegration."},
  {id:69,kat:"Datenbanken",q:"Was ist JSON?",o:["Eine eigenständige, objektorientierte Programmiersprache","Leichtgewichtiges Dateiformat für strukturierten Datenaustausch","Eine bestimmte Art von relationalem Datenbanksystem","Ein Protokoll zur Kommunikation zwischen Netzwerkgeräten"],c:1,e:"JSON (JavaScript Object Notation): leichtgewichtig, für Menschen lesbar, von fast allen Sprachen und APIs unterstützt."},
  {id:70,kat:"Datenbanken",q:"Was macht SQL JOIN?",o:["Verbindet dauerhaft zwei komplett voneinander getrennte Datenbanken","Kombiniert Datensätze aus zwei Tabellen anhand eines gemeinsamen Feldes","Löscht automatisch und dauerhaft alle doppelt vorhandenen Datensätze","Erstellt eine völlig neue, zunächst leere Tabelle in der Datenbank"],c:1,e:"JOIN verknüpft Tabellen: Kunden JOIN Bestellungen ON Kunden.ID = Bestellungen.KundenID — Daten aus beiden Tabellen in einer Abfrage."},
  {id:71,kat:"Datenbanken",q:"Was ist Middleware?",o:["Eine bestimmte Ebene innerhalb einer Datenbankarchitektur","Software die verschiedene Systeme verbindet und Datenformate übersetzt","Eine spezielle Variante eines Server-Betriebssystems","Ein physisches Gerät zur Steuerung des Netzwerkverkehrs"],c:1,e:"Middleware sitzt zwischen Systemen, übersetzt Formate und koordiniert Datenaustausch — wichtig wenn alte und neue Systeme zusammenarbeiten."},
  {id:72,kat:"Datenbanken",q:"Was ist eine Datenbank-Transaktion?",o:["Eine einfache, einzelne lesende Abfrage direkt an die Datenbank","Gruppe von Operationen die alle erfolgreich ausgeführt werden oder gar nicht","Eine regelmäßig erstellte Sicherungskopie der gesamten Datenbank","Der reine Anmeldevorgang eines einzelnen Benutzers am System"],c:1,e:"Transaktion garantiert Konsistenz: Überweisung wird nur gebucht wenn sowohl Abbuchung als auch Gutschrift klappen. Sonst Rollback."},
  {id:73,kat:"Skripting",q:"Vorteil von PowerShell gegenüber cmd?",o:["PowerShell ist in jeder Situation grundsätzlich schneller","Gibt Objekte statt Text zurück — ermöglicht komplexe Automatisierung","Die klassische Eingabeaufforderung cmd funktioniert inzwischen gar nicht mehr","PowerShell benötigt im Gegensatz zu cmd keinerlei Installation"],c:1,e:"PowerShell gibt strukturierte Objekte zurück die man direkt weiterverarbeiten kann. cmd gibt nur Text zurück."},
  {id:74,kat:"Skripting",q:"Was macht das '|' (Pipe) in PowerShell/Bash?",o:["Bedeutet in der Skriptsprache eine logische Oder-Verknüpfung","Leitet Ausgabe eines Befehls als Eingabe an den nächsten weiter","Startet im Hintergrund einen komplett neuen Prozess","Kommentiert die gesamte Zeile im Skript aus"],c:1,e:"Die Pipe verbindet Befehle: Get-Process | Sort-Object CPU — Prozessliste wird direkt sortiert. Ermöglicht mächtige Befehlsketten."},
  {id:75,kat:"Skripting",q:"Was ist ein Cronjob?",o:["Ein einzelner Prozess, der unter Linux dauerhaft im Hintergrund läuft","Automatisch geplante Aufgabe unter Linux die zu bestimmten Zeiten ausgeführt wird","Ein spezielles Werkzeug zur Erstellung von Backups unter Linux","Ein Benutzerkonto mit erweiterten Administratorrechten"],c:1,e:"Cron ist ein Zeitplaner. Cronjobs legen fest wann Skripte automatisch ausgeführt werden — täglich, stündlich, minütlich."},
  {id:76,kat:"Skripting",q:"Welcher PowerShell-Befehl zeigt alle laufenden Prozesse?",o:["Show-Process","List-Process","Get-Process","Display-Process"],c:2,e:"Get-Process zeigt alle Prozesse mit Name, PID, CPU- und RAM-Verbrauch. Mit | Where-Object filtern."},
  {id:77,kat:"Skripting",q:"Was macht 'grep' in Linux?",o:["Kopiert Dateien von einem Verzeichnis in ein anderes","Sucht nach Mustern in Dateien oder Ausgaben","Zeigt den aktuell freien Speicherplatz auf der Festplatte","Listet alle aktuell laufenden Prozesse auf"],c:1,e:"grep durchsucht Text nach Mustern. cat syslog | grep 'ERROR' zeigt nur Zeilen mit 'ERROR'."},
  {id:78,kat:"Skripting",q:"Unterschied Skript vs. kompiliertes Programm?",o:["Skripte laufen grundsätzlich immer schneller als kompilierte Programme","Skripte werden interpretiert, Programme vorher in Maschinencode übersetzt","Kompilierte Programme sind grundsätzlich einfacher zu schreiben","Es gibt zwischen beiden praktisch keinen Unterschied"],c:1,e:"Skripte: zur Laufzeit interpretiert — flexibel aber langsamer. Kompilierte Programme: vorher übersetzt — schneller."},
  {id:79,kat:"Skripting",q:"Linux-Befehl um Verzeichnisinhalt anzuzeigen?",o:["dir","show","ls","list"],c:2,e:"ls (list) zeigt Verzeichnisinhalt. ls -la zeigt alle Dateien mit Details. Windows-Äquivalent: 'dir'."},
  {id:80,kat:"Skripting",q:"PowerShell-Befehl um Port 443 auf einem Server zu prüfen?",o:["Ping-Port 443 (dieser Befehl existiert so nicht)","Test-NetConnection -ComputerName server01 -Port 443","Check-Port server01 443 (kein gültiges PowerShell-Cmdlet)","Get-Port server01 (ebenfalls kein reales Cmdlet)"],c:1,e:"Test-NetConnection prüft ob ein TCP-Port erreichbar ist — nützlich um Firewall-Regeln zu testen."},
  {id:81,kat:"Skripting",q:"Was ist eine Variable in einem Skript?",o:["Ein Wert, der im gesamten Skript fest und unveränderlich bleibt","Benannter Speicherplatz der einen Wert enthält der sich ändern kann","Eine feste Konstante mit einem unveränderlichen Wert","Ein reiner Kommentar ohne Auswirkung auf das Skript"],c:1,e:"Variablen speichern Werte. PowerShell: $name = 'Max'. Bash: name='Max'. Der Wert kann sich während der Ausführung ändern."},
  {id:82,kat:"Skripting",q:"Was macht 'chmod 755 skript.sh' unter Linux?",o:["Löscht die Skriptdatei sofort und unwiderruflich vom System","Verschlüsselt den gesamten Inhalt der Skriptdatei vollständig","Setzt Berechtigungen: Eigentümer alles, Gruppe und andere lesen+ausführen","Erstellt eine komplett neue, zunächst leere Skriptdatei mit diesem Namen"],c:2,e:"chmod setzt Dateiberechtigungen. 7=rwx (Eigentümer), 5=rx (Gruppe), 5=rx (andere). Skripte müssen ausführbar sein."},
  {id:83,kat:"Beruf & Projekt",q:"Was ist ein Ticket im IT-Helpdesk?",o:["Ein persönlicher Zugangscode ausschließlich für das Helpdesk-System","Dokumentierte Anfrage oder Störungsmeldung die bearbeitet und nachverfolgt wird","Das persönliche Passwort eines einzelnen registrierten Benutzers","Eine ausgestellte Rechnung für bereits erbrachte IT-Dienstleistungen"],c:1,e:"Ein Ticket dokumentiert Anfragen mit Beschreibung, Priorität, Bearbeiter, Status. Ermöglicht Nachverfolgung und Qualitätssicherung."},
  {id:84,kat:"Beruf & Projekt",q:"Was ist ein SLA?",o:["Ein reiner Lizenzvertrag ausschließlich für den Einsatz von Software","Vertragliche Vereinbarung über Qualität und Reaktionszeiten von IT-Services","Ein offizielles Zertifikat für anerkannte IT-Sicherheitsstandards","Ein Plan zur regelmäßigen Sicherung besonders wichtiger Systeme"],c:1,e:"SLA legt fest welche Servicequalität garantiert wird: z.B. Reaktion bei kritischen Störungen innerhalb 1 Stunde."},
  {id:85,kat:"Beruf & Projekt",q:"Was bedeutet 1st, 2nd und 3rd Level Support?",o:["Drei parallel eingesetzte, unterschiedliche Ticketsysteme","Drei Eskalationsstufen: Helpdesk → Spezialisten → Hersteller","Drei bestimmte Schichten aus dem OSI-Referenzmodell","Drei unterschiedliche Gruppen von Benutzerkonten"],c:1,e:"1st Level: einfache Probleme direkt lösen. 2nd Level: komplexere Fälle (Admins). 3rd Level: Hersteller für unlösbare Probleme."},
  {id:86,kat:"Beruf & Projekt",q:"Was ist eine Bedarfsanalyse?",o:["Eine ausschließlich technische Prüfung der bereits vorhandenen Systeme","Strukturiertes Ermitteln was der Kunde wirklich braucht bevor man eine Lösung entwickelt","Eine detaillierte Kalkulation der voraussichtlich entstehenden Kosten","Ein formales Protokoll zur abschließenden Abnahme des fertigen Projekts"],c:1,e:"Bedarfsanalyse: IST-Zustand und SOLL-Zustand klären. Erst den Bedarf verstehen, dann die richtige Lösung anbieten."},
  {id:87,kat:"Beruf & Projekt",q:"Was ist ein Abnahmeprotokoll?",o:["Ein einfacher, formloser Nachweis über durchgeführte Reparaturarbeiten","Dokument das bestätigt dass eine Leistung vollständig und wie vereinbart erbracht wurde","Eine ausführliche Betriebsanleitung für ein bestimmtes technisches Gerät","Ein automatisch erstelltes Protokoll über regelmäßig durchgeführte Backups"],c:1,e:"Abnahmeprotokoll: formale Bestätigung des Kunden. Schützt Dienstleister vor Nachforderungen, Kunden vor unfertigen Lieferungen."},
  {id:88,kat:"Beruf & Projekt",q:"Was ist ein Pflichtenheft?",o:["Eine allgemeine Liste der Pflichten und Aufgaben von Auszubildenden","Dokument das beschreibt wie der Auftragnehmer die Anforderungen technisch umsetzt","Der offizielle, unterschriebene Arbeitsvertrag zwischen Azubi und Betrieb","Ein umfassendes Konzept zur gesamten IT-Sicherheit des Betriebs"],c:1,e:"Lastenheft (WAS? — Auftraggeber) + Pflichtenheft (WIE? — Auftragnehmer). Das Pflichtenheft ist die verbindliche technische Spezifikation."},
  {id:89,kat:"Beruf & Projekt",q:"Typische Phasen eines IT-Projekts?",o:["Ausschließlich die Phasen Planen, Hacken und Testen","Initiierung, Planung, Durchführung, Abschluss","Vereinfacht nur Start, Mitte und Ende des Projekts","Nur die klassischen Phasen Analyse, Design und Code"],c:1,e:"Initiierung (Auftrag klären) → Planung (Aufgaben, Termine) → Durchführung (Umsetzung) → Abschluss (Abnahme, Dokumentation)."},
  {id:90,kat:"Beruf & Projekt",q:"Was ist ein Meilenstein im Projektplan?",o:["Ausschließlich das offizielle Ende des gesamten Projekts","Wichtiger Zwischenpunkt der einen definierten Zustand markiert","Eine einzelne Aufgabe mit besonders hoher Priorität","Ein erkanntes Risiko im Verlauf des Projekts"],c:1,e:"Meilensteine sind Zwischenziele: 'Bis 15.03 Hardware installiert'. Helfen Fortschritt zu messen und Verzug früh zu erkennen."},
  {id:91,kat:"Beruf & Projekt",q:"Was ist adressatengerechte Kommunikation?",o:["Grundsätzlich immer möglichst viele Fachbegriffe verwenden","Sprache an den Wissensstand des Gesprächspartners anpassen","Grundsätzlich immer nur einfache, allgemeine Sprache nutzen","Grundsätzlich immer schriftlich statt mündlich kommunizieren"],c:1,e:"Adressatengerecht: IT-Laien einfach ohne Fachjargon erklären, erfahrenen Kollegen technisch präzise. Gleiche Botschaft, verschiedene Verpackung."},
  {id:92,kat:"Beruf & Projekt",q:"Was ist Qualitätssicherung in einem IT-Projekt?",o:["Ausschließlich regelmäßige Backups der Projektdaten erstellen","Prozess der sicherstellt dass das Ergebnis den Anforderungen entspricht","Ausschließlich die Geschwindigkeit des Netzwerks testen","Ausschließlich die Projektdokumentation verfassen"],c:1,e:"QS prüft ob Projektergebnis den Anforderungen entspricht: Reviews, Tests, Soll-Ist-Vergleiche. Frühzeitige QS spart Zeit und Kosten."},
  {id:93,kat:"Beruf & Projekt",q:"Was ist die Schweigepflicht im IT-Beruf?",o:["Die Pflicht, grundsätzlich nicht mit Kollegen zu sprechen","Pflicht vertrauliche Informationen nicht an Unbefugte weiterzugeben","Die Pflicht, generell keine dienstlichen E-Mails zu schreiben","Die Pflicht, aufgetretene Fehler niemals zu melden"],c:1,e:"Als IT-Fachmann hat man Zugang zu sensiblen Daten. Schweigepflicht verbietet Weitergabe ohne Berechtigung — auch nach dem Ausscheiden."},
  {id:94,kat:"Beruf & Projekt",q:"Unterschied Teil 1 vs. Teil 2 der IHK-Prüfung für FISI?",o:["Teil 1 gilt grundsätzlich als deutlich schwerer als Teil 2","Teil 1 nach 18 Monaten (Grundlagen), Teil 2 nach 3 Jahren mit betrieblichem Projekt","Teil 2 ist grundsätzlich kürzer und weniger umfangreich als Teil 1","Es existiert für die FISI-Ausbildung nur ein einziger Prüfungsteil"],c:1,e:"AP1 (~18 Monate): Grundlagen schriftlich. AP2 (3 Jahre): betriebliches Projekt + Präsentation + schriftliche Fachprüfung."},
  {id:95,kat:"Beruf & Projekt",q:"Was ist ein Gantt-Diagramm?",o:["Ein Diagramm zur Darstellung der Netzwerktopologie","Visuelle Darstellung von Projektaufgaben über die Zeit","Ein detaillierter Plan zur Vergabe von IP-Adressen","Ein umfassendes Konzept zur IT-Sicherheit"],c:1,e:"Gantt: Alle Projektaufgaben als Balken auf Zeitachse. Zeigt welche Aufgaben parallel laufen, Abhängigkeiten und ob Zeitplan gehalten wird."},
  {id:96,kat:"Beruf & Projekt",q:"Was ist das ITIL-Framework?",o:["Ein bestimmtes Protokoll für die Netzwerkkommunikation","Framework mit Best Practices für IT-Service-Management","Ein spezieller internationaler Standard für IT-Sicherheit","Eine eigenständige, moderne Programmiersprache"],c:1,e:"ITIL beschreibt Best Practices für IT-Prozesse: Incident Management, Change Management, Service Desk und mehr."},
  {id:97,kat:"Beruf & Projekt",q:"Unterschied Lastenheft vs. Pflichtenheft?",o:["Es gibt zwischen beiden Dokumenten keinen echten Unterschied","Lastenheft: WAS will der Auftraggeber. Pflichtenheft: WIE setzt der Auftragnehmer es um","Das Pflichtenheft wird grundsätzlich vor dem Lastenheft erstellt","Lastenheft gilt nur für Software, Pflichtenheft nur für Hardware-Projekte"],c:1,e:"Lastenheft (Auftraggeber): Anforderungen WAS. Pflichtenheft (Auftragnehmer): technische Spezifikation WIE. Pflichtenheft basiert auf Lastenheft."},
  {id:98,kat:"Beruf & Projekt",q:"Was ist Change Management in der IT?",o:["Das turnusmäßige, regelmäßige Wechseln aller vorhandenen Systempasswörter","Kontrollierter Prozess für Planung, Genehmigung und Durchführung von Änderungen an IT-Systemen","Die allgemeine fachliche Ausbildung neu eingestellter Mitarbeiter im Betrieb","Das reine, unkontrollierte Aktualisieren vorhandener Dokumentation"],c:1,e:"Change Management verhindert unkontrollierte Änderungen die zu Ausfällen führen. Jede Änderung muss beantragt, bewertet und genehmigt werden."},
  {id:99,kat:"Beruf & Projekt",q:"Was ist Eskalation im Helpdesk?",o:["Eine formale, schriftliche Beschwerde direkt beim zuständigen Vorgesetzten","Weiterleiten eines Problems an höhere Support-Ebene weil aktuelle Ebene es nicht lösen kann","Das endgültige und vollständige Löschen eines bereits bearbeiteten Tickets","Eine automatisch versendete, allgemeine Benachrichtigungs-E-Mail"],c:1,e:"Eskalation: Problem weiterleiten wenn nicht lösbar oder SLA droht zu platzen. 1st → 2nd → 3rd Level. Gute Dokumentation entscheidend."},
  {id:100,kat:"Beruf & Projekt",q:"Was muss ein FISI-Azubi für das betriebliche Abschlussprojekt erstellen?",o:["Ausschließlich die technische Umsetzung des Projekts","Projektantrag, Dokumentation, Präsentation und Fachgespräch","Ausschließlich eine mündliche Präsentation vor dem Ausschuss","Ausschließlich funktionierenden Programmiercode"],c:1,e:"Betriebliches Projekt: Projektantrag → Dokumentation (max. 15 Seiten) → Präsentation (15 Min.) → Fachgespräch (15 Min.) vor dem Prüfungsausschuss."},
  {id:101,kat:"Grundlagen",q:"Welcher Dezimalwert entspricht der Binärzahl 11010000?",o:["200 im Dezimalsystem","208 im Dezimalsystem","216 im Dezimalsystem","176 im Dezimalsystem"],c:1,e:"1101 0000 = 128+64+16 = 208. Jede Stelle entspricht einer Zweierpotenz, von rechts beginnend mit 2⁰."},
  {id:102,kat:"Grundlagen",q:"Wie lautet die Dezimalzahl 100 als 8-Bit-Binärzahl?",o:["01100010","01100100","01101000","01100110"],c:1,e:"100 = 64 + 32 + 4 = 0110 0100. Zerlegung in Zweierpotenzen von links nach rechts: 128, 64, 32, 16, 8, 4, 2, 1."},
  {id:103,kat:"Grundlagen",q:"Welcher Hexadezimalwert entspricht der Binärzahl 10101100?",o:["AB","AC","BC","A4"],c:1,e:"Vier Bit ergeben eine Hex-Stelle: 1010 = A, 1100 = C. Ergebnis: AC."},
  {id:104,kat:"Grundlagen",q:"Eine Datei ist 80 MB groß. Wie lange dauert der Download bei 8 Mbit/s Leitungsgeschwindigkeit (ohne Overhead)?",o:["10 Sekunden","80 Sekunden","640 Sekunden","8 Sekunden"],c:1,e:"80 MB entsprechen 80×8 = 640 Mbit. Bei 8 Mbit/s dauert die Übertragung 640/8 = 80 Sekunden. Leitungsgeschwindigkeiten werden in Bit, Dateigrößen in Byte angegeben — ein klassischer Umrechnungsfehler."},
  {id:105,kat:"Grundlagen",q:"Wie viele Byte entsprechen 2 KiB im Binärsystem?",o:["2000 Byte","2048 Byte","1024 Byte","4096 Byte"],c:1,e:"1 KiB = 1024 Byte (binäre Definition). 2 KiB = 2 × 1024 = 2048 Byte."},
  {id:106,kat:"Netzwerk & OSI",q:"Welche Subnetzmaske entspricht der Schreibweise /26?",o:["255.255.255.128","255.255.255.192","255.255.255.224","255.255.255.240"],c:1,e:"/26 bedeutet 26 Einsen: die letzten 6 Bit des letzten Oktetts bleiben für Hosts. 256−2⁶=256−64=192, also 255.255.255.192."},
  {id:107,kat:"Netzwerk & OSI",q:"Welcher CIDR-Wert entspricht der Subnetzmaske 255.255.240.0?",o:["/18","/20","/22","/24"],c:1,e:"240 = 1111 0000 — vier gesetzte Bit im dritten Oktett. 16 (aus den ersten beiden Oktetten) + 4 = 20, also /20."},
  {id:108,kat:"Netzwerk & OSI",q:"Wie viele nutzbare Host-Adressen bietet ein /28-Subnetz?",o:["16","14","30","8"],c:1,e:"Bei /28 bleiben 4 Bit für Hosts: 2⁴ = 16 Adressen, abzüglich Netzwerk- und Broadcast-Adresse bleiben 14 nutzbare Hosts."},
  {id:109,kat:"Netzwerk & OSI",q:"PC hat die IP 10.0.5.130/25. Wie lautet die zugehörige Broadcast-Adresse?",o:["10.0.5.127","10.0.5.255","10.0.5.191","10.0.255.255"],c:1,e:"Bei /25 liegt 130 im zweiten Block (128–255). Netzwerkadresse ist 10.0.5.128, letzte Adresse dieses Blocks und damit Broadcast ist 10.0.5.255."},
  {id:110,kat:"Netzwerk & OSI",q:"Welche Netzwerkadresse hat die IP 172.16.50.77 mit der Maske 255.255.255.0?",o:["172.16.0.0","172.16.50.0","172.16.50.77","172.16.51.0"],c:1,e:"Bei einer /24-Maske (255.255.255.0) bleiben die ersten drei Oktette erhalten, das letzte wird auf 0 gesetzt: 172.16.50.0."},
  {id:111,kat:"Netzwerk & OSI",q:"Ein /24-Netz wird in gleich große /27-Subnetze aufgeteilt. Wie viele Subnetze entstehen?",o:["4","8","16","32"],c:1,e:"Von /24 auf /27 werden 3 zusätzliche Bit fürs Subnetting verwendet. 2³ = 8 gleich große Subnetze entstehen."},
  {id:112,kat:"Netzwerk & OSI",q:"Wie viele nutzbare Host-Adressen passen maximal in ein /29-Netz?",o:["8","6","4","2"],c:1,e:"Bei /29 bleiben 3 Bit für Hosts: 2³ = 8 Adressen, minus Netzwerk- und Broadcast-Adresse ergibt 6 nutzbare Hosts."},
  {id:113,kat:"Betriebssysteme",q:"Ein RAID 1 besteht aus zwei 2-TB-Festplatten. Wie groß ist die nutzbare Kapazität?",o:["4 TB","2 TB","1 TB","3 TB"],c:1,e:"RAID 1 spiegelt die Daten — die nutzbare Kapazität entspricht der Größe einer einzelnen Festplatte, hier also 2 TB, nicht der Summe."},
  {id:114,kat:"Betriebssysteme",q:"Ein RAID 5 besteht aus vier 1-TB-Festplatten. Wie groß ist die nutzbare Kapazität?",o:["4 TB","3 TB","2 TB","1 TB"],c:1,e:"Bei RAID 5 entspricht die nutzbare Kapazität (n−1) Festplatten, da eine Festplatte für Paritätsinformationen verwendet wird: (4−1)×1 TB = 3 TB."},
  {id:115,kat:"Betriebssysteme",q:"Ein RAID 0 besteht aus drei 500-GB-Festplatten. Wie groß ist die Gesamtkapazität?",o:["500 GB","1500 GB","1000 GB","250 GB"],c:1,e:"RAID 0 verteilt Daten auf alle Platten ohne Redundanz (Striping) — die Kapazitäten addieren sich: 3 × 500 GB = 1500 GB."},
  {id:116,kat:"Service-Desk & Kundenanfragen",q:"Was legt ein SLA (Service Level Agreement) fest?",o:["Ausschließlich die Verkaufspreise der angebotenen IT-Produkte","Vertraglich vereinbarte Leistungsniveaus wie Reaktions- und Lösungszeiten","Ausschließlich die Namen der zuständigen Support-Mitarbeiter","Ausschließlich das verwendete Ticketsystem des Anbieters"],c:1,e:"Ein SLA definiert messbare Leistungszusagen zwischen Dienstleister und Kunde, z. B. Reaktionszeit bei kritischen Störungen oder maximale Ausfallzeit."},
  {id:117,kat:"Service-Desk & Kundenanfragen",q:"Ein Kunde ruft mit einem Problem an, das der First-Level-Support nicht lösen kann. Was passiert als Nächstes?",o:["Der Anruf wird einfach ohne weitere Rückmeldung beendet","Weiterleitung an den Second-Level-Support mit spezialisierterem Fachwissen","Der Kunde wird gebeten, es einfach zu einem späteren Zeitpunkt erneut zu versuchen","Das Ticket wird sofort und ohne Lösung geschlossen"],c:1,e:"First-Level löst Standardanfragen. Reicht das nicht, erfolgt eine Eskalation an den Second-Level (tieferes Fachwissen) oder Third-Level (Spezialisten/Entwickler)."},
  {id:118,kat:"Service-Desk & Kundenanfragen",q:"Wonach richtet sich die Priorität eines Tickets typischerweise?",o:["Ausschließlich danach, welcher Mitarbeiter gerade zeitlich verfügbar ist","Nach einer Kombination aus Dringlichkeit und Auswirkung auf den Geschäftsbetrieb","Ausschließlich nach der alphabetischen Reihenfolge der Kundennamen","Ausschließlich nach dem Zeitpunkt der Ticket-Erstellung"],c:1,e:"Priorität = Dringlichkeit × Auswirkung. Ein Serverausfall im gesamten Unternehmen hat höhere Priorität als ein einzelner defekter Drucker."},
  {id:119,kat:"Service-Desk & Kundenanfragen",q:"Was ist bei der Nutzung von Remote-Support-Tools beim Kunden besonders wichtig?",o:["Der Zugriff darf auch grundsätzlich ohne Wissen des Kunden erfolgen","Ausdrückliche Zustimmung des Kunden vor jedem Fernzugriff auf sein System","Remote-Support-Tools benötigen grundsätzlich keinerlei Authentifizierung","Der Kunde muss während der gesamten Sitzung den Bildschirm ausschalten"],c:1,e:"Fernzugriff auf fremde Systeme ohne Einwilligung ist unzulässig. Der Kunde muss zustimmen und sollte die Sitzung jederzeit beenden können."},
  {id:120,kat:"Service-Desk & Kundenanfragen",q:"Wofür wird eine Wissensdatenbank (Knowledge Base) im Support eingesetzt?",o:["Ausschließlich zur Speicherung der Gehaltsabrechnungen der Mitarbeiter","Sammlung bekannter Lösungen, damit wiederkehrende Probleme schneller gelöst werden","Ausschließlich als Werbeplattform für neue Produkte des Unternehmens","Ausschließlich zur Verwaltung der Urlaubsanträge des Support-Teams"],c:1,e:"Eine Knowledge Base dokumentiert bekannte Probleme und Lösungswege — spart Zeit, da nicht jedes Problem neu analysiert werden muss."},
  {id:121,kat:"Service-Desk & Kundenanfragen",q:"Was misst die Kennzahl MTTR (Mean Time To Repair)?",o:["Die durchschnittliche Anzahl der Tickets pro Support-Mitarbeiter","Die durchschnittliche Zeit von der Störungsmeldung bis zur Behebung","Die durchschnittliche Anzahl neu eingestellter Support-Mitarbeiter","Die durchschnittliche Kundenzufriedenheit in Prozent"],c:1,e:"MTTR (Mean Time To Repair) ist die durchschnittliche Wiederherstellungszeit — eine zentrale Kennzahl zur Bewertung der Support-Effizienz."},
  {id:122,kat:"Service-Desk & Kundenanfragen",q:"Was gehört zwingend in eine nachvollziehbare Ticket-Dokumentation?",o:["Ausschließlich der Name des Kunden, sonst nichts Weiteres","Problem, durchgeführte Schritte und die tatsächliche Lösung","Ausschließlich die Uhrzeit der Ticket-Erstellung","Ausschließlich eine grobe Einschätzung der Ticket-Priorität"],c:1,e:"Eine gute Dokumentation macht nachvollziehbar was gemeldet wurde, welche Schritte unternommen wurden und wie das Problem gelöst wurde — wichtig für Kollegen und spätere Fälle."},
  {id:123,kat:"Service-Desk & Kundenanfragen",q:"Ein Server-Ausfall betrifft die gesamte Belegschaft eines Unternehmens. Wie wird so ein Fall im ITIL-Kontext bezeichnet?",o:["Ein gewöhnlicher Incident wie jeder andere auch","Ein Major Incident, der besondere Priorität und Prozesse auslöst","Ein reines Service-Request ohne besondere Dringlichkeit","Ein Change, der erst zur nächsten Wartung umgesetzt wird"],c:1,e:"Ein Major Incident hat massive Auswirkungen auf den Geschäftsbetrieb und wird mit höchster Priorität und oft eigenem Eskalationsprozess behandelt."},
  {id:124,kat:"Service-Desk & Kundenanfragen",q:"Was ist ein Service-Katalog (Service Catalog)?",o:["Eine reine Preisliste für Hardware-Produkte des Unternehmens","Übersicht aller angebotenen IT-Services inklusive deren Leistungsumfang","Eine vollständige Liste aller aktuell offenen Support-Tickets","Eine Übersicht aller Mitarbeiter der IT-Abteilung"],c:1,e:"Der Service-Katalog listet auf, welche IT-Services ein Anbieter überhaupt bereitstellt, oft inklusive Leistungsumfang und zugehörigem SLA."},
  {id:125,kat:"Service-Desk & Kundenanfragen",q:"Warum ist eine Rückfrage beim Kunden nach dem Schließen eines Tickets sinnvoll?",o:["Sie ist grundsätzlich nicht sinnvoll und reine Zeitverschwendung","Sie bestätigt, dass die Lösung tatsächlich dauerhaft funktioniert","Sie dient ausschließlich der Grundlage für die Gehaltsabrechnung","Sie ist gesetzlich für jedes einzelne Ticket zwingend vorgeschrieben"],c:1,e:"Eine Rückmeldung stellt sicher, dass das Problem wirklich behoben ist und deckt auf, falls es erneut auftritt — wichtig für die Servicequalität."},
  {id:126,kat:"Service-Desk & Kundenanfragen",q:"Ein System hat eine vereinbarte Verfügbarkeit von 99,9 % im Jahr. Was bedeutet das ungefähr für die maximale Ausfallzeit?",o:["Ca. 8,8 Stunden Ausfallzeit im Jahr","Ca. 88 Stunden Ausfallzeit im Jahr","Das System darf im Jahr gar nicht ausfallen","Ca. 30 Tage Ausfallzeit im Jahr"],c:0,e:"99,9 % Verfügbarkeit erlaubt ca. 0,1 % Ausfallzeit im Jahr: 0,001 × 365 × 24 Stunden ≈ 8,8 Stunden — ein gängiger SLA-Richtwert."},
  {id:127,kat:"Service-Desk & Kundenanfragen",q:"Was unterscheidet einen Service Request von einem Incident?",o:["Es gibt zwischen beiden Begriffen keinen praktischen Unterschied","Ein Service Request ist eine Standardanfrage, ein Incident eine ungeplante Störung","Ein Incident wird grundsätzlich nie im Ticketsystem erfasst","Ein Service Request hat immer höhere Priorität als jeder Incident"],c:1,e:"Service Request: geplante Standardanfrage (z. B. neuer Zugang beantragen). Incident: ungeplante Störung eines funktionierenden Services."},
  {id:128,kat:"Cyber-physische Systeme & IoT",q:"Was ist der grundlegende Unterschied zwischen einem Sensor und einem Aktor?",o:["Es gibt zwischen beiden Begriffen keinen technischen Unterschied","Ein Sensor erfasst Messwerte, ein Aktor führt physische Aktionen aus","Ein Aktor erfasst ausschließlich Temperaturwerte in der Umgebung","Ein Sensor kann ausschließlich elektrische Motoren steuern"],c:1,e:"Sensoren erfassen physikalische Größen (Temperatur, Bewegung, Licht) und wandeln sie in elektrische Signale um. Aktoren setzen Steuersignale in physische Bewegung/Aktion um (z. B. Motor, Ventil)."},
  {id:129,kat:"Cyber-physische Systeme & IoT",q:"Was ist MQTT und wofür wird es typischerweise eingesetzt?",o:["Ein Protokoll zur Verschlüsselung von Festplatten","Ein leichtgewichtiges Nachrichtenprotokoll für IoT-Geräte mit begrenzten Ressourcen","Ein Protokoll ausschließlich zur Übertragung von Videostreams","Eine Programmiersprache speziell für Microcontroller"],c:1,e:"MQTT ist ein publish/subscribe-Protokoll, das wegen seines geringen Overheads ideal für IoT-Geräte mit schwacher Hardware und Netzwerkanbindung ist."},
  {id:130,kat:"Cyber-physische Systeme & IoT",q:"Was ist ein wesentlicher Unterschied zwischen Raspberry Pi und Arduino?",o:["Es gibt zwischen beiden Geräten keinen relevanten Unterschied","Raspberry Pi ist ein vollwertiger Minicomputer mit Betriebssystem, Arduino ein Microcontroller-Board ohne klassisches OS","Arduino besitzt grundsätzlich immer mehr Rechenleistung als ein Raspberry Pi","Ein Raspberry Pi kann ausschließlich zur Steuerung von LEDs verwendet werden"],c:1,e:"Der Raspberry Pi läuft mit einem vollständigen Betriebssystem (z. B. Linux) wie ein kleiner PC. Der Arduino ist ein einfacher Microcontroller für gezielte Steuer-/Sensoraufgaben, meist ohne eigenes OS."},
  {id:131,kat:"Cyber-physische Systeme & IoT",q:"Was versteht man unter Edge Computing?",o:["Datenverarbeitung ausschließlich in einem zentralen Cloud-Rechenzentrum","Datenverarbeitung nah am Entstehungsort statt zentral in der Cloud","Eine spezielle Methode zur Verschlüsselung von Netzwerkverkehr","Ein Verfahren zur automatisierten Sicherung von Datenbanken"],c:1,e:"Edge Computing verarbeitet Daten direkt am oder nahe dem Erfassungsort (z. B. im Gerät selbst) — reduziert Latenz und Datenverkehr zur Cloud."},
  {id:132,kat:"Cyber-physische Systeme & IoT",q:"Warum ist Energieeffizienz bei vielen IoT-Geräten besonders wichtig?",o:["Weil IoT-Geräte grundsätzlich niemals mit Strom versorgt werden dürfen","Weil viele IoT-Geräte batteriebetrieben sind und selten gewartet werden","Weil IoT-Geräte gesetzlich zu höherem Stromverbrauch verpflichtet sind","Energieeffizienz spielt bei IoT-Geräten grundsätzlich keine Rolle"],c:1,e:"Viele IoT-Sensoren laufen jahrelang batteriebetrieben an schwer zugänglichen Orten — ein hoher Stromverbrauch würde häufigen Batteriewechsel erfordern."},
  {id:133,kat:"Cyber-physische Systeme & IoT",q:"Was zeichnet ein Echtzeitsystem (Realtime System) aus?",o:["Es liefert Ergebnisse irgendwann, der genaue Zeitpunkt ist unerheblich","Es garantiert eine Reaktion innerhalb einer fest definierten Zeitspanne","Es kann ausschließlich einmal täglich Daten verarbeiten","Es benötigt grundsätzlich keine Netzwerkverbindung"],c:1,e:"Echtzeitsysteme garantieren, dass eine Reaktion innerhalb einer definierten, oft sehr kurzen Zeitspanne erfolgt — kritisch z. B. bei Steuerungen in der Industrie."},
  {id:134,kat:"Cyber-physische Systeme & IoT",q:"Warum gelten werkseitige Standard-Passwörter bei IoT-Geräten als großes Sicherheitsrisiko?",o:["Weil sie technisch grundsätzlich gar nicht funktionieren","Weil sie oft öffentlich bekannt sind und selten geändert werden","Weil IoT-Geräte grundsätzlich überhaupt keine Passwörter unterstützen","Weil Standard-Passwörter die Internetverbindung verlangsamen"],c:1,e:"Standard-Passwörter vieler IoT-Geräte sind öffentlich dokumentiert. Werden sie nicht geändert, können Angreifer trivial Zugriff erlangen — eine häufige Ursache für IoT-Botnetze."},
  {id:135,kat:"Cyber-physische Systeme & IoT",q:"Wofür steht GPIO bei Microcontrollern und Einplatinencomputern?",o:["General Purpose Input/Output — frei programmierbare Anschlüsse für Sensoren/Aktoren","Ein spezielles Protokoll ausschließlich für WLAN-Verbindungen","Eine Bezeichnung für den internen Arbeitsspeicher des Geräts","Ein Dateisystem, das ausschließlich auf Microcontrollern verwendet wird"],c:0,e:"GPIO-Pins sind frei programmierbare Anschlüsse, über die externe Bauteile wie LEDs, Sensoren oder Motoren angesteuert bzw. ausgelesen werden."},
  {id:136,kat:"Cyber-physische Systeme & IoT",q:"Wofür ist LoRaWAN besonders geeignet?",o:["Für sehr hohe Datenraten auf kurze Distanz wie bei WLAN","Für stromsparende Funkübertragung über große Reichweiten bei geringer Datenrate","Ausschließlich für die kabelgebundene Vernetzung von Servern","Für Videostreaming in Full-HD-Qualität"],c:1,e:"LoRaWAN überträgt kleine Datenmengen über mehrere Kilometer bei sehr geringem Stromverbrauch — ideal für verteilte IoT-Sensoren, ungeeignet für große Datenmengen."},
  {id:137,kat:"Cyber-physische Systeme & IoT",q:"Warum sind regelmäßige Firmware-Updates bei IoT-Geräten wichtig?",o:["Firmware-Updates sind bei IoT-Geräten grundsätzlich nicht vorgesehen","Sie schließen bekannte Sicherheitslücken und verbessern die Funktion","Sie dienen ausschließlich der Änderung der Geräte-Optik","Firmware-Updates verringern grundsätzlich die Akkulaufzeit dauerhaft"],c:1,e:"Wie bei jeder Software können auch in IoT-Firmware Sicherheitslücken entdeckt werden. Ohne Updates bleiben Geräte dauerhaft angreifbar."},
  {id:138,kat:"Cyber-physische Systeme & IoT",q:"Was versteht man allgemein unter einem cyber-physischen System?",o:["Ein System, das ausschließlich in der Cloud betrieben wird","Ein System, das physische Prozesse mit Software/Vernetzung koppelt und steuert","Ein System, das ausschließlich zur Verwaltung von Benutzerkonten dient","Ein rein theoretisches Konzept ohne praktische Anwendung"],c:1,e:"Cyber-physische Systeme verbinden physische Komponenten (Sensoren, Aktoren, Maschinen) mit informationstechnischen Systemen zur Steuerung und Überwachung — Grundlage von Industrie 4.0."},
  {id:139,kat:"Cyber-physische Systeme & IoT",q:"Was bezeichnet der Begriff \"Industrie 4.0\"?",o:["Die vierte grundlegende Neuerfindung der klassischen Buchhaltung","Die Vernetzung von Produktionsanlagen mit IT-Systemen für intelligente, automatisierte Fertigung","Eine bestimmte Version des Betriebssystems Windows","Ein reines Marketingbegriff ohne technischen Hintergrund"],c:1,e:"Industrie 4.0 beschreibt die Vernetzung von Maschinen, Sensoren und IT-Systemen in der Produktion — Maschinen kommunizieren und passen sich eigenständig an."},
  {id:140,kat:"Kaufmännische Grundlagen",q:"Was ist der Unterschied zwischen Rabatt und Skonto?",o:["Es gibt zwischen beiden Begriffen keinen Unterschied","Rabatt mindert den Preis direkt, Skonto ist ein Nachlass bei schneller Zahlung","Skonto gilt ausschließlich für Bestandskunden, Rabatt nur für Neukunden","Rabatt wird ausschließlich bei Barzahlung gewährt"],c:1,e:"Rabatt: Preisnachlass unabhängig vom Zahlungsverhalten (z. B. Mengenrabatt). Skonto: zusätzlicher Nachlass, wenn innerhalb einer festgelegten Frist gezahlt wird."},
  {id:141,kat:"Kaufmännische Grundlagen",q:"Was unterscheidet die gesetzliche Gewährleistung von einer freiwilligen Garantie?",o:["Es gibt zwischen beiden Begriffen keinen praktischen Unterschied","Gewährleistung ist gesetzlich vorgeschrieben, Garantie eine freiwillige Zusatzleistung des Herstellers","Garantie ist gesetzlich vorgeschrieben, Gewährleistung freiwillig","Beide Begriffe gelten ausschließlich für gebrauchte Ware"],c:1,e:"Gewährleistung ist gesetzlich verpflichtend (i. d. R. 2 Jahre) und gilt gegenüber dem Verkäufer. Garantie ist eine freiwillige, meist zeitlich befristete Zusatzleistung des Herstellers."},
  {id:142,kat:"Kaufmännische Grundlagen",q:"Was gehört typischerweise in ein kaufmännisches Angebot an einen Kunden?",o:["Ausschließlich der Name des zuständigen Ansprechpartners","Leistungsbeschreibung, Preise, Lieferzeit und Zahlungsbedingungen","Ausschließlich das Datum der Angebotserstellung","Ausschließlich die Steuernummer des anbietenden Unternehmens"],c:1,e:"Ein vollständiges Angebot beschreibt die Leistung, nennt Preise, Lieferzeit, Zahlungsbedingungen und die Gültigkeitsdauer des Angebots."},
  {id:143,kat:"Kaufmännische Grundlagen",q:"Was versteht man in der Kalkulation unter dem Bezugspreis?",o:["Ausschließlich den Verkaufspreis an den Endkunden","Den Einkaufspreis einer Ware zuzüglich aller Beschaffungsnebenkosten","Ausschließlich die im Katalog des Herstellers gelistete Preisempfehlung","Ausschließlich die anfallende Umsatzsteuer auf eine Ware"],c:1,e:"Der Bezugspreis umfasst den reinen Einkaufspreis plus Nebenkosten wie Fracht, Verpackung oder Versicherung — Grundlage für die weitere Kalkulation."},
  {id:144,kat:"Kaufmännische Grundlagen",q:"Warum ist es sinnvoll, vor einer größeren Beschaffung mehrere Angebote einzuholen?",o:["Weil das gesetzlich für jede Bestellung zwingend vorgeschrieben ist","Um Preise, Lieferzeiten und Konditionen verschiedener Anbieter vergleichen zu können","Weil ein einzelnes Angebot grundsätzlich rechtlich nicht bindend wäre","Um dem erstgenannten Anbieter bewusst mehr Zeit einzuräumen"],c:1,e:"Ein Angebotsvergleich hilft, das wirtschaftlichste Angebot zu identifizieren — nicht nur der Preis zählt, auch Lieferzeit, Qualität und Zahlungsbedingungen."},
  {id:145,kat:"Kaufmännische Grundlagen",q:"Was beschreibt der Mindestbestand in der Lagerhaltung?",o:["Die maximale Menge, die ein Lager überhaupt fassen kann","Die Bestandsmenge, bei deren Erreichen eine Nachbestellung ausgelöst werden sollte","Die Menge, die am Ende jedes Geschäftsjahres verschrottet wird","Die durchschnittliche Anzahl der täglichen Lagerzugriffe"],c:1,e:"Der Mindestbestand (Meldebestand) ist der Schwellenwert, bei dessen Unterschreiten rechtzeitig nachbestellt werden muss, um Lieferengpässe zu vermeiden."},
  {id:146,kat:"Kaufmännische Grundlagen",q:"Was wird bei der Rechnungsprüfung im Wareneingang typischerweise kontrolliert?",o:["Ausschließlich das Layout und die Farbgestaltung der Rechnung","Ob gelieferte Menge, Preise und bestellte Ware mit der Rechnung übereinstimmen","Ausschließlich die Rechtschreibung der Rechnung","Ausschließlich das Datum des Rechnungsversands"],c:1,e:"Die Rechnungsprüfung vergleicht Bestellung, Lieferschein und Rechnung — stimmen Menge, Artikel und Preise nicht überein, wird reklamiert."},
  {id:147,kat:"Kaufmännische Grundlagen",q:"Was ist der Unterschied zwischen Brutto- und Nettopreis?",o:["Es gibt zwischen beiden Preisangaben keinen Unterschied","Der Bruttopreis enthält die Umsatzsteuer, der Nettopreis nicht","Der Nettopreis enthält die Umsatzsteuer, der Bruttopreis nicht","Beide Begriffe beziehen sich ausschließlich auf den Wareneinkauf"],c:1,e:"Nettopreis = Preis ohne Umsatzsteuer. Bruttopreis = Nettopreis plus Umsatzsteuer, also der tatsächlich zu zahlende Endpreis."},
  {id:148,kat:"Kaufmännische Grundlagen",q:"Was drückt der Gemeinkostenzuschlag in der Kalkulation aus?",o:["Ausschließlich den direkt einer Ware zurechenbaren Materialpreis","Anteil der allgemeinen Betriebskosten, der auf den Verkaufspreis umgelegt wird","Ausschließlich die gesetzlich vorgeschriebene Umsatzsteuer","Ausschließlich den Gewinn, den ein Unternehmen anstrebt"],c:1,e:"Gemeinkosten (Miete, Verwaltung, Strom etc.) lassen sich nicht direkt einer Ware zuordnen — der Gemeinkostenzuschlag verteilt sie anteilig auf die Verkaufspreise."},
  {id:149,kat:"Kaufmännische Grundlagen",q:"Was ist eine Ausschreibung?",o:["Eine informelle, unverbindliche Preisanfrage per Telefon","Ein formalisiertes Verfahren, bei dem Anbieter zur Abgabe vergleichbarer Angebote aufgefordert werden","Eine interne Mitteilung ausschließlich an eigene Mitarbeiter","Ein rein rechtlich bedeutungsloses Marketinginstrument"],c:1,e:"Bei einer Ausschreibung werden potenzielle Lieferanten unter festgelegten, vergleichbaren Bedingungen zur Angebotsabgabe aufgefordert — häufig bei öffentlichen Aufträgen vorgeschrieben."},
  {id:150,kat:"Kaufmännische Grundlagen",q:"Warum ist eine sorgfältige Bedarfsermittlung vor einer Beschaffung wichtig?",o:["Damit unnötig große Mengen auf Vorrat gekauft werden können","Um weder zu viel Kapital in Lagerbestand zu binden noch Engpässe zu riskieren","Weil sie gesetzlich für jeden noch so kleinen Einkauf vorgeschrieben ist","Bedarfsermittlung hat auf die Beschaffung praktisch keinen Einfluss"],c:1,e:"Eine genaue Bedarfsermittlung vermeidet sowohl zu hohe Lagerbestände (bindet Kapital) als auch zu geringe Bestände (Lieferengpässe, Produktionsausfälle)."},
];

const KATS=["Alle",...[...new Set(PRUEFUNG.map(f=>f.kat))]];
const FREE_KATS=["Grundlagen","Netzwerk & OSI"]; // deckt sich mit den freien Modulen 1+2
const KAT_BREAKDOWN=KATS.slice(1).map(k=>({kat:k,n:PRUEFUNG.filter(f=>f.kat===k).length,free:FREE_KATS.includes(k)}));

const shuffle=arr=>[...arr].sort(()=>Math.random()-0.5);

export default function Pruefung({onExit}){
  const {user,isPremium}=useAuth();
  const tagestipp=useMemo(()=>tagestippFuerHeute(),[]);
  const [kat,setKat]=useState("Alle");
  const [modus,setModus]=useState(null); // null=start, "quiz"=läuft, "done"=fertig, "locked"=Premium nötig
  const [fragen,setFragen]=useState([]);
  const [idx,setIdx]=useState(0);
  const [sel,setSel]=useState(null);
  const [score,setScore]=useState(0);
  const [falsch,setFalsch]=useState([]);
  const [showAuth,setShowAuth]=useState(false);
  const [nachweisBusy,setNachweisBusy]=useState(false);
  const [logErr,setLogErr]=useState(null);
  const [dlErr,setDlErr]=useState(null);
  const [lockReason,setLockReason]=useState(null); // "account" | "premium"
  const [startedAt,setStartedAt]=useState(null);
  const [feedbackDone,setFeedbackDone]=useState(false); // To-Do #68, pro Durchlauf zurückgesetzt
  // KI-Einschätzung auf Basis bisheriger 50-/150-Fragen-Lernzertifikate
  // (KI-RICHTLINIEN.md): erst die reinen Historien-Daten laden (billiger
  // DB-Read, kein KI-Aufruf), die eigentliche KI-Auswertung läuft erst auf
  // Klick, damit nicht bei jedem Seitenaufruf unnötig Kosten entstehen.
  const [auswertungSummary,setAuswertungSummary]=useState(null); // null=lädt/keine Historie, [] oder Array=vorhanden
  const [auswertung,setAuswertung]=useState(null);
  const [auswertungBusy,setAuswertungBusy]=useState(false);
  const [auswertungErr,setAuswertungErr]=useState(null);

  useEffect(()=>{if(modus!=="done")setFeedbackDone(false);},[modus]);

  useEffect(()=>{
    if(!user||!isPremium){setAuswertungSummary(null);return;}
    let cancelled=false;
    supabase.from("lernnachweise").select("topics,total").eq("user_id",user.id).eq("kind","pruefung").gt("total",20)
      .then(({data})=>{
        if(cancelled||!data?.length)return;
        const stats={};
        data.forEach(row=>{
          (row.topics||[]).forEach(t=>{
            stats[t.name]=stats[t.name]||{name:t.name,correct:0,total:0};
            stats[t.name].correct+=t.correct||0;
            stats[t.name].total+=t.total||0;
          });
        });
        setAuswertungSummary({count:data.length,topics:Object.values(stats)});
      });
    return ()=>{cancelled=true;};
  },[user?.id,isPremium]);

  const auswerten=async()=>{
    setAuswertungBusy(true);setAuswertungErr(null);
    try{
      const res=await authFetch("ai-chat",{
        ctx:`Bisherige Prüfungsvorbereitung-Ergebnisse über ${auswertungSummary.count} Durchläufe (Halb-/Vollprüfung), pro Kategorie zusammengerechnet: ${JSON.stringify(auswertungSummary.topics)}`,
        question:"Wie sollte ich mich als Nächstes auf die Prüfung vorbereiten?",
        moduleId:"pruefung-auswertung",
        mode:"auswertung",
      });
      const d=await res.json();
      if(!res.ok)throw new Error(d.error||`Fehler (${res.status}).`);
      setAuswertung(d.answer);
    }catch(e){
      setAuswertungErr(describeError(e));
    }finally{
      setAuswertungBusy(false);
    }
  };

  const starten=(n)=>{
    if(!user){setLockReason("account");setModus("locked");return;}
    if(n>20&&!isPremium){setLockReason("premium");setModus("locked");return;}
    const pool=isPremium?(kat==="Alle"?PRUEFUNG:PRUEFUNG.filter(f=>f.kat===kat)):PRUEFUNG.filter(f=>FREE_KATS.includes(f.kat));
    const auswahl=shuffle(pool).slice(0,n);
    setFragen(auswahl);setIdx(0);setSel(null);setScore(0);setFalsch([]);setModus("quiz");setStartedAt(new Date());
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

  // jsPDF (~400 KB) lädt sonst erst beim Klick auf "Herunterladen" — hier
  // schon im Hintergrund anstoßen, sobald das Ergebnis steht.
  useEffect(()=>{if(modus==="done")import("jspdf");},[modus]);
  useEffect(()=>{
    if(modus!=="done"||!user)return;
    logLernnachweis({user,kind:"pruefung",title:`Prüfungsvorbereitung (${fragen.length} Fragen)`,score,total:fragen.length,topics:topicStats,startedAt,finishedAt:new Date()})
      ?.then(({error})=>{if(error)setLogErr(describeError(error));});
  },[modus]);

  const downloadNachweis=async()=>{
    setNachweisBusy(true);
    setDlErr(null);
    try{
      await generateLernnachweis({user,kind:"pruefung",title:`Prüfungsvorbereitung (${fragen.length} Fragen)`,score,total:fragen.length,topics:topicStats,startedAt,finishedAt:new Date(),skipLog:true});
    }catch(e){
      setDlErr(describeError(e));
    }finally{
      setNachweisBusy(false);
    }
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
        <Logo sz={32}/>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>IT-Dart Prüfungsvorbereitung</div>
          <div style={{fontSize:11,color:C.mu}}>Fachinformatiker für Systemintegration · {PRUEFUNG.length} Fragen</div>
        </div>
        {modus&&<button onClick={reset} style={{marginLeft:"auto",background:"none",border:`0.5px solid ${C.bd}`,borderRadius:8,color:C.t2,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>↩ Neu</button>}
        {onExit&&<button onClick={onExit} style={{marginLeft:modus?8:"auto",background:"none",border:`0.5px solid ${C.bd}`,borderRadius:8,color:C.t2,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>← Zur App</button>}
      </div>

      {/* STARTSCREEN */}
      {!modus&&<>
        <div style={{textAlign:"center",paddingTop:20,paddingBottom:32}}>
          <img src={iconHeaderImg} alt="" style={{width:72,height:72,borderRadius:14,marginBottom:16}}/>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:8,color:C.t}}>Prüfungsvorbereitung</h2>
          <p style={{fontSize:14,color:C.t2,lineHeight:1.7,marginBottom:8}}>{!user?`Ein kostenloses Konto genügt für den Schnelltest (20 Fragen). Mit Premium: alle ${PRUEFUNG.length} Fragen aus allen 10 Bereichen.`:isPremium?`${PRUEFUNG.length} Fragen aus allen Themenbereichen — zufällig gemischt, mit sofortigem Feedback und Erklärung.`:`Im kostenlosen Schnelltest: 20 Fragen aus Grundlagen & Netzwerktechnik. Mit Premium: alle ${PRUEFUNG.length} Fragen aus allen 10 Bereichen.`}</p>
          <p style={{fontSize:13,color:C.mu,marginBottom:32}}>Fachinformatiker für Systemintegration (FISI) · IHK-Stil</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:32}}>
            {[{n:20,l:"Schnelltest"},{n:50,l:"Halbprüfung"},{n:PRUEFUNG.length,l:"Vollprüfung"}].map(({n,l})=>{
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

          <div style={{textAlign:"left",background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"16px 16px 14px",marginBottom:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <p style={{fontSize:12,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 12px"}}>Das erwartet dich · {KAT_BREAKDOWN.length} Themenbereiche</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {KAT_BREAKDOWN.map(({kat:k,n,free})=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,background:C.s2,borderRadius:8,padding:"8px 10px"}}>
                  <span style={{fontSize:12.5,color:C.t}}>{k}</span>
                  <span style={{fontSize:11,color:isPremium||free?C.cy:C.am,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{isPremium||free?`${n} Fragen`:"🔒 Premium"}</span>
                </div>
              ))}
            </div>
          </div>

          {isPremium&&<div style={{textAlign:"left",background:C.s1,border:`0.5px solid ${C.am}`,borderRadius:12,padding:"14px 16px",marginBottom:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <p style={{fontSize:11,fontWeight:700,color:C.am,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 6px"}}>⭐ Tipp des Tages · Premium</p>
            <p style={{fontSize:13,fontWeight:600,color:C.t,margin:"0 0 2px"}}>{tagestipp.t}</p>
            <p style={{fontSize:12,color:C.t2,margin:0,lineHeight:1.5}}>{tagestipp.s}</p>
          </div>}

          {auswertungSummary&&<div style={{textAlign:"left",background:C.s1,border:`0.5px solid ${C.bl}`,borderRadius:12,padding:"14px 16px",marginBottom:24,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <p style={{fontSize:11,fontWeight:700,color:C.bl,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 6px"}}>🧠 KI-Einschätzung</p>
            {!auswertung&&!auswertungBusy&&<>
              <p style={{fontSize:12,color:C.t2,margin:"0 0 10px",lineHeight:1.5}}>Basierend auf deinen bisherigen {auswertungSummary.count} Halb-/Vollprüfungen — eine realistische Einschätzung, worauf du dich als Nächstes konzentrieren solltest.</p>
              <button onClick={auswerten} style={{background:C.bl,color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:ff}}>Jetzt auswerten →</button>
            </>}
            {auswertungBusy&&<p style={{fontSize:13,color:C.t2,margin:0}}>Wird ausgewertet …</p>}
            {auswertung&&<p style={{fontSize:13,color:C.t,margin:0,lineHeight:1.6}}>{auswertung}</p>}
            {auswertungErr&&<p style={{fontSize:12,color:C.co,margin:"8px 0 0"}}>{auswertungErr}</p>}
          </div>}

          <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
            {[{icon:iconZeitImg,t:"Zeit einteilen",s:"Beantworte zuerst die einfachen Fragen. Schwierige Fragen die Nummer notieren, überspringen und am Ende zurückkehren — bloß nicht vergessen!"},
              {icon:iconAusschlussImg,t:"Ausschlussverfahren",s:"Erst offensichtlich falsche Antworten streichen, dann aus den verbleibenden wählen."},
              {icon:iconLesenImg,t:"Aufgabe komplett lesen",s:"Die Antwort steckt oft im Situationstext — lies die Frage bis zum Ende bevor du antwortest."}
            ].map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <img src={tip.icon} alt="" style={{width:32,height:32,borderRadius:8,flexShrink:0}}/>
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
          {topicStats.length>1&&<div style={{textAlign:"left",background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
            <p style={{fontSize:12,fontWeight:600,color:C.mu,textTransform:"uppercase",letterSpacing:".05em",margin:"0 0 12px"}}>Ergebnis nach Themenbereich</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {topicStats.map(t=>{
                const tp=Math.round((t.correct/t.total)*100);
                return(
                  <div key={t.name}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,color:C.t}}>{t.name}</span>
                      <span style={{fontSize:12,color:C.t2}}>{t.correct}/{t.total}</span>
                    </div>
                    <div style={{height:6,background:C.s2,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${tp}%`,background:tp>=80?C.gr:tp>=60?C.am:"#ef4444",borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}
          {logErr&&<div style={{background:"#fef2f2",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:20,textAlign:"left"}}>
            <p style={{fontSize:13,color:"#b91c1c",margin:0}}>Ergebnis konnte nicht in „Meine Statistik" gespeichert werden: {logErr}</p>
          </div>}
          {dlErr&&<div style={{background:"#fef2f2",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:20,textAlign:"left"}}>
            <p style={{fontSize:13,color:"#b91c1c",margin:0}}>Lernnachweis konnte nicht erstellt werden: {dlErr}</p>
          </div>}
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:user&&pct>=50?12:0}}>
              <button onClick={()=>starten(fragen.length)} style={{background:C.s1,color:C.t2,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"11px 18px",fontSize:13,cursor:"pointer",fontFamily:ff}}>🔄 Nochmal</button>
              <button onClick={reset} style={{background:C.bl,color:"#fff",border:"none",borderRadius:10,padding:"11px 18px",fontSize:13,cursor:"pointer",fontFamily:ff}}>← Neue Runde</button>
            </div>
            {user&&pct>=50&&(isPremium?<button onClick={downloadNachweis} disabled={nachweisBusy} style={{background:"none",color:C.bl,border:`0.5px solid ${C.bl}`,borderRadius:10,padding:"11px 18px",fontSize:13,cursor:"pointer",fontFamily:ff,opacity:nachweisBusy?.6:1,width:"100%",maxWidth:280,margin:"0 auto",display:"block"}}>{nachweisBusy?"Wird erstellt...":"📄 Lernnachweis herunterladen"}</button>:<p style={{fontSize:12,color:C.mu,margin:0,textAlign:"center"}}>🔒 Lernnachweis-Download ist ein Premium-Feature.</p>)}
          </div>
        </div>

        {user&&!feedbackDone&&<FeedbackUmfrage type="pruefung" question="Wie fandest du den Test?" placeholder="Was war gut, was war schlecht, was wäre besser?" withRating onDone={()=>setFeedbackDone(true)}/>}

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

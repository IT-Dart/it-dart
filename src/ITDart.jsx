import { useState, useEffect, useRef } from "react";
import { C, pri, ghost, wrap, inner, ff, fm } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { authFetch } from "./lib/authFetch";
import { generateLernnachweis, logLernnachweis } from "./lib/lernnachweis";
import { describeError } from "./lib/errorText";
import { canonicalUrl } from "./lib/nav";
import { MODS } from "./lib/modules";
import AuthScreen from "./AuthScreen";
import AdminScreen from "./AdminScreen";
import E2ETestScreen from "./E2ETestScreen";
import WebsiteCheckScreen from "./WebsiteCheckScreen";
import CostDashboardScreen from "./CostDashboardScreen";
import MonitoringScreen from "./MonitoringScreen";
import TodoScreen from "./TodoScreen";
import DeleteAccountScreen from "./DeleteAccountScreen";
import StatistikScreen from "./StatistikScreen";
import TrainerScreen from "./TrainerScreen";
import HilfeScreen from "./HilfeScreen";
import FeedbackUmfrage from "./FeedbackUmfrage";
import FeedbackScreen from "./FeedbackScreen";
import coverImg from "./assets/cover.jpg";
import moduleGImg from "./assets/module-g.jpg";
import moduleOImg from "./assets/module-o.jpg";
import moduleBImg from "./assets/module-b.jpg";
import moduleSiImg from "./assets/module-si.jpg";
import moduleDbImg from "./assets/module-db.jpg";
import moduleSkImg from "./assets/module-sk.jpg";
import modulePrImg from "./assets/module-pr.jpg";
import moduleBwImg from "./assets/module-bw.jpg";
import lernnachweisBadgeGImg from "./assets/lernnachweis-badge-g.jpg";
import { G, GQ, O, OQ, B, BQ, SI, SIQ, DB, DBQ, SK, SKQ, PR, PRQ, BW, DATA } from "./lib/moduleContent";

const MODULE_IMAGES={g:moduleGImg,o:moduleOImg,b:moduleBImg,si:moduleSiImg,db:moduleDbImg,sk:moduleSkImg,pr:modulePrImg,bw:moduleBwImg};
const MODULE_IMAGE_ALT={g:"PC Komponenten",o:"Sechs leuchtende Netzwerk-Symbole in Blau und Cyan: WLAN-Router, Switch mit nummerierten Ports, VPN-Schloss, WLAN-Signal, Server-Rack, DHCP-Tag",b:"Betriebssysteme",si:"IT-Sicherheit",db:"Datenbanken",sk:"Skripting",pr:"Beruf und Projekt",bw:"Illustration einer Bewerberin mit Lebenslauf, umgeben von Symbolen für Telefon-Interview, Zertifikat und KI-gestütztes Mock-Interview am Laptop"};
// Eigene, reduzierte Icons speziell für den kleinen Lernnachweis-Badge
// (28mm) -- das volle Modul-Cover (MODULE_IMAGES) ist dafür zu detailreich
// und wirkt bei der Größe unruhig. Fällt auf das Cover zurück, solange ein
// Modul noch kein eigenes Badge-Icon hat.
const LERNNACHWEIS_BADGE_IMAGES={...MODULE_IMAGES,g:lernnachweisBadgeGImg};

const FREE_MODULE_IDS=["g","o"]; // Grundlagen frei zugänglich, Netzwerktechnik als Vorschau — Rest inkl. Karriere & Bewerbung (Mock-Interview) ist Premium
const INTERVIEW_MAX_ROUNDS=8; // muss mit INTERVIEW_MAX_ROUNDS in supabase/functions/ai-chat/index.ts übereinstimmen
const CHAT_MAX_QUESTIONS=10; // pro Thema — nur clientseitig, der eigentliche Kostendeckel ist das serverseitige Stundenlimit
const FREE_TOPIC_LIMITS={o:2}; // Netzwerktechnik: nur die ersten 2 von 7 Themen sind ohne Premium sichtbar
const FREE_QUIZ_N=5; // Modul-Quiz am Ende: Free-Nutzer sehen nur die ersten 5 Fragen

export const Logo=({sz=44})=>(
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
        <text x="430" y="30" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Jede Stufe ist 1024× größer als die vorherige</text>
        {[{l:"1 Bit",s:"0 od. 1"},{l:"1 Byte",s:"8 Bit"},{l:"1 KiB",s:"1024 Byte"},{l:"1 MiB",s:"1024 KiB"},{l:"1 GiB",s:"1024 MiB"},{l:"1 TiB",s:"1024 GiB"}].map((b,i)=>{
          const x=182+i*82,w=76;
          return(<g key={i}><rect x={x} y={62} width={w} height={88} rx="4" fill="#0f2744" stroke={C.bl} strokeWidth="0.5"/>
          <text x={x+w/2} y={104} textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{b.l}</text>
          <text x={x+w/2} y={122} textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>{b.s}</text></g>);
        })}
        <text x="430" y="180" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Hersteller rechnen dezimal: 1 GB = 1000 MB, 1 TB = 1000 GB</text>
        <text x="430" y="198" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>→ darum zeigt Windows bei gekaufter Hardware weniger an</text>
      </>}
      {n===3&&<>
        <text x="430" y="30" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Dieselbe Zahl in drei Schreibweisen</text>
        {[{t:"Dezimal",b:"Basis 10",e:"42",x:210},{t:"Binär",b:"Basis 2",e:"101010",x:365},{t:"Hex",b:"Basis 16",e:"2A",x:515}].map((z,i)=>(
          <g key={i}><rect x={z.x} y={50} width={115} height={110} rx="6" fill="#0f2744" stroke={i===1?C.cy:C.bd} strokeWidth={i===1?1.5:0.5}/>
          <text x={z.x+57} y={78} textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{z.t}</text>
          <text x={z.x+57} y={95} textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>{z.b}</text>
          <text x={z.x+57} y={130} textAnchor="middle" fill={C.cy} fontSize="19" fontWeight="700" fontFamily={ff}>{z.e}</text>
          <text x={z.x+57} y={150} textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>= 42</text></g>
        ))}
        <text x="430" y="192" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Binär: 1×32 + 0×16 + 1×8 + 0×4 + 1×2 + 0×1 = 42</text>
        <text x="430" y="210" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>Hex: 2×16 + 10 (A) = 32 + 10 = 42</text>
      </>}
      {n===4&&<>
        <text x="430" y="30" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>HDD vs SSD vs RAM</text>
        {/* Kacheln bewusst erst ab x=155, damit sie nicht mit der links stehenden Figur überlappen */}
        <rect x="155" y="50" width="140" height="140" rx="8" fill="#1e2d42" stroke={C.bd} strokeWidth="1"/>
        <circle cx="225" cy="112" r="34" fill="none" stroke="#334155" strokeWidth="8"/>
        <circle cx="225" cy="112" r="20" fill="none" stroke="#3b82f6" strokeWidth="5" opacity=".4"/>
        <circle cx="225" cy="112" r="7" fill={C.bd}/>
        <text x="225" y="172" textAnchor="middle" fill={C.t2} fontSize="13" fontFamily={ff}>HDD – mechanisch</text>
        <rect x="315" y="50" width="140" height="140" rx="8" fill="#1e2d42" stroke={C.cy} strokeWidth="1.5"/>
        {[0,1,2,3].map(r=>[0,1,2,3].map(c2=>(<rect key={`${r}-${c2}`} x={330+c2*27} y={68+r*22} width="22" height="17" rx="2" fill="#0f2744" stroke="#2563eb" strokeWidth="0.5"/>)))}
        <text x="385" y="172" textAnchor="middle" fill={C.cy} fontSize="13" fontFamily={ff}>SSD – Flash</text>
        <rect x="475" y="50" width="140" height="140" rx="8" fill="#2a1e42" stroke={C.am} strokeWidth="1.5"/>
        <rect x="495" y="82" width="100" height="46" rx="3" fill="#1e2d42" stroke={C.am} strokeWidth="1"/>
        {[0,1,2,3,4].map(i=>(<rect key={i} x={501+i*18} y={88} width="13" height="34" rx="1" fill="#0f2744" stroke={C.am} strokeWidth="0.5"/>))}
        {[...Array(9)].map((_,i)=>(<rect key={i} x={499+i*11} y={128} width="7" height="9" fill={C.am} opacity=".65"/>))}
        <text x="542" y="172" textAnchor="middle" fill={C.am} fontSize="13" fontFamily={ff}>RAM – flüchtig</text>
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
        <text x="430" y="30" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Schnittstellen &amp; Peripherie</text>
        {[{l:"USB-A",s:"Tastatur",c:"#1e3a5f"},{l:"USB-C",s:"Universal",c:"#0f2744"},{l:"HDMI",s:"Monitor",c:"#1e2d42"},{l:"DisplayPort",s:"Monitor",c:"#1e2d42"},{l:"RJ45",s:"Netzwerk",c:"#0f2744"},{l:"Treiber",s:"Übersetzer",c:"#14532d"}].map((s,i)=>{
          const x=155+i*86,w=78;
          return(<g key={i}><rect x={x} y={54} width={w} height={108} rx="6" fill={s.c} stroke={i===5?C.gr:C.bl} strokeWidth={i===5?1.5:0.5}/>
          <text x={x+w/2} y={104} textAnchor="middle" fill={C.t} fontSize="13" fontWeight="600" fontFamily={ff}>{s.l}</text>
          <text x={x+w/2} y={122} textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>{s.s}</text></g>);
        })}
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

const Quiz=({qs,onDone,title,mid})=>{
  const [i,setI]=useState(0);const [sel,setSel]=useState(null);const [sc,setSc]=useState(0);const [done,setDone]=useState(false);
  const [nachweisBusy,setNachweisBusy]=useState(false);
  const [startedAt,setStartedAt]=useState(()=>new Date());
  const [logErr,setLogErr]=useState(null);
  const [dlErr,setDlErr]=useState(null);
  const {user,isPremium}=useAuth();
  // Einmal pro Durchlauf gemischt (nicht bei jedem Re-Render), damit die
  // Reihenfolge bei jedem Versuch anders ist, aber innerhalb eines
  // Durchlaufs stabil bleibt.
  // Fragen- UND Antwortreihenfolge werden gemischt (nicht nur die Fragen) --
  // sonst steht die richtige Antwort bei jedem Durchlauf an derselben
  // Stelle, was Auswendiglernen der Position statt des Inhalts begünstigt.
  const [shuffled]=useState(()=>{
    const shuffleArr=arr=>[...arr].sort(()=>Math.random()-0.5);
    return shuffleArr(qs).map(item=>{
      const order=shuffleArr(item.o.map((_,idx)=>idx));
      return{...item,o:order.map(idx=>item.o[idx]),c:order.indexOf(item.c)};
    });
  });
  const q=shuffled[i];const ans=sel!==null;
  const pick=idx=>{if(ans)return;setSel(idx);if(idx===q.c)setSc(s=>s+1);};
  const next=()=>{if(i===qs.length-1){setDone(true);return;}setI(x=>x+1);setSel(null);};
  const pct=Math.round((sc/qs.length)*100);
  // jsPDF (~400 KB) lädt sonst erst beim Klick auf "Herunterladen" — hier
  // schon im Hintergrund anstoßen, sobald das Ergebnis steht, damit der
  // eigentliche Download-Klick aus dem (dann bereits warmen) Modul-Cache
  // bedient wird statt spürbar zu verzögern.
  useEffect(()=>{if(done)import("jspdf");},[done]);
  useEffect(()=>{
    if(!done||!user)return;
    logLernnachweis({user,kind:"modul",title,score:sc,total:qs.length,topics:[{name:title,correct:sc,total:qs.length}],startedAt,finishedAt:new Date()})
      ?.then(({error})=>{if(error)setLogErr(describeError(error));});
  },[done]);
  const downloadNachweis=async()=>{
    setNachweisBusy(true);
    setDlErr(null);
    try{
      await generateLernnachweis({user,kind:"modul",title,score:sc,total:qs.length,topics:[{name:title,correct:sc,total:qs.length}],startedAt,finishedAt:new Date(),skipLog:true,moduleIconUrl:LERNNACHWEIS_BADGE_IMAGES[mid]});
    }catch(e){
      setDlErr(describeError(e));
    }finally{
      setNachweisBusy(false);
    }
  };
  if(done)return(
    <div style={{textAlign:"center",padding:"10px 0"}}>
      <div style={{fontSize:48,marginBottom:12}}>{pct>=80?"🎯":pct>=60?"👍":"💪"}</div>
      <h3 style={{fontSize:20,fontWeight:700,marginBottom:6}}>{pct>=80?"Sehr gut!":pct>=60?"Gut gemacht!":"Weiter üben!"}</h3>
      <p style={{fontSize:14,color:C.t2,marginBottom:16}}>{sc} von {qs.length} richtig — {pct}%</p>
      <div style={{height:8,background:C.s2,borderRadius:4,overflow:"hidden",marginBottom:20}}>
        <div style={{height:"100%",width:`${pct}%`,background:pct>=80?C.gr:pct>=60?C.am:"#ef4444",borderRadius:4}}/>
      </div>
      {logErr&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"left"}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>Ergebnis konnte nicht in „Meine Statistik" gespeichert werden: {logErr}</p>
      </div>}
      {dlErr&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"left"}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>Lernnachweis konnte nicht erstellt werden: {dlErr}</p>
      </div>}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:user&&pct>=50?12:0}}>
        <button onClick={()=>{setI(0);setSel(null);setSc(0);setDone(false);setStartedAt(new Date());}} style={{...ghost}}>🔄 Nochmal</button>
        <button onClick={onDone} style={{...pri}}>✓ Übersicht</button>
      </div>
      {user&&pct>=50&&(isPremium?<button onClick={downloadNachweis} disabled={nachweisBusy} style={{...ghost,width:"100%",justifyContent:"center",opacity:nachweisBusy?.6:1}}>{nachweisBusy?"Wird erstellt...":"📄 Lernnachweis herunterladen"}</button>:<p style={{fontSize:12,color:C.mu,margin:0}}>🔒 Lernnachweis-Download ist ein Premium-Feature.</p>)}
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

// Beide mehrstufigen Dialogmodi (Mock-Interview, Netzwerk-Diagnose) teilen
// sich dieselbe Verlaufs-/Rundenlogik unten, nur Label/Icon/Texte weichen
// ab — siehe DIALOG_COPY. Neue Modi hier ergänzen, nicht die Mechanik
// duplizieren.
const DIALOG_COPY={
  interview:{icon:"🎤",label:"Mock-Interview",start:"Interview starten",roundNoun:"Runden",overMsg:"Diese Interview-Runde ist abgeschlossen. Verlasse das Thema und öffne es erneut, um eine neue Runde zu starten.",starterText:"Bitte beginne das Interview mit deiner ersten Frage.",startingText:"Interview wird vorbereitet …"},
  diagnose:{icon:"🛰️",label:"Diagnose-Dialog",start:"Diagnose starten",roundNoun:"Runden",overMsg:"Diese Diagnose-Runde ist abgeschlossen. Verlasse das Thema und öffne es erneut, um eine neue Runde zu starten.",starterText:"Bitte beschreibe die erste Störungsmeldung und beginne die Diagnose.",startingText:"Troubleshooting-System wird gestartet …"},
};

// Gemeinsamer "HUD"-Look für KI-Lernassistent und Dialogmodi (bewusst per
// <style>-Tag statt Inline-Style, da CSS-Keyframes/Media-Queries mit
// reinen Style-Objekten nicht abbildbar sind — kein CSS-Framework, kein
// styled-components, nur natives CSS). Respektiert prefers-reduced-motion
// wie schon ParticleBackground auf der Unternehmensseite.
const AI_PANEL_CSS=`
@keyframes aiGlowPulse{0%,100%{box-shadow:0 0 0 1px rgba(56,189,248,.35),0 0 16px rgba(56,189,248,.18),inset 0 0 24px rgba(37,99,235,.06)}50%{box-shadow:0 0 0 1px rgba(56,189,248,.65),0 0 30px rgba(56,189,248,.4),inset 0 0 24px rgba(37,99,235,.12)}}
@keyframes aiOrbPulse{0%,100%{box-shadow:0 0 0 0 rgba(56,189,248,.55)}50%{box-shadow:0 0 0 6px rgba(56,189,248,0)}}
@keyframes aiDot{0%,80%,100%{opacity:.25;transform:scale(.85)}40%{opacity:1;transform:scale(1)}}
.ai-panel{animation:aiGlowPulse 3.2s ease-in-out infinite}
.ai-orb{animation:aiOrbPulse 2s ease-in-out infinite}
.ai-dot{animation:aiDot 1.1s ease-in-out infinite}
.ai-dot:nth-child(2){animation-delay:.15s}
.ai-dot:nth-child(3){animation-delay:.3s}
@media (prefers-reduced-motion: reduce){.ai-panel,.ai-orb,.ai-dot{animation:none}}
`;
const aiPanelStyle={position:"relative",background:"linear-gradient(165deg, rgba(37,99,235,.10), rgba(15,22,35,0) 65%)",border:`1px solid ${C.bl}`,borderRadius:14,padding:"16px",overflow:"hidden"};
const AIOrb=({icon})=><span className="ai-orb" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%, #38bdf8, #1d4ed8)",fontSize:13,flexShrink:0}}>{icon}</span>;
const AIThinking=({text})=>(
  <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 2px"}}>
    <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><span key={i} className="ai-dot" style={{width:6,height:6,borderRadius:"50%",background:C.cy,display:"inline-block"}}/>)}</div>
    <span style={{fontSize:12,color:C.cy,letterSpacing:".02em"}}>{text}</span>
  </div>
);

const AIChat=({ctx,q1,q2,a1,a2,moduleId,dialogMode})=>{
  const [q,setQ]=useState("");const [a,setA]=useState("");
  const [history,setHistory]=useState([]); // nur in Dialogmodi genutzt: [{role,content}]
  const [busy,setBusy]=useState(false);
  const [askCount,setAskCount]=useState(0); // nur im Frag-nach-Modus genutzt
  const dialog=dialogMode?DIALOG_COPY[dialogMode]:null;

  const call=async(question,priorHistory)=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)return{error:"Bitte melde dich an, um die KI zu nutzen."};
    const r=await authFetch("ai-chat",dialog?{ctx,question,moduleId,history:priorHistory,mode:dialogMode}:{ctx,question,moduleId});
    const d=await r.json();
    if(!r.ok)return{error:d.error||`Fehler (${r.status}).`};
    return{answer:d.answer||"Keine Antwort."};
  };

  const askLimitReached=askCount>=CHAT_MAX_QUESTIONS;
  const ask=async(question)=>{
    if(!question.trim()||askLimitReached)return;
    setAskCount(c=>c+1);
    setA("Wird geladen...");
    try{const res=await call(question);setA(res.error||res.answer);}
    catch(e){setA("Verbindung fehlgeschlagen.");}
  };

  // Anthropic verlangt strikt abwechselnde user/assistant-Rollen, beginnend
  // mit user. Der Auslöser-Text für die erste Frage wird deshalb selbst als
  // echter user-Turn gespeichert (sonst würde der zweite Aufruf mit einem
  // assistant-Turn beginnen und die API mit einem Fehler ablehnen) — beim
  // Rendern wird nur dieser eine, unsichtbare Auslöser-Turn ausgeblendet.
  const dialogRounds=history.filter(m=>m.role==="assistant").length;
  const dialogOver=dialogRounds>=INTERVIEW_MAX_ROUNDS;
  const dialogStep=async(userText)=>{
    if(dialogOver)return;
    const turnText=userText||dialog.starterText;
    const priorHistory=history;
    setHistory(h=>[...h,{role:"user",content:turnText}]);
    setQ("");setBusy(true);
    try{
      const res=await call(turnText,priorHistory);
      setHistory(h=>[...h,{role:"assistant",content:res.error||res.answer}]);
    }catch(e){setHistory(h=>[...h,{role:"assistant",content:"Verbindung fehlgeschlagen."}]);}
    setBusy(false);
  };

  if(dialog)return(
    <div className="ai-panel" style={aiPanelStyle}>
      <style>{AI_PANEL_CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <AIOrb icon={dialog.icon}/>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:C.t,margin:0,textShadow:"0 0 12px rgba(56,189,248,.5)"}}>{dialog.label}</p>
        {history.length>0&&<span style={{marginLeft:"auto",fontSize:11,color:C.cy,border:`0.5px solid ${C.bl}`,borderRadius:20,padding:"2px 9px"}}>{Math.min(dialogRounds,INTERVIEW_MAX_ROUNDS)} / {INTERVIEW_MAX_ROUNDS} {dialog.roundNoun}</span>}
      </div>
      {history.length===0?(
        busy?<AIThinking text={dialog.startingText}/>:
        <button onClick={()=>dialogStep(null)} style={{...pri,width:"100%",justifyContent:"center",boxShadow:"0 0 22px rgba(37,99,235,.55)"}}>{dialog.start}</button>
      ):(<>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
          {history.slice(1).map((m,i)=>(
            <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"88%",background:m.role==="user"?C.s2:"linear-gradient(135deg, #0f2744, #0b1c33)",border:`0.5px solid ${m.role==="user"?C.bd:"rgba(56,189,248,.5)"}`,borderRadius:10,padding:"9px 12px",boxShadow:m.role==="user"?"none":"0 0 14px rgba(56,189,248,.12)"}}>
              <p style={{fontSize:13,color:m.role==="user"?C.t:"#93c5fd",lineHeight:1.6,margin:0}}>{m.content}</p>
            </div>
          ))}
          {busy&&<AIThinking text={dialogRounds===0?dialog.startingText:"Antwort wird analysiert …"}/>}
        </div>
        {dialogOver?(
          <p style={{fontSize:12,color:C.mu,margin:0}}>{dialog.overMsg}</p>
        ):(
          <div style={{display:"flex",gap:8}}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!busy&&dialogStep(q)} placeholder="Deine Antwort..." disabled={busy} style={{flex:1,background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>dialogStep(q)} disabled={busy||!q.trim()} style={{...pri,padding:"10px 14px",flexShrink:0,opacity:busy||!q.trim()?.6:1,boxShadow:busy||!q.trim()?"none":"0 0 16px rgba(37,99,235,.5)"}}>→</button>
          </div>
        )}
      </>)}
    </div>
  );

  const chatLoading=a==="Wird geladen...";
  return(
    <div className="ai-panel" style={aiPanelStyle}>
      <style>{AI_PANEL_CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <AIOrb icon="🤖"/>
        <p style={{fontSize:12,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:C.t,margin:0,textShadow:"0 0 12px rgba(56,189,248,.5)"}}>KI-Lernassistent</p>
        {askCount>0&&<span style={{marginLeft:"auto",fontSize:11,color:C.cy,border:`0.5px solid ${C.bl}`,borderRadius:20,padding:"2px 9px"}}>{Math.min(askCount,CHAT_MAX_QUESTIONS)} / {CHAT_MAX_QUESTIONS} Fragen</span>}
      </div>
      {askLimitReached?(
        <p style={{fontSize:12,color:C.mu,margin:0}}>Maximale Anzahl an Fragen für dieses Thema erreicht. Verlasse das Thema und öffne es erneut, um weiter zu fragen.</p>
      ):(<>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {[[q1,a1],[q2,a2]].map(([qi,ai],i)=>(<button key={i} onClick={()=>{setQ(qi);ai?setA(ai):ask(qi);}} style={{...ghost,textAlign:"left",fontSize:13,padding:"8px 12px",width:"100%"}}>{qi}</button>))}
        </div>
        <p style={{fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:C.cy,margin:"2px 0 6px"}}>✏️ Dein Vorteil: frag alles zum Thema</p>
        <div style={{display:"flex",gap:8}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)} placeholder="Eigene Frage..." style={{flex:1,background:C.s2,border:`1px solid ${C.cy}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxShadow:"0 0 12px rgba(56,189,248,.25)"}}/>
          <button onClick={()=>ask(q)} style={{...pri,padding:"10px 14px",flexShrink:0,boxShadow:"0 0 16px rgba(37,99,235,.5)"}}>→</button>
        </div>
      </>)}
      {chatLoading&&<div style={{marginTop:10}}><AIThinking text="Antwort wird analysiert …"/></div>}
      {a&&!chatLoading&&<div style={{marginTop:10,background:"linear-gradient(135deg, #0f2744, #0b1c33)",border:"0.5px solid rgba(56,189,248,.5)",borderRadius:10,padding:12,boxShadow:"0 0 14px rgba(56,189,248,.12)"}}><p style={{fontSize:14,color:"#93c5fd",lineHeight:1.6,margin:0}}>{a}</p></div>}
    </div>
  );
};

const Pips=({items,cur,done,go,topicLimit,modId,visited})=>(
  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
    {items.map((it,i)=>{
      const locked=topicLimit!=null&&it.n>topicLimit;
      const peeked=locked&&visited&&visited.has(`${modId}-${it.n}`);
      return(<button key={i} onClick={()=>go(i)} style={{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${i===cur?"#38bdf8":peeked?C.am:"#2d3f5a"}`,background:i===cur?"#0f2744":done.has(it.n)?"#14532d":C.s1,color:i===cur?"#38bdf8":done.has(it.n)?"#86efac":peeked?C.am:"#475569",fontSize:locked?11:12,fontWeight:600,cursor:"pointer"}}>{locked?"🔒":it.n}</button>);
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


const authModeRequested=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("mode"):null;
const registerLinkRequested=authModeRequested==="register";
const loginLinkRequested=authModeRequested==="login";

export default function ITDart({onOpenExam,onOpenLegal,wartungsmodus}){
  const [view,setView]=useState(()=>(registerLinkRequested||loginLinkRequested)?"auth":"cover");
  const [statTarget,setStatTarget]=useState(null); // Trainee {id,email}, wenn ein Trainer dessen Statistik ansieht
  const [mod,setMod]=useState(null);
  const [idx,setIdx]=useState(0);
  const [phase,setPhase]=useState("intro"); // intro|learn|quiz
  const [done,setDone]=useState({});
  const [visitedLocked,setVisitedLocked]=useState(()=>new Set()); // "modId-topicN" fuer Premium-Themen, die trotz Sperre angeklickt wurden
  const {user,isPremium,premiumUntil,isAdmin,isTrainer,isJuniorAdmin,signOut}=useAuth();
  // Nach dem Abmelden direkt zurück zum Login-Screen navigieren (statt auf
  // einer entrechteten Ansicht derselben Seite zu landen, die im
  // Wartungsmodus dann die Baustellenseite zeigt) -- gleiches ?mode=login-
  // Muster wie der Login-Link auf WartungScreen.jsx.
  const handleSignOut=async()=>{await signOut();window.location.href=canonicalUrl("/?mode=login");};
  // Einmaliger Onboarding-Feedback-Fragebogen (To-Do #68) -- per localStorage
  // gemerkt, damit er nach dem ersten Ausfüllen/Überspringen nicht erneut nervt.
  const [showOnboardingFeedback,setShowOnboardingFeedback]=useState(()=>!localStorage.getItem("it_dart_onboarding_feedback_done"));
  const dismissOnboardingFeedback=()=>{localStorage.setItem("it_dart_onboarding_feedback_done","1");setShowOnboardingFeedback(false);};
  const premiumUntilDate=premiumUntil&&new Date(premiumUntil)>new Date()?new Date(premiumUntil).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
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

  // Ohne Router merkt sich der Browser beim Wechsel des view-States die
  // Scroll-Position der vorherigen Ansicht -- neuer Screen soll aber immer
  // von oben starten, nicht mittendrin.
  useEffect(()=>{window.scrollTo(0,0);},[view]);

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
  const totalItems=6+7+6+7+6+6+6+4;

  const isFreeMod=m=>FREE_MODULE_IDS.includes(m.id);
  const canOpen=m=>!!user&&(isFreeMod(m)||isPremium);

  const openMod=m=>{
    if(!canOpen(m)){setMod(m);setView("locked");return;}
    setMod(m);setIdx(0);setPhase(doneFor(m.id).size>0?"learn":"intro");setView("mod");
  };

  // Im Wartungsmodus soll "Zurück" auf dem Login-Screen wirklich zur
  // Wartungsseite zurückführen statt in die (sonst als Vorschau gedachte)
  // Modulübersicht -- das gibt es sonst nirgends, da App.jsx's page-State
  // hier bereits "app" ist und von ITDarts eigenem view-State nichts weiß.
  if(view==="auth")return <AuthScreen onClose={()=>{(wartungsmodus&&!user)?(window.location.href=canonicalUrl("/")):setView("overview");}} initialMode={registerLinkRequested?"register":"login"} onOpenLegal={onOpenLegal}/>;
  if(view==="admin"||view==="junior-admin")return (isAdmin||isJuniorAdmin)?<AdminScreen onClose={()=>setView("overview")}/>:null;
  if(view==="e2e-tests")return isAdmin?<E2ETestScreen onClose={()=>setView("overview")}/>:null;
  if(view==="website-check")return isAdmin?<WebsiteCheckScreen onClose={()=>setView("overview")}/>:null;
  if(view==="kosten")return isAdmin?<CostDashboardScreen onClose={()=>setView("overview")}/>:null;
  if(view==="monitoring")return isAdmin?<MonitoringScreen onClose={()=>setView("overview")}/>:null;
  if(view==="todo")return isAdmin?<TodoScreen onClose={()=>setView("overview")}/>:null;
  if(view==="feedback")return isAdmin?<FeedbackScreen onClose={()=>setView("overview")}/>:null;
  if(view==="delete-account")return <DeleteAccountScreen onClose={()=>setView("overview")}/>;
  if(view==="statistik")return <StatistikScreen viewUser={statTarget} onClose={()=>{setView(statTarget?"trainer":"overview");setStatTarget(null);}}/>;
  if(view==="trainer")return isTrainer?<TrainerScreen onClose={()=>setView("overview")} onOpenUser={(u)=>{setStatTarget(u);setView("statistik");}} onOpenLegal={onOpenLegal}/>:null;
  if(view==="hilfe")return <HilfeScreen onClose={()=>setView(user?"overview":"cover")}/>;

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
        <p style={{fontSize:13,color:C.mu}}>Premium-Käufe sind noch nicht selbstständig möglich, da unsere Zahlungsabwicklung gerade eingerichtet wird. Schreib uns in der Zwischenzeit an <a href="mailto:kontakt@it-dart.de" style={{color:C.cy}}>kontakt@it-dart.de</a>, um Premium freizuschalten.</p>
      </>)}
    </div></div>
  );

  if(view==="cover")return(
    <div style={wrap}><div style={{...inner,textAlign:"center",paddingTop:40,paddingBottom:40}}>
      <Logo sz={72}/>
      <h1 style={{fontSize:28,fontWeight:700,marginTop:20,marginBottom:8}}>IT-Dart – Bleib am Dart!</h1>
      {user?(
        <img src={coverImg} alt="IT-Dart" style={{width:"100%",maxWidth:340,borderRadius:14,margin:"16px auto",display:"block",boxShadow:"0 8px 32px rgba(37,99,235,0.25)"}}/>
      ):(
        <div style={{width:"100%",maxWidth:340,aspectRatio:"4/3",borderRadius:14,margin:"16px auto",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:C.s1,border:`0.5px solid ${C.bd}`}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:12,backgroundImage:"repeating-linear-gradient(135deg, #f5c518 0 16px, #1a1a1a 16px 32px)"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:12,backgroundImage:"repeating-linear-gradient(135deg, #f5c518 0 16px, #1a1a1a 16px 32px)"}}/>
          <span style={{fontSize:52}}>🚧</span>
          <p style={{fontSize:14,color:C.mu,fontWeight:500,padding:"0 24px",textAlign:"center",margin:0}}>Hier entsteht eine Lernplattform</p>
        </div>
      )}
      <p style={{fontSize:14,color:C.cy,fontWeight:500,marginBottom:4}}>IT-Infrastruktur verstehen. Praxisorientiert lernen.</p><p style={{fontSize:12,color:C.mu,marginBottom:24}}>Ausgerichtet auf den Fachinformatiker für Systemintegration (FISI)</p>
      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"20px",marginBottom:24,textAlign:"left"}}>
        <p style={{fontSize:14,color:C.t2,lineHeight:1.8,margin:0}}>IT-Dart ist ein interaktiver Lernpfad für angehende Fachinformatiker und alle, die IT-Infrastruktur wirklich verstehen wollen. Kein Frontalunterricht — Theorie, Praxisfall und eine KI, die deine Fragen beantwortet.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {[{e:"⚙️",t:"8 Module, inkl. Bewerbungs-Coaching"},{e:"🔧",t:"Praxisfälle aus dem echten IT-Alltag"},{e:"🔗",t:"Alles hängt zusammen — du siehst wie"},{e:"🎯",t:"Quiz am Ende jedes Moduls"},{e:"🤖",t:"KI beantwortet deine Fragen live"}].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.s2,borderRadius:10,padding:"10px 14px"}}>
            <span style={{fontSize:20}}>{f.e}</span><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
          </div>
        ))}
      </div>
      {user?(
        <button onClick={()=>setView("overview")} style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15}}>Lernpfad starten →</button>
      ):(
        <button disabled title="Bitte zuerst anmelden." style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15,opacity:.4,cursor:"not-allowed"}}>Lernpfad starten →</button>
      )}
      <div style={{marginTop:14,textAlign:"center"}}>
        {user?(
          <span style={{fontSize:12,color:C.mu}}>Angemeldet als {user.email} · <button onClick={handleSignOut} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Abmelden</button> · <button onClick={()=>setView("hilfe")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>❓ Hilfe</button></span>
        ):(
          <span style={{fontSize:12,color:C.mu}}><button onClick={()=>setView("auth")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Anmelden</button> · <span title="Registrierung derzeit geschlossen." style={{color:C.mu,opacity:.4,cursor:"not-allowed"}}>Registrieren</span> · <button onClick={()=>setView("hilfe")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>❓ Hilfe</button></span>
        )}
      </div>
      {onOpenLegal&&<div style={{marginTop:20,textAlign:"center",display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={()=>onOpenLegal("company")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Über IT-Dart</button>
        <button onClick={()=>onOpenLegal("leistungen")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Leistungen</button>
        <button onClick={()=>onOpenLegal("agb")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>AGB</button>
        <button onClick={()=>onOpenLegal("impressum")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Impressum</button>
        <button onClick={()=>onOpenLegal("datenschutz")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Datenschutz</button>
      </div>}
      {onOpenLegal&&<p style={{marginTop:10,textAlign:"center",fontSize:11,color:C.mu}}>© {new Date().getFullYear()} IT-Dart – Coskun Selim Bulut</p>}
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
          <span style={{fontSize:12,color:C.mu}}>{user.email} {isPremium?(premiumUntilDate?`· ⭐ Premium bis ${premiumUntilDate}`:"· ⭐ Premium"):"· Free"} {isAdmin&&<>· <button onClick={()=>setView("admin")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>⚙️ Admin</button> · <button onClick={()=>setView("e2e-tests")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>🧪 E2E-Tests</button> · <button onClick={()=>setView("website-check")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>🌐 Website-Check</button> · <button onClick={()=>setView("kosten")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>💰 Kosten</button> · <button onClick={()=>setView("monitoring")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>🩺 Monitoring</button> · <button onClick={()=>setView("todo")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>✅ To-Do</button> · <button onClick={()=>setView("feedback")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>💬 Feedback</button></>} {!isAdmin&&isJuniorAdmin&&<>· <button onClick={()=>setView("junior-admin")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>🧑‍💼 Junior-Admin</button></>} {isTrainer&&<>· <button onClick={()=>setView("trainer")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>🎓 Trainer-Ansicht</button></>} · <button onClick={()=>setView("statistik")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>📊 Statistik</button> · <button onClick={()=>setView("hilfe")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>❓ Hilfe</button> · <button onClick={handleSignOut} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Abmelden</button> · <button onClick={()=>setView("delete-account")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Konto löschen</button></span>
        ):(
          <button onClick={()=>setView("auth")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Anmelden / Registrieren</button>
        )}
      </div>
      {user&&showOnboardingFeedback&&<FeedbackUmfrage type="onboarding" question="Was erwartest du von dieser Plattform?" placeholder="Kurz in eigenen Worten..." onDone={dismissOnboardingFeedback}/>}
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
        {MODULE_IMAGES[mod.id]?(
          user&&<img src={MODULE_IMAGES[mod.id]} alt={MODULE_IMAGE_ALT[mod.id]} style={{width:"100%",maxWidth:400,borderRadius:12,margin:"12px auto 16px",display:"block",boxShadow:"0 4px 20px rgba(37,99,235,0.3)"}}/>
        ):(
          <div style={{width:"100%",maxWidth:400,aspectRatio:"4/3",borderRadius:12,margin:"12px auto 16px",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:C.s1,border:`0.5px solid ${C.bd}`}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:10,backgroundImage:"repeating-linear-gradient(135deg, #f5c518 0 14px, #1a1a1a 14px 28px)"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:10,backgroundImage:"repeating-linear-gradient(135deg, #f5c518 0 14px, #1a1a1a 14px 28px)"}}/>
            <span style={{fontSize:44}}>{mod.e}</span>
            <p style={{fontSize:13,color:C.mu,fontWeight:500,padding:"0 20px",textAlign:"center",margin:0}}>Illustration folgt</p>
          </div>
        )}
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
        <Quiz qs={isPremium?data.quiz:data.quiz.slice(0,FREE_QUIZ_N)} onDone={()=>setView("overview")} title={data.title.replace(/&amp;/g,"&")} mid={mod.id}/>
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
        <Pips items={data.items} cur={idx} done={doneFor(mod.id)} topicLimit={topicLimit} modId={mod.id} visited={visitedLocked} go={i=>{setIdx(i);const n=data.items[i].n;if(topicLimit==null||n<=topicLimit){mark(mod.id,n);}else{setVisitedLocked(s=>new Set(s).add(`${mod.id}-${n}`));}}}/>
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
          {mod.id!=="bw"&&<div style={{marginBottom:14}}><Scene mid={mod.id} n={item.n}/></div>}
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
          {!topicLocked&&<button onClick={()=>{if(idx===data.items.length-1){if(data.quiz?.length)setPhase("quiz");else{mark(mod.id,item.n);setView("overview");}}else{const ni=idx+1;setIdx(ni);const n=data.items[ni].n;if(topicLimit==null||n<=topicLimit)mark(mod.id,n);}}} style={{...pri,flex:1,justifyContent:"center"}}>
            {idx===data.items.length-1?(data.quiz?.length?"🎯 Zum Quiz →":"✓ Abschließen"):"Weiter →"}
          </button>}
        </div>
        {!topicLocked&&<AIChat key={`${mod.id}-${item.n}`} ctx={`Thema "${item.nm}" aus dem ${data.title}-Modul. Theorie: ${item.th}`} q1={item.q1} q2={item.q2} a1={item.a1} a2={item.a2} moduleId={mod.id} dialogMode={item.dialogMode}/>}
      </div></div>
    );
  }
  return null;
}

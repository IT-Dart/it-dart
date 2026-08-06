// Modul-Illustrationen: SVG-Grafik pro Thema (Scene), inkl. der beiden
// nur von Scene benutzten Hilfskomponenten Figur (Denk-Figuerchen) und
// SVG (Rahmen-Wrapper). Ausgelagert aus ITDart.jsx.
import { C, ff, fm } from "./lib/theme";

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
      {mid==="b"&&n===7&&<>
        <text x="430" y="26" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Ein Host, mehrere unabhängige VMs</text>
        {[{l:"Windows Server",e:"🪟",x:200,c:C.bl},{l:"Ubuntu",e:"🐧",x:345,c:C.gr},{l:"Test-VM",e:"🧪",x:490,c:C.am,snap:true}].map((vm,i)=>(
          <g key={i}>
            <rect x={vm.x} y="42" width="140" height="72" rx="8" fill="#0f2744" stroke={vm.c} strokeWidth="1.5"/>
            <text x={vm.x+70} y="76" textAnchor="middle" fontSize="24" fontFamily={ff}>{vm.e}</text>
            <text x={vm.x+70} y="100" textAnchor="middle" fill={C.t2} fontSize="12" fontWeight="600" fontFamily={ff}>{vm.l}</text>
            {vm.snap&&<circle cx={vm.x+124} cy="54" r="12" fill="#2a1a0f" stroke={C.am} strokeWidth="1.5"/>}
            {vm.snap&&<text x={vm.x+124} y="59" textAnchor="middle" fontSize="13" fontFamily={ff}>📸</text>}
            <line x1={vm.x+70} y1="114" x2={vm.x+70} y2="126" stroke={C.bd} strokeWidth="1.5" strokeDasharray="3 2"/>
          </g>
        ))}
        <rect x="195" y="126" width="460" height="32" rx="6" fill="#1e2d42" stroke={C.cy} strokeWidth="1.5"/>
        <text x="425" y="147" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Hypervisor</text>
        <rect x="195" y="170" width="460" height="32" rx="6" fill="#0c1a2e" stroke={C.bd} strokeWidth="1.5"/>
        <text x="425" y="191" textAnchor="middle" fill={C.t2} fontSize="13" fontWeight="600" fontFamily={ff}>Host (physischer Server)</text>
        <text x="425" y="222" textAnchor="middle" fill={C.mu} fontSize="12" fontFamily={ff}>📸 Snapshot friert den VM-Zustand ein – bei Fehlern ein Klick zurück</text>
      </>}
      {mid==="b"&&n===8&&<>
        <text x="430" y="20" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>RAID-Level im Vergleich</text>
        {[
          {l:"RAID 0",s:"Striping",disks:2,c:C.co,bg:"#2a0f1a",res:"✗ 1 Ausfall = alle Daten weg"},
          {l:"RAID 1",s:"Spiegelung",disks:2,c:C.gr,bg:"#14532d",res:"✓ 1 Ausfall = läuft weiter"},
          {l:"RAID 5",s:"Parität",disks:3,c:C.cy,bg:"#0c2a2a",res:"✓ 1 Ausfall = rekonstruierbar"},
        ].map((r,i)=>{
          const x=200+i*160;
          return(<g key={i}>
            <rect x={x} y="36" width="145" height="118" rx="8" fill={r.bg} stroke={r.c} strokeWidth="1.5"/>
            <text x={x+72} y="58" textAnchor="middle" fill={r.c} fontSize="13" fontWeight="700" fontFamily={ff}>{r.l}</text>
            <text x={x+72} y="74" textAnchor="middle" fill={C.t2} fontSize="11" fontFamily={ff}>{r.s}</text>
            {Array.from({length:r.disks}).map((_,d)=>(
              <rect key={d} x={x+20+d*38} y="84" width="28" height="36" rx="3" fill="#0c1a2e" stroke={r.c} strokeWidth="1"/>
            ))}
            <text x={x+72} y="140" textAnchor="middle" fill={r.c} fontSize="10.5" fontFamily={ff}>{r.res}</text>
          </g>);
        })}
        <text x="430" y="175" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Die 3-2-1-Backup-Regel</text>
        {[{e:"💾",l:"3 Kopien"},{e:"📼",l:"2 Medien"},{e:"☁️",l:"1 extern"}].map((b,i)=>(
          <g key={i}>
            <text x={330+i*90} y="205" textAnchor="middle" fontSize="20" fontFamily={ff}>{b.e}</text>
            <text x={330+i*90} y="222" textAnchor="middle" fill={C.t2} fontSize="11" fontFamily={ff}>{b.l}</text>
          </g>
        ))}
      </>}
      {mid==="b"&&n===9&&<>
        <text x="430" y="22" textAnchor="middle" fill={C.cy} fontSize="13" fontWeight="600" fontFamily={ff}>Sensor → Gateway → richtig vs. falsch angebunden</text>
        <rect x="195" y="80" width="90" height="90" rx="8" fill="#0f2744" stroke={C.bl} strokeWidth="1.5"/>
        <text x="240" y="120" textAnchor="middle" fontSize="26" fontFamily={ff}>🌡️</text>
        <text x="240" y="150" textAnchor="middle" fill={C.t2} fontSize="12" fontWeight="600" fontFamily={ff}>Sensor</text>
        {[9,17,25].map((r,i)=>(<path key={i} d={`M ${330-r} ${125-r*0.35} A ${r} ${r} 0 0 1 ${330+r} ${125-r*0.35}`} fill="none" stroke={C.cy} strokeWidth="1.5" opacity={0.9-i*0.25}/>))}
        <rect x="310" y="80" width="90" height="90" rx="8" fill="#0f2744" stroke={C.cy} strokeWidth="1.5"/>
        <text x="355" y="120" textAnchor="middle" fontSize="24" fontFamily={ff}>🌉</text>
        <text x="355" y="150" textAnchor="middle" fill={C.cy} fontSize="12" fontWeight="600" fontFamily={ff}>IoT-Gateway</text>
        <line x1="400" y1="100" x2="470" y2="60" stroke={C.gr} strokeWidth="2"/>
        <rect x="470" y="36" width="165" height="48" rx="8" fill="#14532d" stroke={C.gr} strokeWidth="1.5"/>
        <text x="552" y="56" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="600" fontFamily={ff}>✓ Eigenes VLAN</text>
        <text x="552" y="72" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily={ff}>isoliert vom Firmennetz</text>
        <line x1="400" y1="150" x2="470" y2="185" stroke={C.co} strokeWidth="2" strokeDasharray="5 3"/>
        <rect x="470" y="162" width="165" height="48" rx="8" fill="#450a0a" stroke={C.co} strokeWidth="1.5"/>
        <text x="552" y="182" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="600" fontFamily={ff}>✗ Direkt im Firmennetz</text>
        <text x="552" y="198" textAnchor="middle" fill="#fca5a5" fontSize="11" fontFamily={ff}>Standard-Login = Risiko</text>
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

export default Scene;

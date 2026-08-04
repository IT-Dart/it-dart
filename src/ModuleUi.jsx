// Kleine, in sich geschlossene UI-Bausteine des Lernpfad-Screens (nur von
// ITDart.jsx benutzt). Ausgelagert aus ITDart.jsx.
import { C, ghost } from "./lib/theme";
import { Logo } from "./Logo";

export const OSIOverview=()=>(
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

export const Pips=({items,cur,done,go,topicLimit,modId,visited})=>(
  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
    {items.map((it,i)=>{
      const locked=topicLimit!=null&&it.n>topicLimit;
      const peeked=locked&&visited&&visited.has(`${modId}-${it.n}`);
      return(<button key={i} onClick={()=>go(i)} style={{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${i===cur?"#38bdf8":peeked?C.am:"#2d3f5a"}`,background:i===cur?"#0f2744":done.has(it.n)?"#14532d":C.s1,color:i===cur?"#38bdf8":done.has(it.n)?"#86efac":peeked?C.am:"#475569",fontSize:locked?11:12,fontWeight:600,cursor:"pointer"}}>{locked?"🔒":it.n}</button>);
    })}
  </div>
);

export const Hdr=({back})=>(
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
    <Logo sz={28}/><span style={{fontSize:18,fontWeight:700}}>IT-Dart</span>
    <button onClick={back} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Übersicht</button>
  </div>
);

export const OSIBezug=({text})=>(
  <div style={{background:"#0f2744",border:`0.5px solid ${C.bl}`,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"flex-start"}}>
    <span style={{fontSize:16,flexShrink:0}}>🌐</span>
    <div><p style={{fontSize:11,fontWeight:600,color:C.cy,marginBottom:3,textTransform:"uppercase",letterSpacing:".05em"}}>OSI-Bezug</p>
    <p style={{fontSize:13,color:"#93c5fd",lineHeight:1.6,margin:0}}>{text}</p></div>
  </div>
);

import { useEffect, useRef } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { Logo } from "./ITDart";
import bookCoverImg from "./assets/book-claude-praxis-cover.png";
import heroImg from "./assets/company-hero.jpg";
import iconLernplattform from "./assets/icon-lernplattform.jpg";
import iconUnternehmen from "./assets/icon-unternehmen.jpg";
import iconSeminare from "./assets/icon-seminare.jpg";
import iconFachrichtungen from "./assets/icon-fachrichtungen.jpg";
import iconMehrsprachig from "./assets/icon-mehrsprachig.jpg";
import iconMobil from "./assets/icon-mobil.jpg";
import iconKiAssistent from "./assets/icon-ki-assistent.jpg";

// Markentexte gebündelt an einer Stelle, damit spätere Überarbeitungen ein
// reiner Textedit hier sind, ohne die JSX-Struktur darunter anzufassen.
const INTRO_TEXT="IT-Dart ist die Marke hinter „Bleib am Dart!\" — unserer digitalen Lernplattform für die Ausbildung zum Fachinformatiker für Systemintegration (FISI). Rund um die Plattform entstehen weitere Angebote: Fachliteratur, herunterladbare Lernmaterialien und individuelle Lösungen für Ausbildungsbetriebe.";
const VISION_TEXT="IT-Ausbildung soll nicht an trockenen Skripten und Frontalunterricht hängenbleiben. Wir glauben an praxisnahes Lernen an echten Alltagsfällen — ergänzt durch KI als Werkzeug, das schneller macht, ohne das eigene Verständnis zu ersetzen.";
const ZIEL_TEXT="Kurzfristig: angehenden Fachinformatikern für Systemintegration eine Plattform geben, mit der Prüfungsvorbereitung strukturiert und nachvollziehbar gelingt. Mittelfristig: dasselbe Prinzip auf weitere IT-Ausbildungsberufe übertragen und Ausbildungsbetrieben ein eigenständiges Angebot für ihre Auszubildenden bieten.";

// Sobald die Unternehmensgründung abgeschlossen ist: hier reale Amazon-Links
// eintragen und status auf "live" setzen — der Rest der Karte bleibt gleich.
const EBOOKS=[
  {
    title:"Claude in der Praxis",
    subtitle:"Der KI-Leitfaden für Fachinformatiker Systemintegration",
    author:"Coşkun Bulut",
    languages:["Deutsch","English","Türkçe"],
    cover:bookCoverImg,
    status:"in_preparation",
    amazonLinks:null,
  },
];

const h2={fontSize:16,fontWeight:700,marginTop:32,marginBottom:10,color:C.t};
const p={fontSize:14,color:C.t2,lineHeight:1.7,marginBottom:10};
const card={background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"16px 18px",marginBottom:12};
const badge=(bg,fg)=>({display:"inline-block",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,background:bg,color:fg});
const featureRow=[
  {icon:iconFachrichtungen,t:"Weitere IT-Ausbildungsberufe und Fachrichtungen auf derselben Plattform-Basis"},
  {icon:iconMehrsprachig,t:"Englischsprachige Version der Lerninhalte in Vorbereitung"},
  {icon:iconMobil,t:"Gezielte mobile Optimierung"},
  {icon:iconKiAssistent,t:"Laufender Ausbau des KI-Lernassistenten um weitere Praxis-Dialogformate"},
];
const leistungenRow=[
  {icon:iconLernplattform,t:"Lernplattform für Einzelpersonen & Ausbildungsbetriebe"},
  {icon:iconUnternehmen,t:"Individuelle Lösungen für Unternehmen"},
  {icon:iconSeminare,t:"Vor-Ort- und Remote-Seminare"},
];

// Feste Seed-Zahl statt Math.random(), damit die Partikel-Anordnung bei
// jedem Seitenaufruf identisch aussieht (einmal abgestimmtes Layout bleibt
// stabil) statt bei jedem Laden neu und zufällig zu wirken. Mulberry32 —
// klein, deterministisch, ausreichend gut verteilt für diesen Zweck.
function mulberry32(seed){
  let a=seed;
  return()=>{
    a|=0;a=(a+0x6D2B79F5)|0;
    let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return((t^(t>>>14))>>>0)/4294967296;
  };
}

// Dezenter Netzwerk-Partikel-Hintergrund hinter Logo/Titel — greift die
// Netzwerk-Topologie-Bildsprache aus Hero-Bild/Icons auf. Respektiert
// prefers-reduced-motion (dann komplett ohne Canvas/Animation) und bleibt
// bewusst blass/langsam, um nicht vom Inhalt abzulenken.
function ParticleBackground(){
  const canvasRef=useRef(null);
  useEffect(()=>{
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const dpr=window.devicePixelRatio||1;
    const rnd=mulberry32(1337);
    let w,h,particles,raf;
    const N=24,LINK_DIST=110;

    const resize=()=>{
      w=canvas.clientWidth;h=canvas.clientHeight;
      canvas.width=w*dpr;canvas.height=h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const init=()=>{
      // Gitter statt reinem Zufalls-Sampling: garantiert gleichmäßige
      // Verteilung über die Fläche (reiner Zufall klumpt bei nur 24 Punkten
      // sichtbar), leichter Jitter innerhalb jeder Zelle sorgt trotzdem für
      // ein organisches statt starr-rasterförmiges Bild.
      const cols=Math.max(1,Math.round(Math.sqrt(N*w/h)));
      const rows=Math.max(1,Math.ceil(N/cols));
      const cellW=w/cols,cellH=h/rows;
      particles=[];
      for(let r=0;r<rows&&particles.length<N;r++){
        for(let c=0;c<cols&&particles.length<N;c++){
          particles.push({
            x:(c+0.15+rnd()*0.7)*cellW,
            y:(r+0.15+rnd()*0.7)*cellH,
            vx:(rnd()-0.5)*0.18,vy:(rnd()-0.5)*0.18,
          });
        }
      }
    };
    resize();init();
    const onResize=()=>{resize();init();};
    window.addEventListener("resize",onResize);

    const draw=()=>{
      ctx.clearRect(0,0,w,h);
      particles.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>w)p.vx*=-1;
        if(p.y<0||p.y>h)p.vy*=-1;
      });
      for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
          const a=particles[i],b=particles[j];
          const dist=Math.hypot(a.x-b.x,a.y-b.y);
          if(dist<LINK_DIST){
            ctx.strokeStyle=`rgba(56,189,248,${0.12*(1-dist/LINK_DIST)})`;
            ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          }
        }
      }
      particles.forEach(p=>{
        ctx.fillStyle="rgba(37,99,235,0.4)";
        ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onResize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}/>;
}

export default function CompanyScreen({onEnterApp,onOpenLegal}){
  const {user,signOut}=useAuth();

  return (
    <div style={wrap}><div style={{...inner,paddingTop:40,paddingBottom:40}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <Logo sz={72}/>
        <div style={{position:"relative",paddingTop:4,paddingBottom:4}}>
          <ParticleBackground/>
          <div style={{position:"relative"}}>
            <h1 style={{fontSize:26,fontWeight:700,marginTop:20,marginBottom:6}}>IT-Dart</h1>
            <p style={{fontSize:13,color:C.cy,fontWeight:500}}>Digitale Bildung für die IT-Ausbildung</p>
          </div>
        </div>
      </div>

      <img src={heroImg} alt="Aufsteigender Pfad aus geometrischen Formen, der zu einem leuchtenden Stern führt — Sinnbild für den Lernfortschritt auf IT-Dart" style={{width:"100%",borderRadius:14,marginBottom:24,display:"block",boxShadow:"0 8px 32px rgba(37,99,235,0.2)"}}/>

      <p style={p}>{INTRO_TEXT}</p>

      {user&&<button onClick={onEnterApp} style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15,marginTop:14}}>Zum Lerntool „Bleib am Dart!" →</button>}

      <h2 style={h2}>Vision</h2>
      <p style={p}>{VISION_TEXT}</p>

      <h2 style={h2}>Ziel</h2>
      <p style={p}>{ZIEL_TEXT}</p>

      <h2 style={h2}>Leistungen</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {leistungenRow.map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.s2,borderRadius:10,padding:"10px 14px"}}>
            <img src={f.icon} alt="" style={{width:48,height:48,borderRadius:10,flexShrink:0}}/><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>onOpenLegal("leistungen")} style={{...ghost,width:"100%",justifyContent:"center"}}>Alle Leistungen & Pakete ansehen →</button>

      <h2 style={h2}>Erweiterungen</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {featureRow.map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.s2,borderRadius:10,padding:"10px 14px"}}>
            <img src={f.icon} alt="" style={{width:48,height:48,borderRadius:10,flexShrink:0}}/><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
          </div>
        ))}
      </div>

      <h2 style={h2}>Materialien & Publikationen</h2>
      <p style={p}>Verkaufsstart und Freischaltung erfolgen nach Abschluss unserer Unternehmensgründung.</p>

      <p style={{...p,fontWeight:600,color:C.t,marginBottom:8}}>E-Books</p>
      {EBOOKS.map(book=>(
        <div key={book.title} style={{...card,display:"flex",gap:14}}>
          <img src={book.cover} alt={`Cover: ${book.title}`} style={{width:84,borderRadius:6,flexShrink:0,boxShadow:"0 4px 14px rgba(0,0,0,0.35)"}}/>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.t,marginBottom:2}}>{book.title}</div>
            <div style={{fontSize:12,color:C.t2,marginBottom:6,lineHeight:1.5}}>{book.subtitle}</div>
            <div style={{fontSize:11,color:C.mu,marginBottom:8}}>von {book.author}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {book.languages.map(l=><span key={l} style={badge(C.bg,C.t2)}>{l}</span>)}
            </div>
            {book.status==="in_preparation"&&<span style={badge("#3a2e0f",C.am)}>Erscheint in Kürze</span>}
          </div>
        </div>
      ))}

      <p style={{...p,fontWeight:600,color:C.t,marginTop:16,marginBottom:8}}>Kostenlose Lernmaterialien</p>
      <div style={card}>
        <p style={{...p,marginBottom:0}}>Ergänzend zur Plattform entstehen herunterladbare Lernmaterialien — zum Beispiel Cheat Sheets und Zusammenfassungen zu einzelnen Modulen.</p>
      </div>

      {user&&<button onClick={onEnterApp} style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15,marginTop:28}}>Zum Lerntool „Bleib am Dart!" →</button>}

      {user&&<div style={{marginTop:14,textAlign:"center"}}>
        <span style={{fontSize:12,color:C.mu}}>Angemeldet als {user.email} · <button onClick={signOut} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Abmelden</button></span>
      </div>}

      <div style={{marginTop:20,textAlign:"center",display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
        {user&&<button onClick={()=>onOpenLegal("leistungen")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Leistungen</button>}
        {user&&<button onClick={()=>onOpenLegal("agb")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>AGB</button>}
        <button onClick={()=>onOpenLegal("impressum")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Impressum</button>
        <button onClick={()=>onOpenLegal("datenschutz")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Datenschutz</button>
      </div>
      <p style={{marginTop:10,textAlign:"center",fontSize:11,color:C.mu}}>© {new Date().getFullYear()} IT-Dart – Coskun Selim Bulut</p>
    </div></div>
  );
}

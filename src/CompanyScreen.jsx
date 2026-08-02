import { useEffect, useRef } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { canonicalUrl } from "./lib/nav";
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
const KOOPERATION_TEXT="IT-Dart sucht den Austausch mit Ausbildungsbetrieben, Bildungsträgern, Verlagen und anderen Partnern rund um die IT-Ausbildung. Denkbar sind gemeinsame Lerninhalte, die Einbindung von IT-Dart in bestehende Ausbildungsprogramme oder weitere Formen der Zusammenarbeit — im Mittelpunkt steht dabei, möglichst vielen Auszubildenden einen einfachen Zugang zu praxisnaher Prüfungsvorbereitung zu ermöglichen.";

// Sobald die Unternehmensgründung abgeschlossen ist: hier reale Amazon-Links
// eintragen und status auf "live" setzen — der Rest der Karte bleibt gleich.
const EBOOKS=[
  {
    title:"Claude in der Praxis",
    subtitle:"Der KI-Leitfaden für Fachinformatiker Systemintegration",
    author:"Coşkun Selim Bulut",
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
// Auffälligere Variante der sekundären CTAs auf dieser Seite (Leistungen,
// Partnerschaft) — bewusst nicht der globale `ghost`-Stil, der in 12 anderen
// Screens für unauffällige Sekundär-Buttons verwendet wird und dort nicht
// mitverändert werden soll.
const ctaAccent={...ghost,color:C.cy,border:`1.5px solid ${C.cy}`,background:"rgba(56,189,248,0.1)",fontWeight:600};
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

// Feste Seed-Zahl statt Math.random(), damit immer dieselbe Anordnung
// erscheint statt bei jedem Laden neu zu variieren.
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
// bewusst blass/langsam, um nicht vom Inhalt abzulenken. Punkte, die zu nah
// am Logo landen würden, werden radial aus einer Schutzzone herausgedrückt,
// damit das Logo selbst immer klar freigestellt bleibt.
function ParticleBackground(){
  const canvasRef=useRef(null);
  useEffect(()=>{
    if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const dpr=window.devicePixelRatio||1;
    const rnd=mulberry32(42);
    let w,h,particles,raf;
    const N=24,LINK_DIST=110,LOGO_R=40,LOGO_CY=44;

    const keepOutOfLogoZone=(p,cx)=>{
      const dx=p.x-cx,dy=p.y-LOGO_CY;
      const dist=Math.hypot(dx,dy);
      if(dist<LOGO_R&&dist>0){
        const push=LOGO_R/dist;
        p.x=cx+dx*push;p.y=LOGO_CY+dy*push;
      }
    };

    const resize=()=>{
      w=canvas.clientWidth;h=canvas.clientHeight;
      canvas.width=w*dpr;canvas.height=h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const init=()=>{
      const cx=w/2;
      particles=Array.from({length:N},()=>{
        const p={
          x:rnd()*w,y:rnd()*h,
          vx:(rnd()-0.5)*0.18,vy:(rnd()-0.5)*0.18,
        };
        keepOutOfLogoZone(p,cx);
        return p;
      });
    };
    resize();init();
    const onResize=()=>{resize();init();};
    window.addEventListener("resize",onResize);

    const draw=()=>{
      ctx.clearRect(0,0,w,h);
      const cx=w/2;
      particles.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>w)p.vx*=-1;
        if(p.y<0||p.y>h)p.vy*=-1;
        if(Math.hypot(p.x-cx,p.y-LOGO_CY)<LOGO_R){
          keepOutOfLogoZone(p,cx);
          p.vx*=-1;p.vy*=-1;
        }
      });
      for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
          const a=particles[i],b=particles[j];
          const dist=Math.hypot(a.x-b.x,a.y-b.y);
          if(dist<LINK_DIST){
            ctx.strokeStyle=`rgba(56,189,248,${0.16*(1-dist/LINK_DIST)})`;
            ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          }
        }
      }
      particles.forEach(p=>{
        ctx.fillStyle="rgba(37,99,235,0.55)";
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
  // Anonyme Besucher haben noch kein Konto zum Betreten der App — führt sie
  // stattdessen direkt zum Login (?mode=login, dasselbe Muster wie die
  // bestehende ?mode=register-Einladungslink-Logik in ITDart.jsx).
  const handleEnter=user?onEnterApp:()=>{window.location.href=canonicalUrl("/?mode=login");};
  // Nach dem Abmelden direkt zurück zum Login-Screen navigieren, gleiches
  // Muster wie handleEnter oben.
  const handleSignOut=async()=>{await signOut();window.location.href=canonicalUrl("/?mode=login");};

  return (
    <div style={wrap}><div style={{...inner,paddingTop:40,paddingBottom:40}}>
      <div style={{position:"relative",textAlign:"center",marginBottom:32,paddingTop:8,paddingBottom:8}}>
        <ParticleBackground/>
        <div style={{position:"relative"}}>
          <Logo sz={72}/>
          <h1 style={{fontSize:26,fontWeight:700,marginTop:20,marginBottom:6}}>IT-Dart</h1>
          <p style={{fontSize:13,color:C.cy,fontWeight:500}}>Digitale Bildung für die IT-Ausbildung</p>
        </div>
      </div>

      <img src={heroImg} alt="Aufsteigender Pfad aus geometrischen Formen, der zu einem leuchtenden Stern führt — Sinnbild für den Lernfortschritt auf IT-Dart" style={{width:"100%",borderRadius:14,marginBottom:24,display:"block",boxShadow:"0 8px 32px rgba(37,99,235,0.2)"}}/>

      <p style={p}>{INTRO_TEXT}</p>

      <button onClick={handleEnter} style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15,marginTop:14}}>{user?"Zum Lerntool „Bleib am Dart!\" →":"Anmelden / Registrieren →"}</button>
      {!user&&<p style={{fontSize:11,color:C.mu,marginTop:8,marginBottom:0,textAlign:"center"}}>Registrierung und kostenlose Module sind bereits nutzbar. Premium-Käufe sind noch nicht selbstständig möglich, da unsere Zahlungsabwicklung gerade eingerichtet wird — <a href="mailto:kontakt@it-dart.de" style={{color:C.cy}}>kontakt@it-dart.de</a> für Premium-Zugang in der Zwischenzeit.</p>}

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
      <button onClick={()=>onOpenLegal("leistungen")} style={{...ctaAccent,width:"100%",justifyContent:"center"}}>Alle Leistungen & Pakete ansehen →</button>

      <h2 style={h2}>Erweiterungen</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {featureRow.map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.s2,borderRadius:10,padding:"10px 14px"}}>
            <img src={f.icon} alt="" style={{width:48,height:48,borderRadius:10,flexShrink:0}}/><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
          </div>
        ))}
      </div>

      <h2 style={h2}>Kooperationen & Partnerschaften</h2>
      <p style={p}>{KOOPERATION_TEXT}</p>
      <a href="mailto:kontakt@it-dart.de" style={{...ctaAccent,width:"100%",justifyContent:"center",textDecoration:"none",boxSizing:"border-box"}}>Partnerschaft anfragen →</a>

      <h2 style={h2}>Materialien & Publikationen</h2>
      <p style={p}>Der Verkauf startet, sobald die ersten Titel fertiggestellt sind.</p>

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

      <button onClick={handleEnter} style={{...pri,width:"100%",justifyContent:"center",padding:"14px 18px",fontSize:15,marginTop:28}}>{user?"Zum Lerntool „Bleib am Dart!\" →":"Anmelden / Registrieren →"}</button>

      {user&&<div style={{marginTop:14,textAlign:"center"}}>
        <span style={{fontSize:12,color:C.mu}}>Angemeldet als {user.email} · <button onClick={handleSignOut} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:12,textDecoration:"underline",padding:0,fontFamily:ff}}>Abmelden</button></span>
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

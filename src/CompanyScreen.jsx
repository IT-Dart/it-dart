import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { Logo } from "./ITDart";
import bookCoverImg from "./assets/book-claude-praxis-cover.png";

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
  {e:"🧭",t:"Weitere IT-Ausbildungsberufe und Fachrichtungen auf derselben Plattform-Basis"},
  {e:"🌍",t:"Englischsprachige Version der Lerninhalte in Vorbereitung"},
  {e:"📱",t:"Gezielte mobile Optimierung"},
  {e:"🤖",t:"Laufender Ausbau des KI-Lernassistenten um weitere Praxis-Dialogformate"},
];
const leistungenRow=[
  {e:"🎓",t:"Lernplattform für Einzelpersonen & Ausbildungsbetriebe"},
  {e:"🏢",t:"Individuelle Lösungen für Unternehmen"},
  {e:"🗓️",t:"Vor-Ort- und Remote-Seminare"},
];

export default function CompanyScreen({onEnterApp,onOpenLegal}){
  const {user,signOut}=useAuth();

  return (
    <div style={wrap}><div style={{...inner,paddingTop:40,paddingBottom:40}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <Logo sz={72}/>
        <h1 style={{fontSize:26,fontWeight:700,marginTop:20,marginBottom:6}}>IT-Dart</h1>
        <p style={{fontSize:13,color:C.cy,fontWeight:500}}>Digitale Bildung für die IT-Ausbildung</p>
      </div>

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
            <span style={{fontSize:20}}>{f.e}</span><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
          </div>
        ))}
      </div>
      {user&&<button onClick={()=>onOpenLegal("leistungen")} style={{...ghost,width:"100%",justifyContent:"center"}}>Alle Leistungen & Pakete ansehen →</button>}

      <h2 style={h2}>Erweiterungen</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {featureRow.map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.s2,borderRadius:10,padding:"10px 14px"}}>
            <span style={{fontSize:20}}>{f.e}</span><span style={{fontSize:14,color:C.t2}}>{f.t}</span>
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
        <button onClick={()=>onOpenLegal("impressum")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Impressum</button>
        <button onClick={()=>onOpenLegal("datenschutz")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:11,textDecoration:"underline",padding:0,fontFamily:ff}}>Datenschutz</button>
      </div>
    </div></div>
  );
}

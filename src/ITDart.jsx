import { useState, useEffect, useRef } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
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
import Scene from "./Scene";
import { Logo } from "./Logo";
import { OSIOverview, Pips, Hdr, OSIBezug } from "./ModuleUi";
import Quiz from "./Quiz";
import AIChat from "./AIChat";

const MODULE_IMAGES={g:moduleGImg,o:moduleOImg,b:moduleBImg,si:moduleSiImg,db:moduleDbImg,sk:moduleSkImg,pr:modulePrImg,bw:moduleBwImg};
const MODULE_IMAGE_ALT={g:"PC Komponenten",o:"Sechs leuchtende Netzwerk-Symbole in Blau und Cyan: WLAN-Router, Switch mit nummerierten Ports, VPN-Schloss, WLAN-Signal, Server-Rack, DHCP-Tag",b:"Betriebssysteme",si:"IT-Sicherheit",db:"Datenbanken",sk:"Skripting",pr:"Beruf und Projekt",bw:"Illustration einer Bewerberin mit Lebenslauf, umgeben von Symbolen für Telefon-Interview, Zertifikat und KI-gestütztes Mock-Interview am Laptop"};
// Eigene, reduzierte Icons speziell für den kleinen Lernnachweis-Badge
// (28mm) -- das volle Modul-Cover (MODULE_IMAGES) ist dafür zu detailreich
// und wirkt bei der Größe unruhig. Fällt auf das Cover zurück, solange ein
// Modul noch kein eigenes Badge-Icon hat.
const LERNNACHWEIS_BADGE_IMAGES={...MODULE_IMAGES,g:lernnachweisBadgeGImg};

const FREE_MODULE_IDS=["g","o"]; // Grundlagen frei zugänglich, Netzwerktechnik als Vorschau — Rest inkl. Karriere & Bewerbung (Mock-Interview) ist Premium
const FREE_TOPIC_LIMITS={o:2}; // Netzwerktechnik: nur die ersten 2 von 7 Themen sind ohne Premium sichtbar
const FREE_QUIZ_N=5; // Modul-Quiz am Ende: Free-Nutzer sehen nur die ersten 5 Fragen

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
        <Quiz qs={isPremium?data.quiz:data.quiz.slice(0,FREE_QUIZ_N)} onDone={()=>setView("overview")} title={data.title.replace(/&amp;/g,"&")} mid={mod.id} badgeImages={LERNNACHWEIS_BADGE_IMAGES}/>
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

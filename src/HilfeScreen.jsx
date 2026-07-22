import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { useAuth } from "./lib/AuthContext";
import { describeError } from "./lib/errorText";

const card={background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"};
const sectionTitle={fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10};

const FAQS=[
  {
    q:"Ich habe mein Passwort vergessen",
    a:"Klicke auf der Anmelde-Seite auf „Passwort vergessen?“ und gib deine E-Mail-Adresse ein. Du bekommst einen Link zum Zurücksetzen zugeschickt. Bist du bereits angemeldet, kannst du unten direkt einen Zurücksetzen-Link an dein eigenes Konto schicken lassen.",
  },
  {
    q:"Ich habe keine Einladungs- oder Bestätigungs-E-Mail bekommen",
    a:"Schau zuerst im Spam-/Werbe-Ordner nach. Kommt dort auch nichts an: Einladungslinks laufen nach einer Weile automatisch ab. Wende dich in dem Fall an die Person, die dich eingeladen hat (Admin oder Trainer) und bitte um eine erneute Einladung.",
  },
  {
    q:"Mein Bestätigungs- oder Einladungslink funktioniert nicht mehr",
    a:"Diese Links sind aus Sicherheitsgründen nur einmalig und zeitlich begrenzt gültig. Ist er abgelaufen, hilft nur eine neue Einladung — wende dich dafür an Admin oder Trainer.",
  },
  {
    q:"Ich kann mich nicht einloggen, obwohl mein Passwort stimmt",
    a:"Prüfe, ob du dein Konto bereits bestätigt hast (Link in der Willkommens-E-Mail angeklickt). Ist das Konto noch „ausstehend“, funktioniert der Login erst nach der Bestätigung. Achte außerdem auf Groß-/Kleinschreibung und führende/folgende Leerzeichen in der E-Mail-Adresse.",
  },
  {
    q:"Der KI-Chat ist gesperrt oder antwortet nicht",
    a:"Der KI-Zugriff wird pro Konto einzeln freigeschaltet und kann durch die Administration gesperrt sein — das ist keine technische Störung. Bei Fragen dazu wende dich an Admin oder Junior-Admin.",
  },
  {
    q:"Fragen zu Premium oder Freischaltung",
    a:"Premium wird aktuell manuell durch die Administration vergeben (dauerhaft oder zeitlich befristet). Bei Fragen zu deinem Status wende dich an die Administration.",
  },
  {
    q:"Wie lösche ich mein Konto?",
    a:"Über „Konto löschen“ im Kontomenü. Das entfernt unwiderruflich alle Daten (Fortschritt, Lernnachweise) — diese Aktion lässt sich nicht rückgängig machen.",
  },
];

const TRAINER_FAQS=[
  {
    q:"Wie lade ich einen neuen Testenden ein?",
    a:"In der Trainer-Ansicht E-Mail-Adresse eingeben und „Einladen“ klicken. Die Person wird automatisch dir zugeordnet, sobald sie sich bestätigt — vorausgesetzt dein Kontingent ist nicht ausgeschöpft.",
  },
  {
    q:"Mein Kontingent ist voll, ich brauche mehr Plätze",
    a:"Das Kontingent legt ausschließlich die Administration fest. Wende dich mit der gewünschten Anzahl an Admin oder Junior-Admin.",
  },
  {
    q:"Ein eingeladener Testender taucht nicht in meiner Liste auf",
    a:"Solange die Einladung noch „ausstehend“ ist (E-Mail noch nicht bestätigt), erscheint der Status entsprechend markiert — das ist normal. Erst nach Bestätigung zählt der Platz vollständig zu deinem Kontingent.",
  },
];

const fmtDate=(iso)=>{
  if(!iso)return "unbekannt";
  return new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
};

export default function HilfeScreen({onClose}){
  const {user,isAdmin,isTrainer,isJuniorAdmin,resetPassword}=useAuth();
  const [openFaq,setOpenFaq]=useState(null);
  const [openTrainerFaq,setOpenTrainerFaq]=useState(null);
  const [resetBusy,setResetBusy]=useState(false);
  const [resetMsg,setResetMsg]=useState(null);
  const [copied,setCopied]=useState(false);
  const [myTrainer,setMyTrainer]=useState(undefined); // undefined=loading, null=keiner, {trainer_email}

  const plainTrainee=user&&!isAdmin&&!isTrainer&&!isJuniorAdmin;

  useEffect(()=>{
    if(!plainTrainee){setMyTrainer(null);return;}
    let cancelled=false;
    supabase.rpc("get_my_trainer").then(({data,error})=>{
      if(cancelled)return;
      if(error||!data?.length){setMyTrainer(null);return;}
      setMyTrainer(data[0]);
    });
    return()=>{cancelled=true;};
  },[plainTrainee]);

  const diagText=user?[
    `E-Mail: ${user.email}`,
    `Konto-ID: ${user.id}`,
    `Registriert seit: ${fmtDate(user.created_at)}`,
    `Zeitpunkt der Anfrage: ${new Date().toLocaleString("de-DE")}`,
    `Browser/Gerät: ${navigator.userAgent}`,
    `Seite: ${window.location.href}`,
  ].join("\n"):null;

  const copyDiag=()=>{
    navigator.clipboard.writeText(diagText);
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };

  const mailtoHref=(()=>{
    const subject="IT-Dart Support-Anfrage";
    const body=`Bitte beschreibe hier kurz dein Problem:\n\n\n---\nDiagnose-Informationen (bitte nicht löschen):\n${diagText||"(nicht angemeldet)"}`;
    return `mailto:kontakt@it-dart.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  const sendResetLink=async()=>{
    if(!user)return;
    setResetBusy(true);setResetMsg(null);
    const {error}=await resetPassword(user.email);
    setResetBusy(false);
    if(error){setResetMsg({type:"error",text:describeError(error)});return;}
    setResetMsg({type:"info",text:`Link zum Zurücksetzen wurde an ${user.email} geschickt.`});
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>❓ Hilfe</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      <p style={{fontSize:13,color:C.t2,marginBottom:24,lineHeight:1.6}}>Hier findest du Antworten auf häufige Fragen. Löst das dein Problem nicht, kannst du unten Kontakt aufnehmen — wir bereiten dafür schon die wichtigsten Infos für dich vor.</p>

      <div style={{marginBottom:28}}>
        <p style={sectionTitle}>Häufige Fragen</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {FAQS.map((f,i)=>{
            const open=openFaq===i;
            return(
              <div key={i} style={card}>
                <button onClick={()=>setOpenFaq(open?null:i)} style={{background:"none",border:"none",color:C.t,cursor:"pointer",fontFamily:ff,fontSize:14,fontWeight:600,textAlign:"left",width:"100%",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                  <span>{f.q}</span>
                  <span style={{color:C.mu,flexShrink:0}}>{open?"▴":"▾"}</span>
                </button>
                {open&&<p style={{fontSize:13,color:C.t2,marginTop:10,marginBottom:0,lineHeight:1.6}}>{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {user&&<div style={{...card,marginBottom:28}}>
        <p style={sectionTitle}>Passwort zurücksetzen</p>
        <p style={{fontSize:13,color:C.t2,marginBottom:10}}>Schickt einen Link zum Zurücksetzen an deine hinterlegte E-Mail-Adresse ({user.email}).</p>
        <button disabled={resetBusy} onClick={sendResetLink} style={{...ghost,fontSize:13,padding:"8px 14px",opacity:resetBusy?.6:1}}>{resetBusy?"...":"Link zum Zurücksetzen senden"}</button>
        {resetMsg&&<p style={{fontSize:12,color:resetMsg.type==="error"?"#fca5a5":"#86efac",marginTop:8,marginBottom:0}}>{resetMsg.text}</p>}
      </div>}

      {isTrainer&&<div style={{marginBottom:28}}>
        <p style={sectionTitle}>Hilfe für Trainer</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {TRAINER_FAQS.map((f,i)=>{
            const open=openTrainerFaq===i;
            return(
              <div key={i} style={card}>
                <button onClick={()=>setOpenTrainerFaq(open?null:i)} style={{background:"none",border:"none",color:C.t,cursor:"pointer",fontFamily:ff,fontSize:14,fontWeight:600,textAlign:"left",width:"100%",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                  <span>{f.q}</span>
                  <span style={{color:C.mu,flexShrink:0}}>{open?"▴":"▾"}</span>
                </button>
                {open&&<p style={{fontSize:13,color:C.t2,marginTop:10,marginBottom:0,lineHeight:1.6}}>{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>}

      {isJuniorAdmin&&<div style={{marginBottom:28}}>
        <p style={sectionTitle}>Hilfe für Junior-Admins</p>
        <div style={card}>
          <p style={{fontSize:13,color:C.t2,marginBottom:12,lineHeight:1.6}}>Du unterstützt die Administration bei alltäglichen Aufgaben — mit Rechten nach dem Prinzip der minimalen Rechtevergabe.</p>
          <p style={{fontSize:12,fontWeight:600,color:"#86efac",marginBottom:6}}>✅ Das darfst du</p>
          <p style={{fontSize:13,color:C.t2,marginBottom:12,lineHeight:1.6}}>Nutzerliste einsehen, Nutzer einladen, Einladungen erneut senden/löschen, KI-Zugriff steuern, Trainer zuweisen und Trainees/Kontingente verwalten.</p>
          <p style={{fontSize:12,fontWeight:600,color:"#fca5a5",marginBottom:6}}>🔒 Das darfst du nicht</p>
          <p style={{fontSize:13,color:C.t2,marginBottom:0,lineHeight:1.6}}>Aktive Konten löschen, Premium oder Rollen vergeben/entziehen — auch nicht für dich selbst. Ausgegraute Buttons im Admin-Bereich sind Absicht, kein Fehler.</p>
        </div>
      </div>}

      {plainTrainee&&myTrainer&&<div style={{...card,marginBottom:28}}>
        <p style={sectionTitle}>Dein Trainer</p>
        <p style={{fontSize:13,color:C.t2,margin:0,lineHeight:1.6}}>Bei Fragen zu deinem Fortschritt oder deiner Ausbildung wende dich an deinen Trainer: <strong style={{color:C.t}}>{myTrainer.trainer_email}</strong></p>
      </div>}

      <div style={card}>
        <p style={sectionTitle}>Weiterhin ein Problem?</p>
        <p style={{fontSize:13,color:C.t2,marginBottom:12,lineHeight:1.6}}>Kontaktiere uns direkt — wir haben die wichtigsten Infos für die Fehlersuche schon vorbereitet, du musst nur noch kurz beschreiben, was passiert ist.</p>
        {user&&<>
          <div style={{background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:8,padding:"10px 12px",marginBottom:10}}>
            <pre style={{fontSize:11,color:C.t2,margin:0,whiteSpace:"pre-wrap",fontFamily:"'Courier New',monospace",lineHeight:1.6}}>{diagText}</pre>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={mailtoHref} style={{...pri,fontSize:13,padding:"9px 16px",textDecoration:"none"}}>✉️ E-Mail an Support</a>
            <button onClick={copyDiag} style={{...ghost,fontSize:13,padding:"9px 16px"}}>{copied?"✓ Kopiert":"Infos kopieren"}</button>
          </div>
        </>}
        {!user&&<a href="mailto:kontakt@it-dart.de?subject=IT-Dart%20Support-Anfrage" style={{...pri,fontSize:13,padding:"9px 16px",textDecoration:"none",display:"inline-flex"}}>✉️ E-Mail an Support</a>}
      </div>
    </div></div>
  );
}

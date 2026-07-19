import { useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit",marginBottom:10};

export default function AuthScreen({onClose}){
  const {signIn,signUp,resetPassword}=useAuth();
  const [mode,setMode]=useState("login"); // "login" | "signup" | "forgot"
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState(null); // {type:"error"|"info", text}

  const switchMode=(m)=>{setMode(m);setMsg(null);};

  const submit=async(e)=>{
    e.preventDefault();
    if(!email.trim()){setMsg({type:"error",text:"Bitte E-Mail eingeben."});return;}
    if(mode==="forgot"){
      setBusy(true);setMsg(null);
      const {error}=await resetPassword(email);
      setBusy(false);
      if(error){setMsg({type:"error",text:describeError(error)});return;}
      setMsg({type:"info",text:"Falls diese E-Mail bei uns registriert ist, haben wir dir einen Link zum Zurücksetzen geschickt."});
      return;
    }
    if(!password){setMsg({type:"error",text:"Bitte E-Mail und Passwort eingeben."});return;}
    setBusy(true);setMsg(null);
    const {data,error}=mode==="login"?await signIn(email,password):await signUp(email,password);
    setBusy(false);
    if(error){setMsg({type:"error",text:describeError(error)});return;}
    if(mode==="signup"){
      // Supabase returns success (no error) with an empty identities array
      // when the email is already registered, to avoid leaking which
      // emails exist — so we need to check for that ourselves.
      if(data?.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){
        setMsg({type:"error",text:"Diese E-Mail ist bereits registriert. Bitte melde dich stattdessen an oder setze dein Passwort zurück."});
        return;
      }
      setMsg({type:"info",text:"Konto erstellt! Falls E-Mail-Bestätigung aktiv ist, prüfe dein Postfach — sonst bist du jetzt eingeloggt."});
      return;
    }
    onClose?.();
  };

  const titles={login:"Anmelden",signup:"Konto erstellen",forgot:"Passwort zurücksetzen"};
  const subtitles={
    login:"Melde dich an, um den KI-Chat und deinen Premium-Zugang zu nutzen.",
    signup:"Kostenlos registrieren — Module 1 & 2 kannst du auch ganz ohne Konto ausprobieren. Für KI-Chat und Premium-Module brauchst du einen Account.",
    forgot:"Gib deine E-Mail ein — wir schicken dir einen Link zum Zurücksetzen.",
  };
  const buttonLabels={login:"Anmelden →",signup:"Registrieren →",forgot:"Link senden →"};

  return(
    <div style={wrap}><div style={{...inner,paddingTop:40}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <button onClick={onClose} style={{...ghost,padding:"6px 12px",fontSize:13}}>← Zurück</button>
        <span style={{fontSize:16,fontWeight:700}}>IT-Dart</span>
      </div>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{titles[mode]}</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:24}}>{subtitles[mode]}</p>
      <form onSubmit={submit}>
        <input type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} style={input} autoComplete="email"/>
        {mode!=="forgot"&&<input type="password" placeholder="Passwort" value={password} onChange={e=>setPassword(e.target.value)} style={input} autoComplete={mode==="login"?"current-password":"new-password"}/>}
        {mode==="login"&&<p style={{textAlign:"right",marginTop:-4,marginBottom:14}}>
          <button type="button" onClick={()=>switchMode("forgot")} style={{background:"none",border:"none",color:C.mu,cursor:"pointer",fontSize:12,fontFamily:ff,textDecoration:"underline",padding:0}}>Passwort vergessen?</button>
        </p>}
        {msg&&<div style={{background:msg.type==="error"?"#450a0a":"#052e16",border:`0.5px solid ${msg.type==="error"?"#ef4444":"#22c55e"}`,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <p style={{fontSize:13,color:msg.type==="error"?"#fca5a5":"#86efac",margin:0,lineHeight:1.5}}>{msg.text}</p>
        </div>}
        <button type="submit" disabled={busy} style={{...pri,width:"100%",justifyContent:"center",opacity:busy?.6:1}}>
          {busy?"Bitte warten...":buttonLabels[mode]}
        </button>
      </form>
      {mode==="forgot"?(
        <p style={{fontSize:13,color:C.t2,textAlign:"center",marginTop:18}}>
          <button onClick={()=>switchMode("login")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:13,fontFamily:ff,textDecoration:"underline",padding:0}}>← Zurück zur Anmeldung</button>
        </p>
      ):(
        <p style={{fontSize:13,color:C.t2,textAlign:"center",marginTop:18}}>
          {mode==="login"?"Noch kein Konto? ":"Schon registriert? "}
          <button onClick={()=>switchMode(mode==="login"?"signup":"login")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:13,fontFamily:ff,textDecoration:"underline",padding:0}}>
            {mode==="login"?"Registrieren":"Anmelden"}
          </button>
        </p>
      )}
    </div></div>
  );
}

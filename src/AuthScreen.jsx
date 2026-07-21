import { useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit",marginBottom:10};

export default function AuthScreen({onClose,initialMode="login"}){
  const {signIn,signUp,resetPassword}=useAuth();
  const [mode,setMode]=useState(initialMode); // "login" | "forgot" | "register"
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState(null); // {type:"error"|"info", text}
  const [registered,setRegistered]=useState(false);

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
    if(mode==="register"){
      if(password.length<8){setMsg({type:"error",text:"Passwort muss mindestens 8 Zeichen haben."});return;}
      if(password!==confirm){setMsg({type:"error",text:"Passwörter stimmen nicht überein."});return;}
      setBusy(true);setMsg(null);
      const {error}=await signUp(email,password);
      setBusy(false);
      if(error){setMsg({type:"error",text:describeError(error)});return;}
      setRegistered(true);
      return;
    }
    if(!password){setMsg({type:"error",text:"Bitte E-Mail und Passwort eingeben."});return;}
    setBusy(true);setMsg(null);
    const {error}=await signIn(email,password);
    setBusy(false);
    if(error){setMsg({type:"error",text:describeError(error)});return;}
    onClose?.();
  };

  const titles={login:"Anmelden",forgot:"Passwort zurücksetzen",register:"Konto erstellen"};
  const subtitles={
    login:"Melde dich an, um den KI-Chat und deinen Premium-Zugang zu nutzen.",
    forgot:"Gib deine E-Mail ein — wir schicken dir einen Link zum Zurücksetzen.",
    register:"Trage deine E-Mail-Adresse und ein Passwort ein.",
  };
  const buttonLabels={login:"Anmelden →",forgot:"Link senden →",register:"Konto erstellen →"};

  if(mode==="register"&&registered)return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>✉️</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Bestätige deine E-Mail-Adresse</h2>
      <p style={{fontSize:14,color:C.t2,lineHeight:1.6}}>Wir haben einen Bestätigungslink an <b>{email}</b> geschickt. Klicke darauf, um dein Konto zu aktivieren und dich anzumelden — schau notfalls auch im Spam-Ordner nach.</p>
      <button onClick={onClose} style={{...ghost,marginTop:20}}>← Zurück</button>
    </div></div>
  );

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
        {mode!=="forgot"&&<input type="password" placeholder="Passwort" value={password} onChange={e=>setPassword(e.target.value)} style={input} autoComplete={mode==="register"?"new-password":"current-password"}/>}
        {mode==="register"&&<input type="password" placeholder="Passwort bestätigen" value={confirm} onChange={e=>setConfirm(e.target.value)} style={input} autoComplete="new-password"/>}
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
      {mode==="forgot"||mode==="register"?(
        <p style={{fontSize:13,color:C.t2,textAlign:"center",marginTop:18}}>
          <button onClick={()=>switchMode("login")} style={{background:"none",border:"none",color:C.cy,cursor:"pointer",fontSize:13,fontFamily:ff,textDecoration:"underline",padding:0}}>← Zurück zur Anmeldung</button>
        </p>
      ):(
        <p style={{fontSize:12,color:C.mu,textAlign:"center",marginTop:18,lineHeight:1.6}}>
          Kein Konto? Der Zugang erfolgt aktuell nur auf Einladung.
        </p>
      )}
    </div></div>
  );
}

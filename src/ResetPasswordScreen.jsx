import { useState } from "react";
import { C, pri, wrap, inner } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit",marginBottom:10};

export default function ResetPasswordScreen(){
  const {updatePassword}=useAuth();
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState(null);
  const [done,setDone]=useState(false);

  const submit=async(e)=>{
    e.preventDefault();
    if(password.length<8){setMsg({type:"error",text:"Passwort muss mindestens 8 Zeichen haben."});return;}
    if(password!==confirm){setMsg({type:"error",text:"Passwörter stimmen nicht überein."});return;}
    setBusy(true);setMsg(null);
    const {error}=await updatePassword(password);
    setBusy(false);
    if(error){setMsg({type:"error",text:error.message});return;}
    setDone(true);
  };

  if(done)return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>✓</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Passwort geändert</h2>
      <p style={{fontSize:14,color:C.t2}}>Du bist jetzt mit deinem neuen Passwort angemeldet. Lade die Seite neu, um weiterzumachen.</p>
    </div></div>
  );

  return(
    <div style={wrap}><div style={{...inner,paddingTop:60}}>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Neues Passwort setzen</h2>
      <p style={{fontSize:13,color:C.t2,marginBottom:24}}>Wähle ein neues Passwort für dein Konto.</p>
      <form onSubmit={submit}>
        <input type="password" placeholder="Neues Passwort" value={password} onChange={e=>setPassword(e.target.value)} style={input} autoComplete="new-password"/>
        <input type="password" placeholder="Passwort bestätigen" value={confirm} onChange={e=>setConfirm(e.target.value)} style={input} autoComplete="new-password"/>
        {msg&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <p style={{fontSize:13,color:"#fca5a5",margin:0,lineHeight:1.5}}>{msg.text}</p>
        </div>}
        <button type="submit" disabled={busy} style={{...pri,width:"100%",justifyContent:"center",opacity:busy?.6:1}}>
          {busy?"Bitte warten...":"Passwort ändern →"}
        </button>
      </form>
    </div></div>
  );
}

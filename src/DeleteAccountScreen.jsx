import { useState } from "react";
import { C, ghost, wrap, inner, ff } from "./lib/theme";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit",marginBottom:10};

export default function DeleteAccountScreen({onClose}){
  const {user,signOut}=useAuth();
  const [confirmText,setConfirmText]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [done,setDone]=useState(false);

  const canDelete=confirmText.trim().toUpperCase()==="LÖSCHEN";

  const deleteAccount=async()=>{
    if(!canDelete)return;
    setBusy(true);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){setErr("Nicht angemeldet.");setBusy(false);return;}
      const r=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,{
        method:"POST",
        headers:{Authorization:`Bearer ${session.access_token}`},
      });
      const d=await r.json();
      if(!r.ok){setErr(d.error||"Löschen fehlgeschlagen.");setBusy(false);return;}
      setDone(true);
      await signOut();
    }catch(e){
      setErr(describeError(e));
      setBusy(false);
    }
  };

  if(done)return(
    <div style={wrap}><div style={{...inner,paddingTop:60,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>✓</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Konto gelöscht</h2>
      <p style={{fontSize:14,color:C.t2}}>Dein Konto und alle damit verbundenen Daten (Fortschritt, Premium-Status, Lernnachweis-Protokolle) wurden endgültig gelöscht.</p>
    </div></div>
  );

  return(
    <div style={wrap}><div style={{...inner,paddingTop:40}}>
      <button onClick={onClose} style={{...ghost,padding:"6px 12px",fontSize:13,marginBottom:24}}>← Zurück</button>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:8,color:"#fca5a5"}}>Konto endgültig löschen</h2>
      <p style={{fontSize:14,color:C.t2,marginBottom:16,lineHeight:1.6}}>Konto <strong style={{color:C.t}}>{user?.email}</strong> wird unwiderruflich gelöscht — inklusive:</p>
      <ul style={{fontSize:13,color:C.t2,lineHeight:1.9,marginBottom:20,paddingLeft:20}}>
        <li>Login-Zugang</li>
        <li>Premium-Status</li>
        <li>Gespeicherter Lernfortschritt</li>
        <li>Protokoll erzeugter Lernnachweise</li>
      </ul>
      <p style={{fontSize:13,color:C.t2,marginBottom:16}}>Das kann nicht rückgängig gemacht werden. Tippe zur Bestätigung <strong style={{color:C.t}}>LÖSCHEN</strong> ein:</p>
      <input value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="LÖSCHEN" style={input}/>
      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}
      <button onClick={deleteAccount} disabled={!canDelete||busy} style={{width:"100%",justifyContent:"center",display:"flex",background:canDelete?"#dc2626":C.s2,color:canDelete?"#fff":C.mu,border:"none",borderRadius:10,padding:"13px 18px",fontSize:14,fontWeight:500,cursor:canDelete?"pointer":"default",fontFamily:ff,opacity:busy?.6:1}}>
        {busy?"Wird gelöscht...":"Konto endgültig löschen"}
      </button>
    </div></div>
  );
}

import { useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const fmtUntil=(iso)=>{
  if(!iso)return null;
  const d=new Date(iso);
  return d>new Date()?d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
};

export default function AdminScreen({onClose}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState(null); // null = noch nicht gesucht
  const [busy,setBusy]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [err,setErr]=useState(null);
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteBusy,setInviteBusy]=useState(false);
  const [inviteMsg,setInviteMsg]=useState(null);
  const [inviteLink,setInviteLink]=useState(null);
  const [copied,setCopied]=useState(false);

  const invite=async(e)=>{
    e.preventDefault();
    if(!inviteEmail.trim())return;
    setInviteBusy(true);setInviteMsg(null);setInviteLink(null);setCopied(false);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const r=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({email:inviteEmail.trim()}),
      });
      const d=await r.json();
      if(!r.ok){setInviteMsg({type:"error",text:d.error||"Einladen fehlgeschlagen."});setInviteBusy(false);return;}
      setInviteMsg({type:"info",text:`Link für ${inviteEmail.trim()} erzeugt — unten kopieren und selbst verschicken:`});
      setInviteLink(d.link);
    }catch(e){
      setInviteMsg({type:"error",text:describeError(e)});
    }
    setInviteBusy(false);
  };

  const copyLink=()=>{
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };

  const search=async(e)=>{
    e?.preventDefault();
    setBusy(true);setErr(null);
    const {data,error}=await supabase
      .from("profiles")
      .select("id,email,is_premium,premium_until,ai_enabled")
      .ilike("email",`%${query.trim()}%`)
      .order("email")
      .limit(25);
    setBusy(false);
    if(error){setErr(describeError(error));return;}
    setResults(data||[]);
  };

  const updateUser=async(id,patch)=>{
    setBusyId(id);
    const {error}=await supabase.from("profiles").update(patch).eq("id",id);
    setBusyId(null);
    if(error){setErr(describeError(error));return;}
    setResults(rs=>rs.map(r=>r.id===id?{...r,...patch}:r));
  };

  const grantMonth=(r)=>updateUser(r.id,{premium_until:new Date(Date.now()+30*24*60*60*1000).toISOString()});
  const togglePermanent=(r)=>updateUser(r.id,{is_premium:!r.is_premium});
  const revoke=(r)=>updateUser(r.id,{is_premium:false,premium_until:null});
  const toggleAi=(r)=>updateUser(r.id,{ai_enabled:!(r.ai_enabled??true)});

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>⚙️ Admin</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Neuen Nutzer einladen</p>
        <form onSubmit={invite} style={{display:"flex",gap:8}}>
          <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} type="email" placeholder="email@beispiel.de" style={input}/>
          <button type="submit" disabled={inviteBusy} style={{...pri,flexShrink:0,opacity:inviteBusy?.6:1}}>{inviteBusy?"...":"Einladen"}</button>
        </form>
        {inviteMsg&&<p style={{fontSize:12,color:inviteMsg.type==="error"?"#fca5a5":"#86efac",marginTop:8,marginBottom:inviteLink?6:0}}>{inviteMsg.text}</p>}
        {inviteLink&&<div style={{display:"flex",gap:8,marginTop:4}}>
          <input readOnly value={inviteLink} onFocus={e=>e.target.select()} style={{...input,fontSize:11,color:C.t2}}/>
          <button onClick={copyLink} style={{...ghost,flexShrink:0,fontSize:12,padding:"7px 12px"}}>{copied?"✓ Kopiert":"Kopieren"}</button>
        </div>}
      </div>

      <form onSubmit={search} style={{display:"flex",gap:8,marginBottom:20}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="E-Mail suchen..." style={input} autoFocus/>
        <button type="submit" disabled={busy} style={{...pri,flexShrink:0,opacity:busy?.6:1}}>{busy?"...":"Suchen"}</button>
      </form>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      {results===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>E-Mail (oder Teil davon) eingeben und suchen.</p>}
      {results?.length===0&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Keine Treffer.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {results?.map(r=>{
          const until=fmtUntil(r.premium_until);
          const active=r.is_premium||until;
          const aiOn=r.ai_enabled??true;
          return(
            <div key={r.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
                <span style={{fontSize:14,fontWeight:600,wordBreak:"break-all"}}>{r.email}</span>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:active?"#14532d":"#2a1a0f",color:active?"#86efac":"#fbbf24"}}>
                    {r.is_premium?"⭐ Dauerhaft":until?`Bis ${until}`:"Free"}
                  </span>
                  {!aiOn&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#450a0a",color:"#fca5a5"}}>🤖 Gesperrt</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button disabled={busyId===r.id} onClick={()=>togglePermanent(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:busyId===r.id?.6:1}}>
                  {r.is_premium?"Dauerhaft ausschalten":"Dauerhaft freischalten"}
                </button>
                <button disabled={busyId===r.id} onClick={()=>grantMonth(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:busyId===r.id?.6:1}}>+1 Monat</button>
                {active&&<button disabled={busyId===r.id} onClick={()=>revoke(r)} style={{...ghost,fontSize:12,padding:"7px 12px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:busyId===r.id?.6:1}}>Zugang entziehen</button>}
                <button disabled={busyId===r.id} onClick={()=>toggleAi(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:busyId===r.id?.6:1}}>
                  {aiOn?"🤖 KI sperren":"🤖 KI freischalten"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div></div>
  );
}

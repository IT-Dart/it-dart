import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner, ff } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";
import { useAuth } from "./lib/AuthContext";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const fmtUntil=(iso)=>{
  if(!iso)return null;
  const d=new Date(iso);
  return d>new Date()?d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
};

// UI-seitige Spiegelung des Schutzes aus den Edge Functions/SQL-Funktionen —
// die eigentliche Durchsetzung läuft serverseitig (RPC-Guards, RLS). Das hier
// sorgt nur dafür, dass ein Junior-Admin für dieses Konto gar keinen
// anklickbaren Button sieht.
const PROTECTED_UID="33271bc9-6b8a-456f-9cf1-a5c564218b07";

export default function AdminScreen({onClose}){
  const {isAdmin,isJuniorAdmin}=useAuth();
  const juniorOnly=isJuniorAdmin&&!isAdmin;
  const [query,setQuery]=useState("");
  const [results,setResults]=useState(null); // null = noch nicht gesucht
  const [busy,setBusy]=useState(false);
  const [busyId,setBusyId]=useState(null);
  const [err,setErr]=useState(null);
  const [actionMsg,setActionMsg]=useState(null);
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteBusy,setInviteBusy]=useState(false);
  const [inviteMsg,setInviteMsg]=useState(null);
  const [inviteLink,setInviteLink]=useState(null);
  const [copied,setCopied]=useState(false);
  const [traineePanels,setTraineePanels]=useState({}); // trainerId -> { open, loading, trainees, input, err }
  const [trainerList,setTrainerList]=useState(null); // alle Accounts mit is_trainer=true, für die Zuweisen-Auswahl
  const [assignPanels,setAssignPanels]=useState({}); // traineeId -> { open, loading, trainers, select, err }
  const [allUsers,setAllUsers]=useState(null); // alle Accounts, für die Testende-Auswahl per Dropdown

  const flash=(text)=>{setActionMsg(text);setTimeout(()=>setActionMsg(null),3000);};

  const loadTrainerList=async()=>{
    const {data:trainers,error:tErr}=await supabase.from("profiles").select("id,email,trainee_limit").eq("is_trainer",true).order("email");
    if(tErr){console.error("[AdminScreen] loadTrainerList failed:",tErr.message);setTrainerList([]);return;}
    const ids=(trainers||[]).map(t=>t.id);
    const counts={};
    if(ids.length){
      const {data:links}=await supabase.from("trainer_trainees").select("trainer_id").in("trainer_id",ids);
      (links||[]).forEach(l=>{counts[l.trainer_id]=(counts[l.trainer_id]||0)+1;});
    }
    setTrainerList((trainers||[]).map(t=>({...t,count:counts[t.id]||0})));
  };
  const loadAllUsers=async()=>{
    const {data,error}=await supabase.from("profiles").select("id,email").order("email");
    if(error){console.error("[AdminScreen] loadAllUsers failed:",error.message);setAllUsers([]);return;}
    setAllUsers(data||[]);
  };
  useEffect(()=>{loadTrainerList();loadAllUsers();},[]);

  const invite=async(e)=>{
    e.preventDefault();
    if(!inviteEmail.trim()){
      // Kein Ziel-E-Mail angegeben: statt einer persönlichen Einladung einen
      // allgemeinen Registrierungslink zeigen — dort trägt die Person selbst
      // E-Mail (mit Bestätigung) und Passwort ein.
      setInviteMsg({type:"info",text:"Allgemeiner Registrierungslink — die Person trägt beim Öffnen selbst ihre E-Mail-Adresse ein und bestätigt sie."});
      setInviteLink(`${window.location.origin}/?mode=register`);
      setCopied(false);
      return;
    }
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
      setInviteMsg({type:"info",text:`Einladung an ${inviteEmail.trim()} verschickt.${d.link?" Optional zusätzlich manuell teilen:":""}`});
      setInviteLink(d.link||null);
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
      .select("id,email,is_premium,premium_until,ai_enabled,interview_enabled,is_trainer,is_junior_admin,confirmed_at,trainee_limit,created_at")
      .ilike("email",`%${query.trim()}%`)
      .order("created_at",{ascending:false})
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

  // Wer aufhört Trainer zu sein, soll auch keine Testenden mehr zugewiesen
  // haben — sonst taucht er dort weiterhin als "zugewiesener Trainer" auf.
  const unassignAllTrainees=(trainerId)=>supabase.from("trainer_trainees").delete().eq("trainer_id",trainerId);

  const togglePermanent=async(r)=>{
    const patch=r.is_premium?{is_premium:false,is_trainer:false,is_junior_admin:false}:{is_premium:true};
    if(r.is_premium&&r.is_trainer)await unassignAllTrainees(r.id);
    await updateUser(r.id,patch);
    loadTrainerList();
  };
  const revoke=async(r)=>{
    if(r.is_trainer)await unassignAllTrainees(r.id);
    await updateUser(r.id,{is_premium:false,premium_until:null,is_trainer:false,is_junior_admin:false});
    loadTrainerList();
  };
  const toggleAi=async(r)=>{
    const next=!(r.ai_enabled??true);
    if(juniorOnly){
      setBusyId(r.id);
      const {error}=await supabase.rpc("set_ai_enabled",{target_id:r.id,enabled:next});
      setBusyId(null);
      if(error){setErr(describeError(error));return;}
      setResults(rs=>rs.map(x=>x.id===r.id?{...x,ai_enabled:next}:x));
      return;
    }
    updateUser(r.id,{ai_enabled:next});
  };
  const toggleInterview=async(r)=>{
    const next=!(r.interview_enabled??true);
    if(juniorOnly){
      setBusyId(r.id);
      const {error}=await supabase.rpc("set_interview_enabled",{target_id:r.id,enabled:next});
      setBusyId(null);
      if(error){setErr(describeError(error));return;}
      setResults(rs=>rs.map(x=>x.id===r.id?{...x,interview_enabled:next}:x));
      return;
    }
    updateUser(r.id,{interview_enabled:next});
  };
  const toggleTrainer=async(r)=>{
    if(r.is_trainer)await unassignAllTrainees(r.id);
    await updateUser(r.id,{is_trainer:!r.is_trainer});
    loadTrainerList();
  };
  const toggleJuniorAdmin=(r)=>updateUser(r.id,{is_junior_admin:!r.is_junior_admin});

  const deleteUser=async(r)=>{
    if(juniorOnly){
      // Junior-Admins dürfen nur ausstehende (nie bestätigte) Einladungen
      // entfernen — nie ein aktives Konto. Läuft deshalb über die engere
      // trainer-manage-invite-Funktion statt admin-delete-user.
      if(!window.confirm(`Ausstehende Einladung für ${r.email} wirklich löschen?`))return;
      setBusyId(r.id);setErr(null);
      try{
        const {data:{session}}=await supabase.auth.getSession();
        const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trainer-manage-invite`,{
          method:"POST",
          headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
          body:JSON.stringify({action:"delete",userId:r.id}),
        });
        const d=await res.json();
        if(!res.ok){setErr(d.error||"Löschen fehlgeschlagen.");setBusyId(null);return;}
        setResults(rs=>rs.filter(x=>x.id!==r.id));
      }catch(e){
        setErr(describeError(e));
      }
      setBusyId(null);
      return;
    }
    if(!window.confirm(`${r.email} wirklich unwiderruflich löschen? Alle Daten (Fortschritt, Lernnachweise) gehen verloren.`))return;
    setBusyId(r.id);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({userId:r.id}),
      });
      const d=await res.json();
      if(!res.ok){setErr(d.error||"Löschen fehlgeschlagen.");setBusyId(null);return;}
      setResults(rs=>rs.filter(x=>x.id!==r.id));
    }catch(e){
      setErr(describeError(e));
    }
    setBusyId(null);
  };

  const resendInvite=async(r)=>{
    setBusyId(r.id);setErr(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trainer-manage-invite`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({action:"resend",userId:r.id}),
      });
      const d=await res.json();
      if(!res.ok){setErr(d.error||"Erneutes Senden fehlgeschlagen.");setBusyId(null);return;}
      flash(`Einladung an ${r.email} erneut verschickt.`);
      // Resend legt das Konto unter einer neuen ID neu an — Liste neu laden.
      search();
    }catch(e){
      setErr(describeError(e));
    }
    setBusyId(null);
  };

  // Postgres liefert für Doppelzuweisungen nur einen technischen Constraint-
  // Fehler — hier auf eine verständliche Meldung abbilden. Das Kontingent-
  // Limit selbst kommt schon lesbar aus dem DB-Trigger (enforce_trainee_limit).
  const friendlyAssignError=(error)=>{
    if(error?.code==="23505")return "Dieser Nutzer ist diesem Trainer bereits zugewiesen.";
    if(error?.code==="42501")return "Diese Zuordnung ist nicht erlaubt — mindestens eines der Konten ist geschützt oder deine Berechtigung reicht dafür nicht aus.";
    return describeError(error);
  };

  const panelFor=(id)=>traineePanels[id]||{open:false,loading:false,trainees:null,input:"",err:null};
  const setPanel=(id,patch)=>setTraineePanels(p=>({...p,[id]:{...(p[id]||{open:false,loading:false,trainees:null,input:"",err:null}),...patch}}));

  const loadTrainees=async(trainerId)=>{
    setPanel(trainerId,{open:true,loading:true,err:null});
    const {data,error}=await supabase.from("trainer_trainees").select("trainee_id, profiles!trainee_id(id,email)").eq("trainer_id",trainerId);
    if(error){setPanel(trainerId,{loading:false,err:describeError(error)});return;}
    setPanel(trainerId,{loading:false,trainees:(data||[]).map(d=>d.profiles).filter(Boolean)});
  };

  const toggleTraineePanel=(trainerId)=>{
    const p=panelFor(trainerId);
    if(p.open){setPanel(trainerId,{open:false});return;}
    loadTrainees(trainerId);
  };

  const addTrainee=async(trainerId,limit)=>{
    const panel=panelFor(trainerId);
    const traineeId=panel.input;
    if(!traineeId)return;
    if((panel.trainees?.length??0)>=limit){
      setPanel(trainerId,{err:`Maximale Anzahl an Trainees erreicht (${panel.trainees.length}/${limit}). Bitte erhöhe das Kontingent, um weitere zuzuweisen.`});
      return;
    }
    setPanel(trainerId,{loading:true,err:null});
    const {error:insErr}=await supabase.from("trainer_trainees").insert({trainer_id:trainerId,trainee_id:traineeId});
    if(insErr){setPanel(trainerId,{loading:false,err:friendlyAssignError(insErr)});return;}
    setPanel(trainerId,{input:""});
    loadTrainees(trainerId);
    loadTrainerList();
  };

  const removeTrainee=async(trainerId,traineeId)=>{
    setPanel(trainerId,{loading:true});
    const {error}=await supabase.from("trainer_trainees").delete().eq("trainer_id",trainerId).eq("trainee_id",traineeId);
    if(error){setPanel(trainerId,{loading:false,err:describeError(error)});return;}
    loadTrainees(trainerId);
    loadTrainerList();
  };

  const assignPanelFor=(id)=>assignPanels[id]||{open:false,loading:false,trainers:null,select:"",err:null};
  const setAssignPanel=(id,patch)=>setAssignPanels(p=>({...p,[id]:{...(p[id]||{open:false,loading:false,trainers:null,select:"",err:null}),...patch}}));

  const loadAssignedTrainers=async(traineeId)=>{
    setAssignPanel(traineeId,{open:true,loading:true,err:null});
    const {data,error}=await supabase.from("trainer_trainees").select("trainer_id, profiles!trainer_id(id,email)").eq("trainee_id",traineeId);
    if(error){setAssignPanel(traineeId,{loading:false,err:describeError(error)});return;}
    setAssignPanel(traineeId,{loading:false,trainers:(data||[]).map(d=>d.profiles).filter(Boolean)});
  };

  const toggleAssignPanel=(traineeId)=>{
    const p=assignPanelFor(traineeId);
    if(p.open){setAssignPanel(traineeId,{open:false});return;}
    loadAssignedTrainers(traineeId);
  };

  const assignToTrainer=async(traineeId)=>{
    const trainerId=assignPanelFor(traineeId).select;
    if(!trainerId)return;
    const trainer=trainerList?.find(t=>t.id===trainerId);
    if(trainer&&trainer.count>=trainer.trainee_limit){
      setAssignPanel(traineeId,{err:`Maximale Anzahl an Trainees erreicht (${trainer.count}/${trainer.trainee_limit}). Bitte wende dich an den Administrator, um das Kontingent zu erweitern.`});
      return;
    }
    setAssignPanel(traineeId,{loading:true,err:null});
    const {error}=await supabase.from("trainer_trainees").insert({trainer_id:trainerId,trainee_id:traineeId});
    if(error){setAssignPanel(traineeId,{loading:false,err:friendlyAssignError(error)});return;}
    setAssignPanel(traineeId,{select:""});
    loadAssignedTrainers(traineeId);
    loadTrainerList();
  };

  const unassignTrainer=async(traineeId,trainerId)=>{
    setAssignPanel(traineeId,{loading:true});
    const {error}=await supabase.from("trainer_trainees").delete().eq("trainer_id",trainerId).eq("trainee_id",traineeId);
    if(error){setAssignPanel(traineeId,{loading:false,err:describeError(error)});return;}
    loadAssignedTrainers(traineeId);
    loadTrainerList();
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>{isAdmin?"⚙️ Admin":"🧑‍💼 Junior-Admin"}</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {juniorOnly&&<div style={{background:"#1e3a5f",border:"0.5px solid #2563eb",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <p style={{fontSize:13,color:"#93c5fd",margin:0}}>Eingeschränkter Zugang: Nutzer einsehen, einladen, KI-Zugriff und Trainer-Zuordnungen/Kontingente verwalten, ausstehende Einladungen erneut senden oder löschen. Ausgegraute Funktionen (Rechtevergabe, Löschen aktiver Konten) sind Admins vorbehalten.</p>
      </div>}

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
      {actionMsg&&<div style={{background:"#052e16",border:"0.5px solid #22c55e",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#86efac",margin:0}}>{actionMsg}</p>
      </div>}

      {results===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>E-Mail (oder Teil davon) eingeben und suchen.</p>}
      {results?.length===0&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Keine Treffer.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {results?.map(r=>{
          const until=fmtUntil(r.premium_until);
          const active=r.is_premium||until;
          const aiOn=r.ai_enabled??true;
          const interviewOn=r.interview_enabled??true;
          const panel=panelFor(r.id);
          const assignPanel=assignPanelFor(r.id);
          const atCapacity=panel.trainees!=null&&panel.trainees.length>=r.trainee_limit;
          // Rechtevergabe (Premium/Trainer/Junior-Admin) und das Löschen aktiver
          // Konten sind für Junior-Admins grundsätzlich gesperrt — unabhängig
          // von der Zeile. Für das geschützte Hauptkonto ist zusätzlich jede
          // einzelne Aktion gesperrt, auch die sonst erlaubten.
          const locked=juniorOnly&&r.id===PROTECTED_UID;
          const grantDisabled=busyId===r.id||juniorOnly;
          const rowDisabled=busyId===r.id||locked;
          const canDeleteThis=isAdmin||(!r.confirmed_at&&!locked);
          return(
            <div key={r.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
              <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
                <span style={{fontSize:14,fontWeight:600,overflowWrap:"anywhere"}}>{r.email}</span>
                <div style={{display:"flex",gap:6,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:active?"#14532d":"#2a1a0f",color:active?"#86efac":"#fbbf24"}}>
                    {r.is_premium?"⭐ Dauerhaft":until?`Bis ${until}`:"Free"}
                  </span>
                  {!aiOn&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#450a0a",color:"#fca5a5"}}>🤖 Gesperrt</span>}
                  {!interviewOn&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#450a0a",color:"#fca5a5"}}>🎤 Gesperrt</span>}
                  {r.is_trainer&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#1e3a5f",color:"#93c5fd"}}>🎓 Trainer</span>}
                  {r.is_junior_admin&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#312e81",color:"#c4b5fd"}}>🧑‍💼 Junior-Admin</span>}
                  {!r.confirmed_at&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:4,fontWeight:500,background:"#3a2a0f",color:"#fbbf24"}}>⏳ Einladung ausstehend</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button disabled={grantDisabled} title={juniorOnly?"Nur Admins können Rechte vergeben.":undefined} onClick={()=>togglePermanent(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:grantDisabled?.4:1,cursor:grantDisabled?"not-allowed":"pointer"}}>
                  {r.is_premium?"Dauerhaft ausschalten":"Dauerhaft freischalten"}
                </button>
                <button disabled={grantDisabled} title={juniorOnly?"Nur Admins können Rechte vergeben.":undefined} onClick={()=>grantMonth(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:grantDisabled?.4:1,cursor:grantDisabled?"not-allowed":"pointer"}}>+1 Monat</button>
                {active&&<button disabled={grantDisabled} title={juniorOnly?"Nur Admins können Rechte entziehen.":undefined} onClick={()=>revoke(r)} style={{...ghost,fontSize:12,padding:"7px 12px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:grantDisabled?.4:1,cursor:grantDisabled?"not-allowed":"pointer"}}>Zugang entziehen</button>}
                <button disabled={rowDisabled} title={locked?"Dieses Konto ist geschützt.":undefined} onClick={()=>toggleAi(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:rowDisabled?.5:1,cursor:rowDisabled?"not-allowed":"pointer"}}>
                  {aiOn?"🤖 KI sperren":"🤖 KI freischalten"}
                </button>
                <button disabled={rowDisabled} title={locked?"Dieses Konto ist geschützt.":undefined} onClick={()=>toggleInterview(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:rowDisabled?.5:1,cursor:rowDisabled?"not-allowed":"pointer"}}>
                  {interviewOn?"🎤 Mock-Interview sperren":"🎤 Mock-Interview freischalten"}
                </button>
                <button disabled={grantDisabled} title={juniorOnly?"Nur Admins können Rechte vergeben.":undefined} onClick={()=>toggleTrainer(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:grantDisabled?.4:1,cursor:grantDisabled?"not-allowed":"pointer"}}>
                  {r.is_trainer?"🎓 Trainer entfernen":"🎓 Zum Trainer machen"}
                </button>
                <button disabled={grantDisabled} title={juniorOnly?"Nur Admins können Rechte vergeben.":undefined} onClick={()=>toggleJuniorAdmin(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:grantDisabled?.4:1,cursor:grantDisabled?"not-allowed":"pointer"}}>
                  {r.is_junior_admin?"🧑‍💼 Junior-Admin entfernen":"🧑‍💼 Zum Junior-Admin machen"}
                </button>
                {r.is_trainer&&<button disabled={rowDisabled} title={locked?"Dieses Konto ist geschützt.":undefined} onClick={()=>toggleTraineePanel(r.id)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:rowDisabled?.5:1,cursor:rowDisabled?"not-allowed":"pointer"}}>
                  {panel.open?"Trainees verbergen ▴":"Trainees verwalten ▾"}
                </button>}
                <button disabled={rowDisabled} title={locked?"Dieses Konto ist geschützt.":undefined} onClick={()=>toggleAssignPanel(r.id)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:rowDisabled?.5:1,cursor:rowDisabled?"not-allowed":"pointer"}}>
                  {assignPanel.open?"Trainer-Zuweisung verbergen ▴":"Trainer zuweisen ▾"}
                </button>
                {!r.confirmed_at&&<button disabled={rowDisabled} title={locked?"Dieses Konto ist geschützt.":undefined} onClick={()=>resendInvite(r)} style={{...ghost,fontSize:12,padding:"7px 12px",opacity:rowDisabled?.5:1,cursor:rowDisabled?"not-allowed":"pointer"}}>🔁 Erneut senden</button>}
                <button disabled={busyId===r.id||!canDeleteThis} title={!canDeleteThis?(locked?"Dieses Konto ist geschützt.":"Junior-Admins können nur ausstehende Einladungen löschen."):undefined} onClick={()=>deleteUser(r)} style={{...ghost,fontSize:12,padding:"7px 12px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:(busyId===r.id||!canDeleteThis)?.4:1,cursor:(busyId===r.id||!canDeleteThis)?"not-allowed":"pointer"}}>🗑 Löschen</button>
              </div>
              {assignPanel.open&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.bd}`}}>
                  <p style={{fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:8}}>Zugewiesener Trainer</p>
                  {assignPanel.loading&&<p style={{fontSize:12,color:C.mu}}>Wird geladen...</p>}
                  {assignPanel.err&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:8}}>{assignPanel.err}</p>}
                  {!assignPanel.loading&&assignPanel.trainers?.length===0&&<p style={{fontSize:12,color:C.mu,marginBottom:8}}>Noch keinem Trainer zugewiesen.</p>}
                  {!assignPanel.loading&&assignPanel.trainers?.map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                      <span style={{fontSize:13,color:C.t2,wordBreak:"break-all"}}>{t.email}</span>
                      <button onClick={()=>unassignTrainer(r.id,t.id)} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:12,padding:0,fontFamily:ff}}>Entfernen</button>
                    </div>
                  ))}
                  {!trainerList?.length&&<p style={{fontSize:12,color:C.mu,marginTop:8}}>Es gibt noch keine Trainer-Accounts. Erst oben "Zum Trainer machen" verwenden.</p>}
                  {!!trainerList?.length&&(
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <select value={assignPanel.select} onChange={e=>setAssignPanel(r.id,{select:e.target.value})} style={{...input,fontSize:13,padding:"8px 12px"}}>
                        <option value="">Trainer wählen...</option>
                        {trainerList.filter(t=>t.id!==r.id).map(t=>{
                          const full=t.count>=t.trainee_limit;
                          return <option key={t.id} value={t.id} disabled={full}>{t.email} ({t.count}/{t.trainee_limit}{full?" — voll":""})</option>;
                        })}
                      </select>
                      <button onClick={()=>assignToTrainer(r.id)} style={{...ghost,flexShrink:0,fontSize:12,padding:"7px 12px"}}>Zuweisen</button>
                    </div>
                  )}
                </div>
              )}
              {panel.open&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:`0.5px solid ${C.bd}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    <p style={{fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,margin:0}}>Testende · {panel.trainees?.length??0} / {r.trainee_limit}</p>
                    <label style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.mu}}>
                      Kontingent
                      <input type="number" min="0" defaultValue={r.trainee_limit} onBlur={e=>{
                        const v=Math.max(0,parseInt(e.target.value,10)||0);
                        if(v===r.trainee_limit)return;
                        if(juniorOnly){
                          supabase.rpc("update_trainee_limit",{target_id:r.id,new_limit:v}).then(({error})=>{
                            if(error){setErr(describeError(error));return;}
                            setResults(rs=>rs.map(x=>x.id===r.id?{...x,trainee_limit:v}:x));
                            loadTrainerList();
                          });
                          return;
                        }
                        updateUser(r.id,{trainee_limit:v}).then(loadTrainerList);
                      }} style={{width:52,background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:6,color:C.t,padding:"3px 6px",fontSize:11,fontFamily:"inherit"}}/>
                    </label>
                  </div>
                  {panel.loading&&<p style={{fontSize:12,color:C.mu}}>Wird geladen...</p>}
                  {panel.err&&<p style={{fontSize:12,color:"#fca5a5",marginBottom:8}}>{panel.err}</p>}
                  {!panel.loading&&panel.trainees?.length===0&&<p style={{fontSize:12,color:C.mu,marginBottom:8}}>Noch keine Testenden zugewiesen.</p>}
                  {!panel.loading&&panel.trainees?.map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                      <span style={{fontSize:13,color:C.t2,wordBreak:"break-all"}}>{t.email}</span>
                      <button onClick={()=>removeTrainee(r.id,t.id)} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:12,padding:0,fontFamily:ff}}>Entfernen</button>
                    </div>
                  ))}
                  {atCapacity&&<p style={{fontSize:12,color:"#fbbf24",marginTop:8}}>Kontingent voll ({panel.trainees.length}/{r.trainee_limit}). Erhöhe die Zahl oben, um weitere Testende zuzuweisen.</p>}
                  {!atCapacity&&!allUsers?.filter(u=>u.id!==r.id&&!panel.trainees?.some(t=>t.id===u.id)).length&&<p style={{fontSize:12,color:C.mu,marginTop:8}}>{allUsers===null?"Nutzerliste wird geladen...":"Kein weiterer Nutzer zum Zuweisen verfügbar."}</p>}
                  {!atCapacity&&!!allUsers?.filter(u=>u.id!==r.id&&!panel.trainees?.some(t=>t.id===u.id)).length&&(
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <select value={panel.input} onChange={e=>setPanel(r.id,{input:e.target.value})} style={{...input,fontSize:13,padding:"8px 12px"}}>
                        <option value="">Nutzer wählen...</option>
                        {allUsers.filter(u=>u.id!==r.id&&!panel.trainees?.some(t=>t.id===u.id)).map(u=>(
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                      </select>
                      <button disabled={atCapacity} onClick={()=>addTrainee(r.id,r.trainee_limit)} style={{...ghost,flexShrink:0,fontSize:12,padding:"7px 12px",opacity:atCapacity?.6:1}}>+ Hinzufügen</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div></div>
  );
}

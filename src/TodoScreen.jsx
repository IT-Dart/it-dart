import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const STATUS_LABEL={open:"Offen",in_progress:"In Arbeit",done:"Erledigt"};
const PRIORITY_LABEL={low:"Niedrig",medium:"Mittel",high:"Hoch"};
const PRIORITY_COLOR={low:C.mu,medium:C.am,high:C.co};

const fmtDate=(iso)=>iso?new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;

export default function TodoScreen({onClose}){
  const [todos,setTodos]=useState(null); // null=lädt noch
  const [tools,setTools]=useState([]);
  const [filter,setFilter]=useState("open"); // "open" | "in_progress" | "done" | "all"
  const [busyId,setBusyId]=useState(null);
  const [err,setErr]=useState(null);
  const [form,setForm]=useState({title:"",description:"",priority:"medium",tool_slug:""});
  const [addBusy,setAddBusy]=useState(false);
  const [copiedId,setCopiedId]=useState(null);

  const load=async()=>{
    const {data,error}=await supabase.from("todos").select("*").order("status").order("priority",{ascending:false}).order("created_at",{ascending:false});
    if(error){setErr(describeError(error));setTodos([]);return;}
    setTodos(data||[]);
  };
  const loadTools=async()=>{
    const {data}=await supabase.from("tools").select("slug,name").order("name");
    setTools(data||[]);
  };
  useEffect(()=>{load();loadTools();},[]);

  const addTodo=async(e)=>{
    e.preventDefault();
    if(!form.title.trim())return;
    setAddBusy(true);setErr(null);
    const {error}=await supabase.from("todos").insert({
      title:form.title.trim(),
      description:form.description.trim()||null,
      priority:form.priority,
      tool_slug:form.tool_slug||null,
    });
    setAddBusy(false);
    if(error){setErr(describeError(error));return;}
    setForm({title:"",description:"",priority:"medium",tool_slug:""});
    load();
  };

  const setStatus=async(id,status)=>{
    setBusyId(id);
    const {error}=await supabase.from("todos").update({status}).eq("id",id);
    setBusyId(null);
    if(error){setErr(describeError(error));return;}
    load();
  };

  const copySolutionPrompt=async(t)=>{
    const tool=tools.find(x=>x.slug===t.tool_slug);
    const lines=[
      `To-Do: ${t.title}`,
      t.description?`Beschreibung: ${t.description}`:null,
      `Priorität: ${PRIORITY_LABEL[t.priority]}`,
      tool?`Bezug: ${tool.name}`:null,
      "",
      "Lass uns eine Lösung dafür überlegen.",
    ].filter(Boolean).join("\n");
    try{
      await navigator.clipboard.writeText(lines);
      setCopiedId(t.id);
      setTimeout(()=>setCopiedId(null),2000);
    }catch{
      setErr("Kopieren in die Zwischenablage fehlgeschlagen — Browser-Berechtigung prüfen.");
    }
  };

  const remove=async(id)=>{
    setBusyId(id);
    const {error}=await supabase.from("todos").delete().eq("id",id);
    setBusyId(null);
    if(error){setErr(describeError(error));return;}
    load();
  };

  const visible=(todos||[]).filter(t=>filter==="all"||t.status===filter);
  const counts={open:0,in_progress:0,done:0};
  (todos||[]).forEach(t=>{counts[t.status]=(counts[t.status]||0)+1;});

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>✅ To-Do</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      {err&&<div style={{background:"#450a0a",border:"0.5px solid #ef4444",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{fontSize:13,color:"#fca5a5",margin:0}}>{err}</p>
      </div>}

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Neuer Eintrag</p>
        <form onSubmit={addTodo} style={{display:"flex",flexDirection:"column",gap:8}}>
          <input placeholder="Titel" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={input} required/>
          <textarea placeholder="Beschreibung (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} style={{...input,resize:"vertical",fontFamily:"inherit"}}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...input,flex:"1 1 110px"}}>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
            <select value={form.tool_slug} onChange={e=>setForm(f=>({...f,tool_slug:e.target.value}))} style={{...input,flex:"1 1 140px"}}>
              <option value="">Kein Tool-Bezug</option>
              {tools.map(t=><option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={addBusy} style={{...pri,alignSelf:"flex-start",opacity:addBusy?.6:1}}>{addBusy?"...":"Hinzufügen"}</button>
        </form>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["open",`Offen (${counts.open||0})`],["in_progress",`In Arbeit (${counts.in_progress||0})`],["done",`Erledigt (${counts.done||0})`],["all","Alle"]].map(([k,label])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{...ghost,fontSize:12,padding:"6px 12px",background:filter===k?C.s2:"transparent",color:filter===k?C.t:C.t2,borderColor:filter===k?C.cy:C.bd}}>{label}</button>
        ))}
      </div>

      {todos===null&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Lädt…</p>}
      {todos!==null&&visible.length===0&&<p style={{fontSize:13,color:C.mu,textAlign:"center",padding:"20px 0"}}>Keine Einträge.</p>}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map(t=>{
          const busy=busyId===t.id;
          const tool=tools.find(x=>x.slug===t.tool_slug);
          const created=fmtDate(t.created_at);
          return(
            <div key={t.id} style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",opacity:t.status==="done"?.6:1}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:t.description?4:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:600,textDecoration:t.status==="done"?"line-through":"none"}}>{t.title}</span>
                <span style={{fontSize:10,fontWeight:600,color:PRIORITY_COLOR[t.priority],textTransform:"uppercase",letterSpacing:".03em"}}>{PRIORITY_LABEL[t.priority]}</span>
                {tool&&<span style={{fontSize:11,color:C.mu}}>· {tool.name}</span>}
                {created&&<span style={{fontSize:11,color:C.mu}}>· erstellt {created}</span>}
              </div>
              {t.description&&<p style={{fontSize:12,color:C.t2,margin:"0 0 8px",lineHeight:1.5}}>{t.description}</p>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <select disabled={busy} value={t.status} onChange={e=>setStatus(t.id,e.target.value)} style={{...input,width:"auto",padding:"5px 10px",fontSize:12}}>
                  <option value="open">{STATUS_LABEL.open}</option>
                  <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                  <option value="done">{STATUS_LABEL.done}</option>
                </select>
                <button disabled={busy} title="Kopiert den Kontext dieses To-Dos in die Zwischenablage — zum Einfügen in Claude Code" onClick={()=>copySolutionPrompt(t)} style={{...ghost,fontSize:12,padding:"6px 12px",marginLeft:"auto",opacity:busy?.5:1}}>{copiedId===t.id?"✓ Kopiert":"🔍 Lösung suchen"}</button>
                <button disabled={busy} onClick={()=>remove(t.id)} style={{...ghost,fontSize:12,padding:"6px 12px",color:"#fca5a5",borderColor:"#7f1d1d",opacity:busy?.5:1}}>Löschen</button>
              </div>
            </div>
          );
        })}
      </div>
    </div></div>
  );
}

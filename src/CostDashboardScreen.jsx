import { useEffect, useState } from "react";
import { C, pri, ghost, wrap, inner } from "./lib/theme";
import { supabase } from "./lib/supabaseClient";
import { describeError } from "./lib/errorText";

const input={width:"100%",background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,color:C.t,padding:"11px 14px",fontSize:14,outline:"none",fontFamily:"inherit"};

const CURRENCY_SYMBOL={USD:"$",EUR:"€"};

export default function CostDashboardScreen({onClose}){
  const [costSummary,setCostSummary]=useState(null); // null=lädt noch, [] = keine Daten
  const [toolOverview,setToolOverview]=useState(null); // Fixkosten+ai-chat-Kosten je registriertem Tool
  const [toolEdits,setToolEdits]=useState({}); // slug -> {feld:wert} für ungespeicherte Änderungen
  const [toolBusySlug,setToolBusySlug]=useState(null);
  const [newTool,setNewTool]=useState({slug:"",name:"",category:"",status:"idea",owner:""});
  const [toolMsg,setToolMsg]=useState(null);
  const [recurringCosts,setRecurringCosts]=useState(null); // null=lädt noch
  const [newCost,setNewCost]=useState({provider:"",amount:"",currency:"USD",billing_cycle:"monthly",category:""});
  const [costBusyId,setCostBusyId]=useState(null);
  const [recurringMsg,setRecurringMsg]=useState(null);

  const loadCostSummary=async()=>{
    const {data,error}=await supabase.rpc("get_ai_usage_cost_summary");
    if(error){console.error("[CostDashboardScreen] loadCostSummary failed:",error.message);setCostSummary([]);return;}
    setCostSummary(data||[]);
  };
  const loadToolOverview=async()=>{
    const {data:tools,error:tErr}=await supabase.from("tools").select("*").order("name");
    if(tErr){console.error("[CostDashboardScreen] loadToolOverview failed:",tErr.message);setToolOverview([]);return;}
    const {data:costs,error:cErr}=await supabase.rpc("get_tool_cost_overview");
    if(cErr){console.error("[CostDashboardScreen] get_tool_cost_overview failed:",cErr.message);}
    const costBySlug=Object.fromEntries((costs||[]).map(c=>[c.slug,c]));
    setToolOverview((tools||[]).map(t=>({...t,cost:costBySlug[t.slug]||null})));
  };
  const loadRecurringCosts=async()=>{
    const {data,error}=await supabase.from("recurring_costs").select("*").order("provider");
    if(error){console.error("[CostDashboardScreen] loadRecurringCosts failed:",error.message);setRecurringCosts([]);return;}
    setRecurringCosts(data||[]);
  };
  useEffect(()=>{loadCostSummary();loadToolOverview();loadRecurringCosts();},[]);

  const addRecurringCost=async(e)=>{
    e.preventDefault();
    if(!newCost.provider.trim()||!newCost.amount)return;
    setCostBusyId("__new__");
    const {error}=await supabase.from("recurring_costs").insert({
      provider:newCost.provider.trim(),
      amount:Number(newCost.amount),
      currency:newCost.currency,
      billing_cycle:newCost.billing_cycle,
      category:newCost.category.trim()||null,
    });
    setCostBusyId(null);
    if(error){setRecurringMsg({type:"error",text:describeError(error)});return;}
    setNewCost({provider:"",amount:"",currency:"USD",billing_cycle:"monthly",category:""});
    setRecurringMsg({type:"ok",text:"Fixkosten-Eintrag gespeichert."});
    setTimeout(()=>setRecurringMsg(null),3000);
    loadRecurringCosts();
  };

  const toggleRecurringActive=async(cost)=>{
    setCostBusyId(cost.id);
    const {error}=await supabase.from("recurring_costs").update({active:!cost.active}).eq("id",cost.id);
    setCostBusyId(null);
    if(error){setRecurringMsg({type:"error",text:describeError(error)});return;}
    loadRecurringCosts();
  };

  const deleteRecurringCost=async(cost)=>{
    setCostBusyId(cost.id);
    const {error}=await supabase.from("recurring_costs").delete().eq("id",cost.id);
    setCostBusyId(null);
    if(error){setRecurringMsg({type:"error",text:describeError(error)});return;}
    loadRecurringCosts();
  };

  const monthlyTotalsByCurrency=(recurringCosts||[]).filter(c=>c.active).reduce((acc,c)=>{
    const monthly=c.billing_cycle==="yearly"?Number(c.amount)/12:Number(c.amount);
    acc[c.currency]=(acc[c.currency]||0)+monthly;
    return acc;
  },{});

  const toolField=(slug,key,fallback)=>toolEdits[slug]?.[key]??fallback;
  const setToolField=(slug,key,value)=>setToolEdits(e=>({...e,[slug]:{...e[slug],[key]:value}}));

  const saveToolFixedCosts=async(t)=>{
    setToolBusySlug(t.slug);
    const patch={
      fixed_dev_cost_usd:Number(toolField(t.slug,"fixed_dev_cost_usd",t.fixed_dev_cost_usd))||0,
      fixed_design_cost_usd:Number(toolField(t.slug,"fixed_design_cost_usd",t.fixed_design_cost_usd))||0,
      fixed_asset_cost_usd:Number(toolField(t.slug,"fixed_asset_cost_usd",t.fixed_asset_cost_usd))||0,
      fixed_license_cost_usd:Number(toolField(t.slug,"fixed_license_cost_usd",t.fixed_license_cost_usd))||0,
      fixed_other_cost_usd:Number(toolField(t.slug,"fixed_other_cost_usd",t.fixed_other_cost_usd))||0,
      status:toolField(t.slug,"status",t.status),
      owner:toolField(t.slug,"owner",t.owner)??null,
      notes:toolField(t.slug,"notes",t.notes)??null,
    };
    const {error}=await supabase.from("tools").update(patch).eq("slug",t.slug);
    setToolBusySlug(null);
    if(error){setToolMsg({type:"error",text:describeError(error)});return;}
    setToolEdits(e=>{const n={...e};delete n[t.slug];return n;});
    setToolMsg({type:"ok",text:`${t.name} gespeichert.`});
    setTimeout(()=>setToolMsg(null),3000);
    loadToolOverview();
  };

  const addTool=async(e)=>{
    e.preventDefault();
    if(!newTool.slug.trim()||!newTool.name.trim())return;
    setToolBusySlug("__new__");
    const {error}=await supabase.from("tools").insert({
      slug:newTool.slug.trim(),name:newTool.name.trim(),
      category:newTool.category.trim()||null,status:newTool.status,owner:newTool.owner.trim()||null,
    });
    setToolBusySlug(null);
    if(error){setToolMsg({type:"error",text:describeError(error)});return;}
    setNewTool({slug:"",name:"",category:"",status:"idea",owner:""});
    setToolMsg({type:"ok",text:`${newTool.name} registriert.`});
    setTimeout(()=>setToolMsg(null),3000);
    loadToolOverview();
  };

  return(
    <div style={wrap}><div style={inner}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,paddingBottom:16,borderBottom:`0.5px solid ${C.bd}`}}>
        <span style={{fontSize:16,fontWeight:700}}>💰 Kosten</span>
        <button onClick={onClose} style={{...ghost,marginLeft:"auto",fontSize:13,padding:"6px 12px"}}>← Zurück</button>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>KI-Kosten (ai-chat + To-Do-Lösungssuche, berechnet aus echten Anthropic-Token-/Websuche-Zahlen)</p>
        {costSummary===null&&<p style={{fontSize:12,color:C.mu,margin:0}}>Lädt…</p>}
        {costSummary?.length===0&&<p style={{fontSize:12,color:C.mu,margin:0}}>Noch keine Daten.</p>}
        {costSummary?.length>0&&<div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{color:C.mu,textAlign:"left"}}>
              <th style={{padding:"4px 8px 6px 0",fontWeight:600}}>Monat</th>
              <th style={{padding:"4px 8px 6px 0",fontWeight:600}}>Anfragen</th>
              <th style={{padding:"4px 8px 6px 0",fontWeight:600}}>Input-Tokens</th>
              <th style={{padding:"4px 8px 6px 0",fontWeight:600}}>Output-Tokens</th>
              <th style={{padding:"4px 8px 6px 0",fontWeight:600}}>Websuchen</th>
              <th style={{padding:"4px 0 6px",fontWeight:600}}>Kosten (USD)</th>
            </tr></thead>
            <tbody>
              {costSummary.map(row=><tr key={row.month} style={{borderTop:`0.5px solid ${C.bd}`}}>
                <td style={{padding:"6px 8px 6px 0"}}>{row.month}</td>
                <td style={{padding:"6px 8px 6px 0"}}>{row.request_count}</td>
                <td style={{padding:"6px 8px 6px 0"}}>{Number(row.total_input_tokens).toLocaleString("de-DE")}</td>
                <td style={{padding:"6px 8px 6px 0"}}>{Number(row.total_output_tokens).toLocaleString("de-DE")}</td>
                <td style={{padding:"6px 8px 6px 0"}}>{Number(row.total_web_searches||0).toLocaleString("de-DE")}</td>
                <td style={{padding:"6px 0 6px"}}>${Number(row.total_cost_usd).toFixed(4)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>}
        <p style={{fontSize:11,color:C.mu,marginTop:8,marginBottom:0}}>Rechnerischer Wert zur Zuordnung — für das Finanzamt ist die echte Anthropic-Rechnung maßgeblich, monatlich abgleichen.</p>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Tool-Register (Fixkosten & Gesamtkosten)</p>
        {toolMsg&&<p style={{fontSize:12,color:toolMsg.type==="error"?"#fca5a5":"#86efac",marginBottom:8}}>{toolMsg.text}</p>}
        {toolOverview===null&&<p style={{fontSize:12,color:C.mu,margin:0}}>Lädt…</p>}
        {toolOverview?.length===0&&<p style={{fontSize:12,color:C.mu,margin:"0 0 12px"}}>Noch keine Tools registriert.</p>}
        {toolOverview?.map(t=>{
          const busy=toolBusySlug===t.slug;
          const dirty=!!toolEdits[t.slug];
          const total=t.cost?.total_cost_usd;
          return(
            <div key={t.slug} style={{background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:600}}>{t.name}</span>
                <span style={{fontSize:11,color:C.mu}}>({t.slug})</span>
                <select value={toolField(t.slug,"status",t.status)} onChange={e=>setToolField(t.slug,"status",e.target.value)} style={{...input,width:"auto",padding:"4px 8px",fontSize:11,marginLeft:"auto"}}>
                  <option value="idea">Idee</option>
                  <option value="development">Entwicklung</option>
                  <option value="beta">Beta</option>
                  <option value="live">Produktiv</option>
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:8}}>
                <label style={{fontSize:10,color:C.mu}}>Entwicklung ($)<input type="number" step="0.01" value={toolField(t.slug,"fixed_dev_cost_usd",t.fixed_dev_cost_usd)} onChange={e=>setToolField(t.slug,"fixed_dev_cost_usd",e.target.value)} style={{...input,padding:"6px 10px",fontSize:12,marginTop:2}}/></label>
                <label style={{fontSize:10,color:C.mu}}>Design ($)<input type="number" step="0.01" value={toolField(t.slug,"fixed_design_cost_usd",t.fixed_design_cost_usd)} onChange={e=>setToolField(t.slug,"fixed_design_cost_usd",e.target.value)} style={{...input,padding:"6px 10px",fontSize:12,marginTop:2}}/></label>
                <label style={{fontSize:10,color:C.mu}}>Assets ($)<input type="number" step="0.01" value={toolField(t.slug,"fixed_asset_cost_usd",t.fixed_asset_cost_usd)} onChange={e=>setToolField(t.slug,"fixed_asset_cost_usd",e.target.value)} style={{...input,padding:"6px 10px",fontSize:12,marginTop:2}}/></label>
                <label style={{fontSize:10,color:C.mu}}>Lizenzen ($)<input type="number" step="0.01" value={toolField(t.slug,"fixed_license_cost_usd",t.fixed_license_cost_usd)} onChange={e=>setToolField(t.slug,"fixed_license_cost_usd",e.target.value)} style={{...input,padding:"6px 10px",fontSize:12,marginTop:2}}/></label>
                <label style={{fontSize:10,color:C.mu}}>Sonstiges ($)<input type="number" step="0.01" value={toolField(t.slug,"fixed_other_cost_usd",t.fixed_other_cost_usd)} onChange={e=>setToolField(t.slug,"fixed_other_cost_usd",e.target.value)} style={{...input,padding:"6px 10px",fontSize:12,marginTop:2}}/></label>
              </div>
              <input placeholder="Verantwortlicher" value={toolField(t.slug,"owner",t.owner||"")} onChange={e=>setToolField(t.slug,"owner",e.target.value)} style={{...input,padding:"6px 10px",fontSize:12,marginBottom:8}}/>
              <textarea placeholder="Notizen / Datenquelle" value={toolField(t.slug,"notes",t.notes||"")} onChange={e=>setToolField(t.slug,"notes",e.target.value)} rows={2} style={{...input,padding:"6px 10px",fontSize:12,marginBottom:8,resize:"vertical",fontFamily:"inherit"}}/>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button disabled={busy||!dirty} onClick={()=>saveToolFixedCosts(t)} style={{...ghost,fontSize:12,padding:"6px 12px",opacity:busy||!dirty?.5:1,cursor:busy||!dirty?"not-allowed":"pointer"}}>{busy?"...":"Speichern"}</button>
                <span style={{fontSize:11,color:C.mu}}>Fixkosten: ${Number(t.cost?.fixed_cost_usd??0).toFixed(2)}{t.slug==="it-dart"&&<> · KI-Kosten: ${Number(t.cost?.variable_ai_cost_usd??0).toFixed(4)}</>}</span>
                <span style={{fontSize:11,fontWeight:600,marginLeft:"auto"}}>Gesamt: ${Number(total??0).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
        <form onSubmit={addTool} style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
          <input placeholder="slug (z. B. it-dart-kids)" value={newTool.slug} onChange={e=>setNewTool(n=>({...n,slug:e.target.value}))} style={{...input,flex:"1 1 140px"}}/>
          <input placeholder="Name" value={newTool.name} onChange={e=>setNewTool(n=>({...n,name:e.target.value}))} style={{...input,flex:"1 1 140px"}}/>
          <input placeholder="Kategorie" value={newTool.category} onChange={e=>setNewTool(n=>({...n,category:e.target.value}))} style={{...input,flex:"1 1 120px"}}/>
          <button type="submit" disabled={toolBusySlug==="__new__"} style={{...pri,flexShrink:0,opacity:toolBusySlug==="__new__"?.6:1}}>{toolBusySlug==="__new__"?"...":"Registrieren"}</button>
        </form>
      </div>

      <div style={{background:C.s1,border:`0.5px solid ${C.bd}`,borderRadius:12,padding:"14px 16px"}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",color:C.cy,marginBottom:10}}>Fixkosten-Register (wiederkehrende Abos)</p>
        <p style={{fontSize:11,color:C.mu,marginBottom:10}}>Manuell gepflegt — die meisten Anbieter (Claude Pro, Gemini Premium, STRATO, OpenArt) bieten keine automatisch abrufbare Abrechnungs-API.</p>
        {recurringMsg&&<p style={{fontSize:12,color:recurringMsg.type==="error"?"#fca5a5":"#86efac",marginBottom:8}}>{recurringMsg.text}</p>}
        {Object.keys(monthlyTotalsByCurrency).length>0&&<div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
          {Object.entries(monthlyTotalsByCurrency).map(([cur,total])=>(
            <div key={cur}>
              <div style={{fontSize:20,fontWeight:700}}>{CURRENCY_SYMBOL[cur]||cur}{total.toFixed(2)}<span style={{fontSize:11,fontWeight:400,color:C.mu}}> /Monat</span></div>
            </div>
          ))}
        </div>}
        {recurringCosts===null&&<p style={{fontSize:12,color:C.mu,margin:"0 0 12px"}}>Lädt…</p>}
        {recurringCosts?.length===0&&<p style={{fontSize:12,color:C.mu,margin:"0 0 12px"}}>Noch keine Fixkosten erfasst.</p>}
        {recurringCosts?.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,background:C.s2,border:`0.5px solid ${C.bd}`,borderRadius:10,padding:"8px 12px",marginBottom:6,opacity:c.active?1:.5,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:600}}>{c.provider}</span>
            {c.category&&<span style={{fontSize:11,color:C.mu}}>({c.category})</span>}
            <span style={{fontSize:12,color:C.t2,marginLeft:"auto"}}>{CURRENCY_SYMBOL[c.currency]||c.currency}{Number(c.amount).toFixed(2)} / {c.billing_cycle==="yearly"?"Jahr":"Monat"}</span>
            <button onClick={()=>toggleRecurringActive(c)} disabled={costBusyId===c.id} style={{...ghost,fontSize:11,padding:"4px 8px"}}>{c.active?"Pausieren":"Aktivieren"}</button>
            <button onClick={()=>deleteRecurringCost(c)} disabled={costBusyId===c.id} style={{...ghost,fontSize:11,padding:"4px 8px",color:"#fca5a5"}}>Löschen</button>
          </div>
        ))}
        <form onSubmit={addRecurringCost} style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
          <input placeholder="Anbieter (z. B. Vercel)" value={newCost.provider} onChange={e=>setNewCost(n=>({...n,provider:e.target.value}))} style={{...input,flex:"1 1 140px"}}/>
          <input type="number" step="0.01" placeholder="Betrag" value={newCost.amount} onChange={e=>setNewCost(n=>({...n,amount:e.target.value}))} style={{...input,flex:"1 1 90px"}}/>
          <select value={newCost.currency} onChange={e=>setNewCost(n=>({...n,currency:e.target.value}))} style={{...input,flex:"0 1 80px"}}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <select value={newCost.billing_cycle} onChange={e=>setNewCost(n=>({...n,billing_cycle:e.target.value}))} style={{...input,flex:"0 1 110px"}}>
            <option value="monthly">monatlich</option>
            <option value="yearly">jährlich</option>
          </select>
          <input placeholder="Kategorie (optional)" value={newCost.category} onChange={e=>setNewCost(n=>({...n,category:e.target.value}))} style={{...input,flex:"1 1 120px"}}/>
          <button type="submit" disabled={costBusyId==="__new__"} style={{...pri,flexShrink:0,opacity:costBusyId==="__new__"?.6:1}}>{costBusyId==="__new__"?"...":"Hinzufügen"}</button>
        </form>
      </div>
    </div></div>
  );
}

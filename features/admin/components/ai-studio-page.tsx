"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { apiRequest } from "@/features/admin/api/admin.api";
import { useAdminResource } from "./admin-kit";

type Overview = { today_prompts:number; success_rate:number; average_latency_ms:number; fallback_rate:number; failed_builds:number; active_providers:number; provider_count:number };
type Target = { id:string; key:string; label:string; media_type:"image"|"video"; public:boolean; active:boolean; recommended:boolean; published_version:string|null; status:string; display_order:number; description:string };
type Module = { id:string; key:string; title:string; category:string; media_type:string; published_version:number|null; draft_version:number|null; version_count:number };
type Provider = { provider_key:string; enabled:boolean; configured:boolean; priority:number; model_alias:string; timeout_seconds:number; structured_output_mode:string; circuit_state:string };
type Version = { id:string; resource:string; version:string; status:string; checksum:string|null; created_at:string };
type Log = { id:string; created_at:string; media_type:string; status:string; provider_key:string|null; latency_ms:number|null; fallback_count:number; error_code:string|null };
type Tab = "overview"|"targets"|"modules"|"providers"|"versions"|"logs";

const tabs: [Tab,string][] = [["overview","Umumiy"],["targets","Prompt modellari"],["modules","Yo‘riqnomalar"],["providers","Providerlar"],["versions","Versiyalar"],["logs","Loglar"]];

function Status({value}:{value:string|boolean}) {
  const text = typeof value === "boolean" ? (value ? "Faol" : "Yashirin") : value;
  return <span className={`ai-studio-status ${String(value)==="false"||text==="draft"||text==="failed"?"warn":"ok"}`}>{text}</span>;
}

export default function AIStudioPage() {
  const [tab,setTab]=useState<Tab>("overview");
  const [query,setQuery]=useState("");
  const overview=useAdminResource<Overview>("/admin/prompt-builder/overview");
  const targets=useAdminResource<Target[]>("/admin/prompt-builder/targets");
  const modules=useAdminResource<Module[]>("/admin/prompt-builder/modules");
  const providers=useAdminResource<Provider[]>("/admin/prompt-builder/providers");
  const versions=useAdminResource<Version[]>("/admin/prompt-builder/versions");
  const logs=useAdminResource<Log[]>("/admin/prompt-builder/logs?limit=100");
  const filteredTargets=useMemo(()=>(targets.data??[]).filter(x=>`${x.label} ${x.key}`.toLowerCase().includes(query.toLowerCase())),[targets.data,query]);
  const loading=[overview,targets,modules,providers,versions,logs].some(x=>x.loading);
  const error=[overview,targets,modules,providers,versions,logs].find(x=>x.error)?.error;

  async function toggleProvider(provider:Provider){
    await apiRequest(`/admin/prompt-builder/providers/${provider.provider_key}`,{method:"PATCH",body:JSON.stringify({enabled:!provider.enabled})});
    await providers.reload();
  }

  return <div className="ai-studio">
    <header className="ai-studio-head"><div><span>ADMIN PANEL / AI YORDAMCHI</span><h1>AI yordamchi boshqaruvi</h1><p>Prompt modellari, yo‘riqnomalar va LLM providerlarini bitta joydan boshqaring.</p></div><Link className="button button-primary" href="/admin/ai-assistant?tab=targets">+ Yangi prompt modeli</Link></header>
    <nav className="ai-studio-tabs">{tabs.map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    {loading&&<p className="ai-studio-message">Ma’lumotlar yuklanmoqda…</p>}
    {error&&<p className="ai-studio-message error">{error}</p>}
    {tab==="overview"&&overview.data&&<>
      <section className="ai-studio-metrics"><article><span>Bugungi promptlar</span><b>{overview.data.today_prompts.toLocaleString()}</b></article><article><span>Muvaffaqiyat</span><b>{overview.data.success_rate}%</b></article><article><span>O‘rtacha javob</span><b>{(overview.data.average_latency_ms/1000).toFixed(1)} s</b></article><article><span>Aktiv providerlar</span><b>{overview.data.active_providers} / {overview.data.provider_count}</b></article></section>
      <section className="ai-studio-split"><article className="ai-studio-card"><h2>Prompt modellari</h2><MiniTargets rows={(targets.data??[]).slice(0,6)}/><button onClick={()=>setTab("targets")}>Barcha modellarni ko‘rish →</button></article><article className="ai-studio-card"><h2>LLM provider routing</h2>{(providers.data??[]).map(p=><div className="ai-provider-row" key={p.provider_key}><b>{p.provider_key}</b><span>{p.configured?"● Ulangan":"○ API kalit yo‘q"}</span><em>Priority {p.priority}</em><Status value={p.enabled}/></div>)}</article></section>
    </>}
    {tab==="targets"&&<section className="ai-studio-card"><div className="ai-studio-toolbar"><h2>Prompt modellari</h2><input placeholder="Model nomi yoki kalit bo‘yicha qidirish" value={query} onChange={e=>setQuery(e.target.value)}/></div><MiniTargets rows={filteredTargets} full/></section>}
    {tab==="modules"&&<section className="ai-studio-card"><h2>Yo‘riqnoma modullari</h2><p>Shared bilim modullari target profillarga versiya bo‘yicha ulanadi.</p><div className="ai-studio-table"><div className="head"><span>Modul</span><span>Canonical key</span><span>Kategoriya</span><span>Tur</span><span>Published</span><span>Versiyalar</span></div>{(modules.data??[]).map(m=><div className="row" key={m.id}><b>{m.title}</b><span>{m.key}</span><span>{m.category}</span><span>{m.media_type}</span><Status value={m.published_version?`v${m.published_version}`:"—"}/><span>{m.version_count}</span></div>)}</div></section>}
    {tab==="providers"&&<section className="ai-studio-grid">{(providers.data??[]).map(p=><article className="ai-provider-card" key={p.provider_key}><header><h2>{p.provider_key}</h2><Status value={p.enabled}/></header><dl><div><dt>Model alias</dt><dd>{p.model_alias}</dd></div><div><dt>Structured output</dt><dd>{p.structured_output_mode}</dd></div><div><dt>Timeout</dt><dd>{p.timeout_seconds}s</dd></div><div><dt>API key</dt><dd>{p.configured?"Sozlangan":"Sozlanmagan"}</dd></div></dl><button className="button button-ghost" onClick={()=>void toggleProvider(p)}>{p.enabled?"O‘chirish":"Yoqish"}</button></article>)}</section>}
    {tab==="versions"&&<section className="ai-studio-card"><h2>Versiyalar tarixi</h2><div className="ai-studio-table versions"><div className="head"><span>Resurs</span><span>Versiya</span><span>Status</span><span>Checksum</span><span>Vaqt</span></div>{(versions.data??[]).map(v=><div className="row" key={v.id}><b>{v.resource}</b><span>{v.version}</span><Status value={v.status}/><span>{v.checksum?.slice(0,10)??"—"}</span><span>{new Date(v.created_at).toLocaleString("uz-UZ")}</span></div>)}</div></section>}
    {tab==="logs"&&<section className="ai-studio-card"><h2>Prompt run loglari</h2><div className="ai-studio-table logs"><div className="head"><span>Vaqt</span><span>Run ID</span><span>Tur</span><span>Provider</span><span>Status</span><span>Latency</span><span>Fallback</span></div>{(logs.data??[]).map(l=><div className="row" key={l.id}><span>{new Date(l.created_at).toLocaleTimeString("uz-UZ")}</span><b>{l.id.slice(0,8)}…</b><span>{l.media_type}</span><span>{l.provider_key??"—"}</span><Status value={l.status}/><span>{l.latency_ms?`${(l.latency_ms/1000).toFixed(1)}s`:"—"}</span><span>{l.fallback_count}</span></div>)}</div></section>}
  </div>;
}

function MiniTargets({rows,full=false}:{rows:Target[];full?:boolean}){
  return <div className={`ai-studio-table targets ${full?"full":""}`}><div className="head"><span>Model</span><span>Tur</span><span>Public</span><span>Versiya</span><span>Holat</span><span>Amal</span></div>{rows.map(x=><div className="row" key={x.id}><b>{x.label}<small>{full?x.key:""}</small></b><span>{x.media_type==="image"?"Tasvir":"Video"}</span><Status value={x.public}/><span>{x.published_version??"—"}</span><Status value={x.status}/><Link href={`/admin/ai-assistant/targets/${x.id}`}>Tahrirlash</Link></div>)}</div>;
}

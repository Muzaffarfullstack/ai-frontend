"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "@/components/providers";
import { apiRequest } from "@/features/admin/api/admin.api";
import { localizedApiError, type PromptModelAdmin } from "@/lib/api-client";
import {
  AdminConfirmDialog,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminMetrics,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  AdminTable,
  useAdminResource,
} from "./admin-kit";

export default function AdminPromptModelsPage() {
  const { t } = useLocale();
  const resource = useAdminResource<PromptModelAdmin[]>("/admin/prompt-models/");
  const [selected, setSelected] = useState<PromptModelAdmin | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromptModelAdmin | null>(null);
  const [error, setError] = useState("");
  const rows = resource.data ?? [];

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      key: data.get("key"), public_name: data.get("public_name"), provider: data.get("provider"),
      media_type: data.get("media_type"), description: data.get("description"),
      display_order: Number(data.get("display_order") || 1),
      supported_aspect_ratios: String(data.get("ratios") || "").split(",").map((value) => value.trim()).filter(Boolean),
      supported_durations: [], detail_levels: ["balanced", "high"],
      supports_reference_images: data.get("supports_reference_images") === "on",
      supports_start_end_frames: false, supports_multi_shot: data.get("supports_multi_shot") === "on",
      supports_native_audio: data.get("supports_native_audio") === "on",
      supports_negative_prompt: data.get("supports_negative_prompt") === "on",
      system_instructions: data.get("system_instructions"), instruction_version: data.get("instruction_version"),
      is_active: true, is_public: true,
    };
    try {
      await apiRequest("/admin/prompt-models/", { method: "POST", body: JSON.stringify(payload) });
      setCreating(false);
      await resource.reload();
    } catch (reason) { setError(localizedApiError(reason, t)); }
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest(`/admin/prompt-models/${selected.id}`, { method: "PATCH", body: JSON.stringify({
        public_name: data.get("public_name"), description: data.get("description"),
        system_instructions: data.get("system_instructions"), instruction_version: data.get("instruction_version"),
        is_active: data.get("is_active") === "on", is_public: data.get("is_public") === "on",
      }) });
      setSelected(null);
      await resource.reload();
    } catch (reason) { setError(localizedApiError(reason, t)); }
  }

  return <>
    <AdminPageHeader eyebrow="PROMPT BUILDER SOZLAMALARI" title="AI modellari" subtitle="Prompt builder modellari va modelga xos qoidalarni kod deploy qilmasdan boshqaring." action={<button className="button button-primary" onClick={() => setCreating(true)}>+ Model qo‘shish</button>} />
    <div className="admin-info-banner">Bu modul media yaratmaydi. U tanlangan model uchun inglizcha professional prompt tayyorlaydi.</div>
    <AdminMetrics items={[{label:"Jami modellar",value:String(rows.length),icon:"sparkles"},{label:"Faol",value:String(rows.filter(x=>x.is_active).length),icon:"check"},{label:"Tasvir",value:String(rows.filter(x=>x.media_type==="image").length),icon:"image"},{label:"Video",value:String(rows.filter(x=>x.media_type==="video").length),icon:"video"}]} />
    {error && <div className="admin-error"><p>{error}</p></div>}
    {resource.loading ? <AdminLoading /> : resource.error ? <AdminError message={resource.error} retry={() => void resource.reload()} /> : rows.length ? <AdminPanel><AdminTable headings={["Model","Turi","Provider","Versiya","Holat","Amallar"]}>{rows.map(model => <tr key={model.id}><td><b>{model.public_name}</b><small>{model.description}</small></td><td>{model.media_type === "image" ? "Tasvir" : "Video"}</td><td>{model.provider}</td><td>{model.instruction_version}</td><td><AdminStatus value={model.is_active ? "active" : "inactive"} /></td><td><div className="admin-row-actions"><button className="admin-row-button" onClick={() => setSelected(model)}>Boshqarish →</button><button className="admin-row-button danger" onClick={() => setDeleteTarget(model)}>O‘chirish</button></div></td></tr>)}</AdminTable></AdminPanel> : <AdminPanel><AdminEmpty icon="sparkles" title="AI modellari mavjud emas" body="Prompt builder uchun birinchi modelni qo‘shing." /></AdminPanel>}
    {(creating || selected) && <aside className="admin-drawer admin-model-drawer" role="dialog" aria-modal="true"><header><div><span className="eyebrow">{selected ? "MODEL SOZLAMALARI" : "YANGI MODEL"}</span><h2>{selected?.public_name ?? "Model qo‘shish"}</h2></div><button onClick={() => { setCreating(false); setSelected(null); }} aria-label="Yopish">×</button></header>
      {selected ? <form className="admin-drawer-form" onSubmit={update}><label>Public nomi<input name="public_name" defaultValue={selected.public_name} required /></label><label>Qisqa tavsif<textarea name="description" defaultValue={selected.description} required /></label><label>Modelga xos yo‘riqnoma<textarea name="system_instructions" rows={12} defaultValue={selected.system_instructions} required /></label><label>Versiya<input name="instruction_version" defaultValue={selected.instruction_version} required /></label><label className="switch-row"><input type="checkbox" name="is_active" defaultChecked={selected.is_active} /> Faol</label><label className="switch-row"><input type="checkbox" name="is_public" defaultChecked={selected.is_public} /> AI yordamchida ko‘rsatish</label><button className="button button-primary">Saqlash</button></form>
      : <form className="admin-drawer-form" onSubmit={create}><label>Model kaliti<input name="key" pattern="[a-z0-9_-]+" required /></label><label>Public nomi<input name="public_name" required /></label><label>Provider<input name="provider" required /></label><label>Turi<select name="media_type"><option value="image">Tasvir</option><option value="video">Video</option></select></label><label>Qisqa tavsif<textarea name="description" required /></label><label>Formatlar<input name="ratios" defaultValue="1:1, 4:5, 16:9, 9:16" /></label><label>Tartib<input name="display_order" type="number" min="1" defaultValue="1" /></label><label>Versiya<input name="instruction_version" defaultValue="v1" required /></label><label>Modelga xos yo‘riqnoma<textarea name="system_instructions" rows={10} required /></label><label className="switch-row"><input type="checkbox" name="supports_reference_images" /> Reference rasm</label><label className="switch-row"><input type="checkbox" name="supports_multi_shot" /> Multi-shot</label><label className="switch-row"><input type="checkbox" name="supports_native_audio" /> Native audio</label><label className="switch-row"><input type="checkbox" name="supports_negative_prompt" /> Negative prompt</label><button className="button button-primary">Saqlash</button></form>}
    </aside>}
    {deleteTarget && <AdminConfirmDialog title="AI modelni o‘chirish" body={`${deleteTarget.public_name} prompt builder ro‘yxatidan butunlay o‘chiriladi.`} confirmLabel="O‘chirish" tone="danger" onCancel={() => setDeleteTarget(null)} onConfirm={async () => { try { await apiRequest(`/admin/prompt-models/${deleteTarget.id}`, { method: "DELETE" }); setDeleteTarget(null); setSelected(null); await resource.reload(); } catch (reason) { setError(localizedApiError(reason, t)); } }} />}
  </>;
}

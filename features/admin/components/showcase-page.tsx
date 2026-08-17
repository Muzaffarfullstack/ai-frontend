"use client";

import { type FormEvent, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { useLocale } from "@/components/providers";
import { localizedApiError, type GalleryPost } from "@/lib/api-client";
import { apiRequest } from "@/features/admin/api/admin.api";
import {
  AdminEmpty,
  AdminConfirmDialog,
  AdminError,
  AdminLoading,
  AdminMetrics,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  useAdminResource,
} from "@/features/admin/components/admin-kit";

export default function AdminShowcasePage() {
  const { t } = useLocale();
  const resource = useAdminResource<GalleryPost[]>("/admin/gallery?limit=100");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GalleryPost | null>(null);
  const rows = resource.data ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("position", String(rows.length + 1));
    data.set("is_featured", "true");
    data.set("is_published", "false");
    data.set("consent_confirmed", "true");
    data.set("seo_alt_text", String(data.get("description") ?? ""));
    try {
      await apiRequest("/admin/gallery/upload", { method: "POST", body: data });
      form.reset();
      setOpen(false);
      await resource.reload();
    } catch (reason) {
      setError(localizedApiError(reason, t));
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="LANDING CONTENT"
        title="Landing galereyasi"
        subtitle="Bosh sahifadagi “O‘quvchilar natijalari” blokida ko‘rinadigan rasmlarni boshqaring."
        action={<button className="button button-primary" type="button" onClick={() => setOpen(true)}>+ Ish qo‘shish</button>}
      />
      <div className="admin-info-box gallery-purpose-note">
        Bu bo‘lim kurs jarayoniga ta’sir qilmaydi. Faqat marketing uchun kerak: student roziligi bilan yaxshi ishlarni landing sahifasida ko‘rsatadi. Ishlatmasangiz, bo‘sh qoldirishingiz mumkin.
      </div>
      <AdminMetrics items={[
        { label: "Jami", value: String(rows.length), icon: "star" },
        { label: "Published", value: String(rows.filter((item) => item.is_published).length), icon: "check" },
        { label: "Draft", value: String(rows.filter((item) => !item.is_published).length), icon: "file" },
        { label: "Landingda", value: String(rows.filter((item) => item.is_featured && item.is_published).length), icon: "sparkles" },
      ]} />
      {error && <div className="admin-error"><p>{error}</p></div>}
      {resource.loading ? (
        <AdminLoading />
      ) : resource.error ? (
        <AdminError message={resource.error} retry={() => void resource.reload()} />
      ) : rows.length ? (
        <AdminPanel>
          <div className="admin-showcase-grid">
            {rows.map((work) => (
              <article key={work.id}>
                <MediaImage src={work.media_url} alt={work.title} sizes="(max-width:760px) 100vw, 30vw" className="media-image" />
                <div>
                  <h3>{work.title}</h3>
                  <p>{work.author_name} · {work.tool_name ?? work.media_type}</p>
                  <AdminStatus value={work.is_published ? "published" : "draft"} />
                  <small>{work.consent_confirmed ? "Muallif roziligi tasdiqlangan" : "Rozilik tasdiqlanmagan"}</small>
                  {!work.consent_confirmed && <button type="button" onClick={async () => { await apiRequest(`/admin/gallery/${work.id}`, { method: "PATCH", body: JSON.stringify({ consent_confirmed: true }) }); await resource.reload(); }}>Rozilikni tasdiqlash</button>}
                  <button type="button" onClick={async () => {
                    await apiRequest(`/admin/gallery/${work.id}`, { method: "PATCH", body: JSON.stringify({ is_published: !work.is_published }) });
                    await resource.reload();
                  }} disabled={!work.consent_confirmed}>{work.is_published ? "Landingdan olish" : "Landingda ko‘rsatish"}</button>
                  <button type="button" className="danger" onClick={() => setDeleteTarget(work)}>O‘chirish</button>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>
      ) : (
        <AdminPanel><AdminEmpty icon="star" title="Landing galereyasi bo‘sh" body="Bu ixtiyoriy. Student ishlarini bosh sahifada ko‘rsatmoqchi bo‘lsangiz qo‘shing." action={<button className="button button-primary" type="button" onClick={() => setOpen(true)}>Birinchi ishni qo‘shish</button>} /></AdminPanel>
      )}
      {open && (
        <aside className="admin-drawer" role="dialog" aria-modal="true">
          <header><h2>Landingga ish qo‘shish</h2><button type="button" aria-label="Yopish" onClick={() => setOpen(false)}>×</button></header>
          <form className="admin-drawer-form" onSubmit={submit}>
            <label>Muallif public nomi<input name="author_name" required /></label>
            <label>Sarlavha<input name="title" required /></label>
            <label>Rasm<input name="media" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
            <label>AI vosita<input name="tool_name" /></label>
            <label>Alt matn / izoh<textarea name="description" required /></label>
            <label className="auth-checkbox"><input type="checkbox" name="consent" required /><span>Muallif roziligi olingan</span></label>
            <button className="button button-primary">Draft sifatida saqlash</button>
          </form>
        </aside>
      )}
      {deleteTarget && <AdminConfirmDialog title="Galereya ishini o‘chirish" body={`${deleteTarget.title} landing galereyasidan butunlay o‘chiriladi.`} confirmLabel="O‘chirish" tone="danger" onCancel={() => setDeleteTarget(null)} onConfirm={async () => { try { await apiRequest(`/admin/gallery/${deleteTarget.id}`, { method: "DELETE" }); setDeleteTarget(null); await resource.reload(); } catch (reason) { setError(localizedApiError(reason, t)); } }} />}
    </>
  );
}

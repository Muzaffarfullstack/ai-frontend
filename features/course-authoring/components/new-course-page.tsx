"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useLocale } from "@/components/providers";
import { apiRequest, localizedApiError } from "@/lib/api-client";
import { createCourse } from "@/features/course-authoring/api/new-course.api";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/admin-kit";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewCoursePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const image = data.get("thumbnail");
    try {
      const course = await createCourse({
        title: title.trim(),
        slug,
        short_description: String(data.get("short_description") || "") || null,
        description: String(data.get("description") || "") || null,
        category: data.get("category") || null,
        level: data.get("level") || null,
        language: data.get("language") || "uz",
        translations: {},
        price: Number(data.get("price") || 0),
        currency: "UZS",
      });
      let coverFailed = false;
      if (image instanceof File && image.size) {
        const thumbnail = new FormData();
        thumbnail.set("thumbnail", image);
        try {
          await apiRequest(`/admin/courses/${course.id}/thumbnail`, { method: "POST", body: thumbnail });
        } catch { coverFailed = true; }
      }
      router.replace(`/admin/courses/${course.id}/content${coverFailed ? "?notice=cover-upload-failed" : ""}`);
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="YANGI KURS"
        title="Kurs asoslarini kiriting"
        subtitle="Avval kursni qoralama sifatida yarating. Bo‘lim va darslarni keyingi ekranda qo‘shasiz."
        action={<Link className="button button-ghost" href="/admin/courses">← Kurslar</Link>}
      />
      <div className="course-flow" aria-label="Kurs yaratish bosqichlari">
        <span className="active"><b>1</b> Asosiy</span>
        <span><b>2</b> Bo‘limlar va darslar</span>
        <span><b>3</b> Nashr</span>
      </div>
      {error && <div className="form-error page-alert">{error}</div>}
      <form className="course-create-workspace-form" onSubmit={submit}>
        <div className="course-create-layout">
          <AdminPanel className="course-create-basics">
            <div className="admin-form-grid course-editor-form">
              <label className="field-wide">
                Kurs nomi <span className="required-mark">*</span>
                <input
                  name="title"
                  required
                  value={title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setTitle(nextTitle);
                    if (!slugEdited) setSlug(toSlug(nextTitle));
                  }}
                  placeholder="Masalan: AI Image Creation"
                />
              </label>
              <label className="field-wide">Qisqa tavsif <span className="required-mark">*</span><textarea name="short_description" rows={3} required maxLength={500} placeholder="Kurs nimani o‘rgatadi?" /></label>
              <label className="field-wide">To‘liq tavsif<textarea name="description" rows={5} placeholder="Kurs haqida batafsil ma’lumot (ixtiyoriy)" /></label>
              <label>Yo‘nalish<select name="category" defaultValue="ai-image"><option value="ai-image">AI tasvir yaratish</option><option value="ai-video">AI video</option><option value="prompting">Prompting</option><option value="content">Kontent</option></select></label>
              <label>Daraja<select name="level" defaultValue="beginner"><option value="beginner">Boshlang‘ich</option><option value="intermediate">O‘rta</option><option value="advanced">Yuqori</option></select></label>
              <label>Kurs tili<select name="language" defaultValue="uz"><option value="uz">O‘zbek</option><option value="ru">Rus</option><option value="en">Ingliz</option></select></label>
              <label>Narx (UZS)<input name="price" type="number" min="0" step="1000" defaultValue="0" /></label>
            </div>
          </AdminPanel>

          <AdminPanel className="course-create-side">
            <label className="course-cover-drop">
              <span>Muqova rasmi</span>
              <input
                name="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const next = event.target.files?.[0];
                  setCoverPreview(next ? URL.createObjectURL(next) : "");
                }}
              />
              <span className="course-cover-preview" style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}>
                {!coverPreview && <><b>Rasmni tanlang</b><small>PNG, JPG yoki WebP · 1600×900 tavsiya etiladi</small></>}
              </span>
              <small>Ixtiyoriy — muqovani keyin ham Umumiy ma’lumot bo‘limida yuklash mumkin.</small>
            </label>
            <label className="course-slug-field">
              URL manzili
              <span><small>promptusta.uz/kurslar/</small><input name="slug" required pattern="[a-z0-9-]+" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(toSlug(event.target.value)); }} placeholder="ai-image-creation" /></span>
            </label>
            <div className="course-create-note">
              <b>Keyingi qadam</b>
              <ol><li>Qoralama kurs yaratiladi</li><li>Kurs workspace ochiladi</li><li>Bo‘limlar va darslar tartib bilan qo‘shiladi</li></ol>
            </div>
          </AdminPanel>
        </div>
        <div className="course-create-footer">
          <span>Ma’lumotlar “Qoralama kursni yaratish” tugmasidan keyin saqlanadi.</span>
          <div><Link className="button button-ghost" href="/admin/courses">Bekor qilish</Link><button className="button button-primary" disabled={busy}>{busy ? "Yaratilmoqda…" : "Qoralama kursni yaratish →"}</button></div>
        </div>
      </form>
    </>
  );
}

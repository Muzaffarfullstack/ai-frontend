"use client";

import { useParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { useLocale } from "@/components/providers";
import { localizedApiError, type Course } from "@/lib/api-client";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import { AdminError, AdminLoading, AdminPanel, useAdminResource } from "@/features/admin/components/admin-kit";
import { CourseStudioSidebar } from "@/features/course-authoring/components/course-studio-sidebar";
import { CourseWorkspaceNav } from "@/features/course-authoring/components/course-workspace-nav";

export default function CourseBasicSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const resource = useAdminResource<Course>(`/admin/courses/${id}`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(success);
      await resource.reload();
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(
      () => mutateAdminResource(`/admin/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.get("title"),
          slug: data.get("slug"),
          short_description: data.get("short_description") || null,
          description: data.get("description"),
          category: data.get("category") || null,
          level: data.get("level") || null,
          language: data.get("language") || "uz",
          is_catalog_visible: data.get("is_catalog_visible") === "on",
        }),
      }),
      "Kurs ma’lumotlari saqlandi.",
    );
  }

  if (resource.loading) return <AdminLoading />;
  if (resource.error || !resource.data) {
    return <AdminError message={resource.error || t("errors.course_not_found")} retry={() => void resource.reload()} />;
  }
  const course = resource.data;

  return (
    <>
      <CourseWorkspaceNav course={course} active="general" />
      {error && <div className="form-error page-alert">{error}</div>}
      {message && <div className="success-message page-alert">{message}</div>}
      <div className="course-studio-layout">
        <form className="studio-main-column" onSubmit={save} key={`${course.id}:${course.updated_at}`}>
          <AdminPanel className="studio-form-card">
            <div className="studio-panel-heading"><div><h2>Kurs ma’lumotlari</h2><p>Talabalar va katalogda ko‘rinadigan asosiy ma’lumotlar.</p></div><span className="studio-autosave">✓ O‘zgarishlar avtomatik saqlanadi</span></div>
            <div className="admin-form-grid course-editor-form"><label>Kurs nomi<input name="title" required defaultValue={course.title}/></label><label>Slug<input name="slug" required pattern="[a-z0-9-]+" defaultValue={course.slug}/></label><label className="field-wide">Qisqa tavsif<input name="short_description" maxLength={500} defaultValue={course.short_description ?? ""}/></label><label className="field-wide">To‘liq tavsif<textarea name="description" rows={6} required defaultValue={course.description}/></label><label>Kategoriya<input name="category" defaultValue={course.category ?? ""} placeholder="AI tasvir"/></label><label>Daraja<select name="level" defaultValue={course.level ?? "beginner"}><option value="beginner">Boshlang‘ich</option><option value="intermediate">O‘rta</option><option value="advanced">Yuqori</option></select></label><label>Kurs tili<select name="language" defaultValue={course.language ?? "uz"}><option value="uz">O‘zbek</option><option value="ru">Русский</option><option value="en">English</option></select></label></div>
          </AdminPanel>
          <AdminPanel className="studio-form-card"><h2>Katalog ko‘rinishi</h2><p>Katalog va qidiruvda qanday ko‘rinishini boshqaring.</p><div className="catalog-editor"><article className="studio-catalog-card"><div><MediaImage src={course.thumbnail_url ?? ""} alt={course.cover_alt_text ?? course.title} sizes="320px" className="media-image"/></div><h3>{course.title}</h3><p>{course.short_description || "Kursning qisqa tavsifi"}</p><small>{course.section_count ?? 0} bo‘lim · {course.lesson_count ?? 0} dars</small></article><div><label>Qidiruv sarlavhasi<input defaultValue={`${course.title} — ${course.short_description ?? ""}`.slice(0, 120)}/></label><label>Katalog tavsifi<textarea rows={4} defaultValue={course.short_description ?? ""}/></label><label className="studio-switch"><input name="is_catalog_visible" type="checkbox" defaultChecked={course.is_catalog_visible ?? true}/><i/><span><b>Katalogda ko‘rsatish</b><small>Kurs katalogda va qidiruv natijalarida ko‘rsatiladi.</small></span></label></div></div></AdminPanel>
          <div className="studio-save-row"><span>Majburiy maydonlar to‘ldirilganda tayyorlik yangilanadi.</span><button className="button button-primary" disabled={busy}>{busy ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}</button></div>
        </form>
        <CourseStudioSidebar course={course}/>
      </div>
    </>
  );
}

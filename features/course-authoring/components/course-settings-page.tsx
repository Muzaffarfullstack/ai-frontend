"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/providers";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import { AdminError, AdminLoading, AdminPanel, useAdminResource } from "@/features/admin/components/admin-kit";
import { CourseWorkspaceNav } from "@/features/course-authoring/components/course-workspace-nav";
import { ApiError, localizedApiError, type Course } from "@/lib/api-client";

export default function CourseSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const resource = useAdminResource<Course>(`/admin/courses/${id}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function statusAction(action: "draft" | "archive") {
    setBusy(true); setError("");
    try { await mutateAdminResource(`/admin/courses/${id}/${action}`, { method: "POST" }); await resource.reload(); }
    catch (reason) { setError(localizedApiError(reason, t)); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setError("");
    try { await mutateAdminResource(`/admin/courses/${id}`, { method: "DELETE" }); router.replace("/admin/courses"); }
    catch (reason) {
      const message = reason instanceof ApiError ? reason.message : localizedApiError(reason, t);
      setError(message.includes("history") ? "Bu kursda buyurtma yoki o‘quvchi tarixi bor. Uni o‘chirib bo‘lmaydi — Arxiv holatida saqlang." : message);
      setConfirmDelete(false);
    } finally { setBusy(false); }
  }

  if (resource.loading) return <AdminLoading/>;
  if (resource.error || !resource.data) return <AdminError message={resource.error || "Kurs topilmadi"} retry={() => void resource.reload()}/>;
  const course = resource.data;
  return <>
    <CourseWorkspaceNav course={course} active="settings"/>
    {error && <div className="form-error page-alert">{error}</div>}
    <div className="course-settings-grid">
      <AdminPanel><span className="eyebrow">HOLAT BOSHQARUVI</span><h2>Kurs holati</h2><p className="admin-muted">Published kurs katalogda ko‘rinadi. Draft tahrirlash uchun, Arxiv esa tarixni saqlagan holda yashirish uchun ishlatiladi.</p><div className="course-status-guide"><article className={course.status === "draft" ? "active" : ""}><b>Qoralama</b><small>Tahrirlash va tayyorlash</small></article><article className={course.status === "published" ? "active" : ""}><b>Nashrda</b><small>O‘quvchilarga ko‘rinadi</small></article><article className={course.status === "archived" ? "active" : ""}><b>Arxiv</b><small>Katalogdan yashirilgan</small></article></div><div className="admin-row-actions">{course.status !== "draft" && <button disabled={busy} onClick={() => void statusAction("draft")}>Draftga qaytarish</button>}{course.status === "published" && <button disabled={busy} onClick={() => void statusAction("archive")}>Arxivlash</button>}{course.status === "draft" && <span className="admin-muted">Kurs hozir tahrirlash uchun ochiq.</span>}</div></AdminPanel>
      <AdminPanel className="course-delete-zone"><span className="eyebrow">XAVFLI HUDUD</span><h2>Kursni o‘chirish</h2><p>Kursda buyurtma yoki enrollment tarixi bo‘lmasa, Draft, Published yoki Archive holatidan qat’i nazar o‘chirish mumkin. Tarix mavjud bo‘lsa faqat arxivlashga ruxsat beriladi.</p><button className="button button-ghost danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Kursni o‘chirish</button></AdminPanel>
    </div>
    {confirmDelete && <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="delete-course-title"><header><h2 id="delete-course-title">Kursni butunlay o‘chirish</h2><button aria-label="Yopish" onClick={() => setConfirmDelete(false)}>×</button></header><div className="admin-danger-box"><h3>{course.title}</h3><p>Kurs va uning bo‘lim/darslari o‘chiriladi. Buyurtma yoki o‘quvchi tarixi mavjud bo‘lsa backend bu amalni bloklaydi.</p></div><div className="admin-drawer-actions"><button className="button button-ghost" onClick={() => setConfirmDelete(false)}>Bekor qilish</button><button className="button danger" disabled={busy} onClick={() => void remove()}>{busy ? "O‘chirilmoqda…" : "Ha, kursni o‘chirish"}</button></div></aside>}
  </>;
}

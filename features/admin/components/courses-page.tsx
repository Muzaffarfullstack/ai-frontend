"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/providers";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import {
  AdminEmpty, AdminError, AdminLoading, AdminMetrics, AdminPageHeader,
  AdminPanel, AdminStatus, AdminTable, useAdminResource,
} from "@/features/admin/components/admin-kit";
import { ApiError, type Course } from "@/lib/api-client";

function formatUpdated(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function courseActionError(reason: unknown, fallback: string) {
  const message = reason instanceof ApiError ? reason.message : fallback;
  if (message.includes("enrollment or order history")) return "Bu kursda buyurtma yoki o‘quvchi tarixi bor. O‘chirish o‘rniga Arxivlang.";
  if (message.includes("cannot transition")) return "Bu holat almashtirishga ruxsat bermaydi. Sahifani yangilab qayta urinib ko‘ring.";
  return message || fallback;
}

export default function AdminCoursesPage() {
  const { t } = useLocale();
  const resource = useAdminResource<Course[]>("/admin/courses/?limit=100");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [actionTarget, setActionTarget] = useState<Course | null>(null);
  const [actionError, setActionError] = useState("");
  const all = resource.data ?? [];
  const courses = all.filter((course) => course.title.toLowerCase().includes(query.toLowerCase()) && (!status || course.status === status));

  async function changeStatus(course: Course, action: "draft" | "archive") {
    setBusyId(course.id); setActionError("");
    try { await mutateAdminResource(`/admin/courses/${course.id}/${action}`, { method: "POST" }); await resource.reload(); }
    catch (reason) { setActionError(courseActionError(reason, t("errors.request_failed"))); }
    finally { setBusyId(null); }
  }

  async function deleteCourse() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id); setActionError("");
    try { await mutateAdminResource(`/admin/courses/${deleteTarget.id}`, { method: "DELETE" }); setDeleteTarget(null); await resource.reload(); }
    catch (reason) { setActionError(courseActionError(reason, t("errors.request_failed"))); setDeleteTarget(null); }
    finally { setBusyId(null); }
  }

  return <>
    <AdminPageHeader eyebrow="KURS BOSHQARUVI" title="Kurslar" subtitle="Kursni yarating, dasturini tuzing va nashr holatini aniq boshqaring." action={<Link className="button button-primary" href="/admin/courses/new">+ Yangi kurs</Link>}/>
    <AdminMetrics items={[
      { label: "Jami kurslar", value: String(all.length), icon: "book" },
      { label: "Nashr qilingan", value: String(all.filter((item) => item.status === "published").length), icon: "check" },
      { label: "Qoralama", value: String(all.filter((item) => item.status === "draft").length), icon: "file" },
      { label: "Arxiv", value: String(all.filter((item) => item.status === "archived").length), icon: "shield" },
    ]}/>
    <AdminPanel className="admin-toolbar-v2"><input aria-label="Kurs qidirish" placeholder="Kurs nomi yoki slug bo‘yicha qidiring" value={query} onChange={(event) => setQuery(event.target.value)}/><select aria-label="Kurs holati" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Barcha holatlar</option><option value="published">Nashrda</option><option value="draft">Qoralama</option><option value="archived">Arxiv</option></select></AdminPanel>
    {actionError && <div className="form-error page-alert"><b>Amal bajarilmadi.</b><span>{actionError}</span></div>}
    {resource.loading ? <AdminLoading/> : resource.error ? <AdminError message={resource.error} retry={() => void resource.reload()}/> : courses.length ? <AdminPanel>
      <AdminTable headings={["Kurs", "Tarkib", "Kirish qismlari", "Holat", "Yangilangan", "Amallar"]}>
        {courses.map((course) => <tr key={course.id}>
          <td><div className="course-title-cell"><span className="course-list-cover" style={course.thumbnail_url ? { backgroundImage: `url(${course.thumbnail_url})` } : undefined}>▧</span><span><b>{course.title}</b><small>{course.slug}</small></span></div></td>
          <td><b>{course.section_count ?? 0} bo‘lim · {course.lesson_count ?? 0} dars</b><small>{Math.round((course.total_duration_seconds ?? 0) / 60)} daqiqa</small></td>
          <td><small>{course.unlock_stages?.length ? course.unlock_stages.map((stage) => `${stage}/3`).join(" · ") : "—"}</small></td>
          <td><AdminStatus value={course.status}/></td><td><small>{formatUpdated(course.updated_at)}</small></td>
          <td><div className="course-list-actions"><Link className="admin-row-button" href={`/admin/courses/${course.id}/content`}>{course.status === "draft" ? "Davom etish →" : "Ochish →"}</Link><button className="course-actions-trigger" type="button" aria-label={`${course.title} amallari`} aria-expanded={actionTarget?.id === course.id} onClick={() => setActionTarget(course)}>•••</button></div></td>
        </tr>)}
      </AdminTable>
    </AdminPanel> : <AdminPanel><AdminEmpty icon="book" title={all.length ? "Mos kurs topilmadi" : "Hali kurs yaratilmagan"} body={all.length ? "Qidiruv yoki holat filtrini o‘zgartiring." : "Avval kurs asoslarini yarating; bo‘lim va darslar keyin workspace ichida qo‘shiladi."} action={!all.length ? <Link className="button button-primary" href="/admin/courses/new">Birinchi kursni yaratish</Link> : undefined}/></AdminPanel>}
    {actionTarget && <><button className="course-actions-backdrop" type="button" aria-label="Amallar menyusini yopish" onClick={() => setActionTarget(null)}/><aside className="course-actions-menu" role="dialog" aria-modal="true" aria-labelledby="course-actions-title"><header><div><span className="eyebrow">KURS AMALLARI</span><h2 id="course-actions-title">{actionTarget.title}</h2></div><button type="button" aria-label="Yopish" onClick={() => setActionTarget(null)}>×</button></header><nav><Link href={`/admin/courses/${actionTarget.id}/edit`} onClick={() => setActionTarget(null)}>Umumiy ma’lumot</Link><Link href={`/admin/courses/${actionTarget.id}/publish`} onClick={() => setActionTarget(null)}>Nashrni tekshirish</Link><Link href={`/admin/courses/${actionTarget.id}/settings`} onClick={() => setActionTarget(null)}>Sozlamalar</Link>{actionTarget.status !== "draft" && <button disabled={busyId === actionTarget.id} onClick={() => { const target = actionTarget; setActionTarget(null); void changeStatus(target, "draft"); }}>Draftga qaytarish</button>}{actionTarget.status === "published" && <button disabled={busyId === actionTarget.id} onClick={() => { const target = actionTarget; setActionTarget(null); void changeStatus(target, "archive"); }}>Arxivlash</button>}<button className="danger" disabled={busyId === actionTarget.id} onClick={() => { setDeleteTarget(actionTarget); setActionTarget(null); }}>Kursni o‘chirish</button></nav></aside></>}
    {deleteTarget && <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="course-delete-title"><header><div><span className="eyebrow">KURSNI O‘CHIRISH</span><h2 id="course-delete-title">{deleteTarget.title}</h2></div><button aria-label="Yopish" onClick={() => setDeleteTarget(null)}>×</button></header><div className="admin-danger-box"><h3>Bu amalni ortga qaytarib bo‘lmaydi</h3><p>Kurs, bo‘limlar va darslar o‘chiriladi. Agar kursda buyurtma yoki o‘quvchi tarixi bo‘lsa, xavfsizlik uchun o‘chirish bloklanadi va kursni Arxivlash kerak bo‘ladi.</p></div><div className="admin-drawer-actions"><button className="button button-ghost" onClick={() => setDeleteTarget(null)}>Bekor qilish</button><button className="button danger" disabled={busyId === deleteTarget.id} onClick={() => void deleteCourse()}>{busyId === deleteTarget.id ? "O‘chirilmoqda…" : "Ha, butunlay o‘chirish"}</button></div></aside>}
  </>;
}

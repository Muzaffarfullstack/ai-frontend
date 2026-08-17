"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { useLocale } from "@/components/providers";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import { AdminError, AdminLoading, AdminPanel } from "@/features/admin/components/admin-kit";
import { loadCourseEditor } from "@/features/course-authoring/api/course-authoring.api";
import { CourseStudioSidebar } from "./course-studio-sidebar";
import { CourseWorkspaceNav } from "./course-workspace-nav";
import { localizedApiError, type Course, type CourseSection, type Lesson, type VideoAsset } from "@/lib/api-client";

export default function CourseMediaPage() {
  const { id } = useParams<{ id: string }>(); const { t } = useLocale();
  const [course, setCourse] = useState<Course | null>(null); const [sections, setSections] = useState<CourseSection[]>([]); const [lessons, setLessons] = useState<Lesson[]>([]); const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = useCallback(async () => { try { const data = await loadCourseEditor(id); setCourse(data.course); setSections(data.sections); setLessons(data.lessons); setVideos(data.videos); setError(""); } catch (reason) { setError(localizedApiError(reason, t)); } finally { setLoading(false); } }, [id, t]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);
  async function run(task: () => Promise<unknown>, success: string) { setBusy(true); setError(""); setMessage(""); try { await task(); setMessage(success); await load(); } catch (reason) { setError(localizedApiError(reason, t)); } finally { setBusy(false); } }
  async function saveCover(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const file = data.get("thumbnail"); await run(async () => { if (file instanceof File && file.size) { const upload = new FormData(); upload.set("thumbnail", file); await mutateAdminResource(`/admin/courses/${id}/thumbnail`, { method: "POST", body: upload }); } await mutateAdminResource(`/admin/courses/${id}`, { method: "PATCH", body: JSON.stringify({ cover_alt_text: data.get("cover_alt_text") || null }) }); }, "Muqova ma’lumotlari saqlandi."); }
  async function savePromo(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await run(() => mutateAdminResource(`/admin/courses/${id}`, { method: "PATCH", body: JSON.stringify({ promo_video_url: data.get("promo_video_url") || null }) }), "Promo video saqlandi."); }
  if (loading || !course) return error ? <AdminError message={error} retry={() => void load()}/> : <AdminLoading/>;
  return <><CourseWorkspaceNav course={course} active="media"/>{error && <div className="form-error page-alert">{error}</div>}{message && <div className="success-message page-alert">{message}</div>}
    <div className="course-studio-layout"><main className="studio-main-column"><div className="course-media-top">
      <AdminPanel className="studio-form-card"><h2>Kurs muqovasi</h2><p>Katalog va kurs sahifasi uchun 16:9 rasm.</p><div className="studio-cover-preview"><MediaImage src={course.thumbnail_url ?? ""} alt={course.cover_alt_text ?? course.title} sizes="620px" className="media-image"/><span>1920 × 1080</span></div><form className="studio-media-form" onSubmit={saveCover}><input name="thumbnail" type="file" accept="image/jpeg,image/png,image/webp"/><label>Alt matn<input name="cover_alt_text" defaultValue={course.cover_alt_text ?? ""} placeholder="Muqova tavsifini kiriting"/></label><button className="button button-primary" disabled={busy}>Muqovani saqlash</button></form></AdminPanel>
      <AdminPanel className="studio-form-card"><h2>Promo video</h2><p>Katalog preview uchun ixtiyoriy qisqa video.</p><div className="studio-promo-preview">{course.promo_video_url ? <video src={course.promo_video_url} controls preload="metadata"/> : <><b>▶</b><span>Promo video biriktirilmagan</span></>}</div><form className="studio-media-form" onSubmit={savePromo}><label>Video URL<input name="promo_video_url" type="url" defaultValue={course.promo_video_url ?? ""} placeholder="https://…/course-intro.mp4"/></label><button className="button button-primary" disabled={busy}>Promo videoni saqlash</button></form></AdminPanel>
    </div><AdminPanel className="studio-form-card"><div className="studio-panel-heading"><div><h2>Dars medialari</h2><p>Kurs → bo‘lim → dars bo‘yicha biriktirilgan fayllar.</p></div><Link className="button button-ghost" href={`/admin/courses/${id}/content`}>Dasturga o‘tish</Link></div><div className="lesson-media-table"><div className="head"><span>Dars</span><span>Bo‘lim</span><span>Media</span><span>Davomiylik</span><span>Holat</span><span>Amal</span></div>{lessons.map((lesson) => { const section = sections.find((item) => item.id === lesson.section_id); const video = videos.find((item) => item.lesson_id === lesson.id); return <div className="row" key={lesson.id}><b>{lesson.title}</b><span>{section?.position.toString().padStart(2, "0")} {section?.title}</span><span>{lesson.lesson_type === "video" ? (video?.asset_id ? `${video.asset_id.slice(0, 14)}…` : "Video biriktirilmagan") : lesson.lesson_type}</span><span>{lesson.duration_seconds ? `${Math.floor(lesson.duration_seconds / 60)}:${String(lesson.duration_seconds % 60).padStart(2, "0")}` : "—"}</span><em className={video?.status === "ready" || lesson.lesson_type !== "video" ? "ready" : video?.status === "processing" ? "processing" : "missing"}>{lesson.lesson_type !== "video" ? "Tayyor" : video?.status === "ready" ? "Tayyor" : video?.status === "processing" ? "Jarayonda" : "Yetishmaydi"}</em><Link href={`/admin/courses/${id}/content#lesson-${lesson.id}`}>{video ? "Boshqarish" : "Video qo‘shish"}</Link></div>; })}</div></AdminPanel></main><CourseStudioSidebar course={course}/></div>
  </>;
}

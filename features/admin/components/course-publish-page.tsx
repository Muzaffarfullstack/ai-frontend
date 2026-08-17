"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, localizedApiError, type Course, type CourseReadiness, type CourseSection, type Lesson, type VideoAsset } from "@/lib/api-client";
import { useLocale } from "@/components/providers";
import { loadCourseEditor } from "@/features/course-authoring/api/course-authoring.api";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import { AdminError, AdminLoading, AdminPageHeader, AdminPanel, AdminStatus } from "@/features/admin/components/admin-kit";
import { CourseWorkspaceNav } from "@/features/course-authoring/components/course-workspace-nav";

function publishError(reason: unknown, fallback: string) {
  if (!(reason instanceof ApiError)) return fallback;
  const translations: Array<[string, string]> = [
    ["at least one section is required", "Kamida bitta bo‘lim qo‘shilishi kerak."],
    ["at least one published lesson is required", "Kamida bitta dars Publish qilinishi kerak."],
    ["has no video asset", "Published video darsga video yuklanmagan."],
    ["is not ready", "Published video hali tayyor holatga kelmagan."],
    ["title is required", "Kurs nomi kiritilishi kerak."],
    ["slug is required", "Kurs slug‘i kiritilishi kerak."],
    ["description is required", "Kurs tavsifi kiritilishi kerak."],
  ];
  const matched = translations.find(([source]) => reason.message.includes(source));
  return matched?.[1] ?? reason.message ?? fallback;
}

export default function CoursePublishPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readiness, setReadiness] = useState<CourseReadiness | null>(null);

  const load = useCallback(async () => {
    try {
      const [data, readyData] = await Promise.all([loadCourseEditor(id), mutateAdminResource<CourseReadiness>(`/admin/courses/${id}/readiness`, { method: "GET" })]);
      setCourse(data.course); setSections(data.sections); setLessons(data.lessons); setVideos(data.videos);
      setReadiness(readyData);
    } catch (reason) { setError(localizedApiError(reason, t)); }
    finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  const checks = useMemo(() => {
    if (!course) return [];
    const published = lessons.filter((lesson) => lesson.status === "published");
    const videoProblems = published.filter((lesson) => {
      if (lesson.lesson_type !== "video") return false;
      const video = videos.find((item) => item.lesson_id === lesson.id);
      return !video || video.status !== "ready" || !video.playback_id;
    });
    return [
      { ok: Boolean(course.title.trim() && course.slug.trim() && course.description?.trim()), label: "Kurs nomi, slug va tavsifi to‘ldirilgan", href: `/admin/courses/${id}/edit` },
      { ok: sections.length > 0, label: "Kamida bitta bo‘lim qo‘shilgan", href: `/admin/courses/${id}/content` },
      { ok: published.length > 0, label: published.length ? "Kamida bitta dars Publish qilingan" : lessons.length && lessons.every((lesson) => lesson.lesson_type === "video") ? "Darslar draft: video darsni Publish qilish uchun Mux video Ready bo‘lishi kerak" : "Kamida bitta darsni Publish qiling", href: `/admin/courses/${id}/content` },
      { ok: videoProblems.length === 0, label: videoProblems.length ? `${videoProblems.length} ta video dars hali Ready emas` : "Published video darslar tayyor", href: `/admin/courses/${id}/content` },
    ];
  }, [course, id, lessons, sections.length, videos]);
  const visibleChecks = readiness ? readiness.issues.map((issue) => ({ ok: false, label: issue.message, href: issue.route })) : checks;
  const ready = readiness?.ready ?? checks.every((item) => item.ok);

  async function change(action: "publish" | "draft" | "archive") {
    setBusy(true); setError("");
    try { await mutateAdminResource(`/admin/courses/${id}/${action}`, { method: "POST" }); await load(); }
    catch (reason) { setError(publishError(reason, localizedApiError(reason, t))); }
    finally { setBusy(false); }
  }

  if (loading) return <AdminLoading/>;
  if (!course) return <AdminError message={error || t("errors.course_not_found")} retry={() => void load()}/>;
  return <>
    <CourseWorkspaceNav course={course} active="publish" />
    <AdminPageHeader eyebrow="COURSE STUDIO · 3 / 3" title="Tekshirish va nashr" subtitle="Kursni foydalanuvchilarga ko‘rsatishdan avval yakuniy holatini tekshiring." action={<Link className="button button-ghost" href={`/admin/courses/${id}/content`}>← Kontent</Link>}/>
    {error && <div className="form-error page-alert"><b>Nashr qilib bo‘lmadi.</b><span>{error}</span></div>}
    <AdminPanel className="publish-readiness"><div className="admin-panel-title"><h2>Nashrga tayyorlik</h2><strong>{readiness?.score ?? 0}%</strong></div><p className="admin-muted">Yetishmayotgan bandni bosib, kerakli qismga o‘ting.</p><div>{ready ? <div className="ready"><span>✓</span><b>Barcha majburiy tekshiruvlar tayyor</b><small>Nashr qilish mumkin</small></div> : visibleChecks.map((check) => <Link className={check.ok ? "ready" : "missing"} href={check.href} key={check.label}><span>{check.ok ? "✓" : "!"}</span><b>{check.label}</b><small>{check.ok ? "Tayyor" : "Tuzatish kerak"}</small></Link>)}</div></AdminPanel>
    <div className="admin-publish-grid"><AdminPanel><h2>{course.title}</h2><dl className="admin-details"><div><dt>Slug</dt><dd>{course.slug}</dd></div><div><dt>Narx</dt><dd>{course.price} {course.currency}</dd></div><div><dt>Joriy holat</dt><dd><AdminStatus value={course.status}/></dd></div></dl></AdminPanel>
    <AdminPanel><h2>Nashr boshqaruvi</h2><p className="admin-muted">Published kurs student katalogida ko‘rinadi. Draft tahrirlash, Archive esa tarixiy saqlash uchun.</p><div className="admin-publish-actions"><button className="button button-primary" disabled={busy || course.status === "published" || !ready} onClick={() => void change("publish")}>Publish</button><button className="button button-ghost" disabled={busy || course.status === "draft"} onClick={() => void change("draft")}>Draft</button><button className="button button-ghost danger" disabled={busy || course.status === "archived"} onClick={() => void change("archive")}>Archive</button></div>{!ready && <small className="publish-hint">Publish qilishdan oldin yuqoridagi qizil bandlarni to‘g‘rilang.</small>}</AdminPanel></div>
  </>;
}

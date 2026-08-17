"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, type Course, type CourseSection, type Lesson, type VideoAsset } from "@/lib/api-client";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminMetrics,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  AdminTable,
  useAdminResource,
} from "@/features/admin/components/admin-kit";

export default function AdminVideosPage() {
  const resource = useAdminResource<VideoAsset[]>("/admin/videos?limit=100");
  const lessons = useAdminResource<Lesson[]>("/admin/lessons?limit=100");
  const courses = useAdminResource<Course[]>("/admin/courses/?limit=100");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const rows = resource.data ?? [];
  const lessonById = useMemo(() => new Map((lessons.data ?? []).map((lesson) => [lesson.id, lesson])), [lessons.data]);
  const courseById = useMemo(() => new Map((courses.data ?? []).map((course) => [course.id, course])), [courses.data]);
  const [sectionCache, setSectionCache] = useState<Record<string, CourseSection>>({});

  const visibleRows = rows.filter((video) => {
    if (status && video.status !== status) return false;
    if (!search.trim()) return true;
    const lesson = lessonById.get(video.lesson_id);
    const section = lesson ? sectionCache[lesson.section_id] : undefined;
    const course = section ? courseById.get(section.course_id) : undefined;
    return `${course?.title ?? ""} ${section?.title ?? ""} ${lesson?.title ?? ""}`
      .toLowerCase().includes(search.toLowerCase());
  });

  async function retryVideo(video: VideoAsset) {
    setActionError("");
    try {
      await apiRequest(`/admin/lessons/${video.lesson_id}/videos/retry`, { method: "POST" });
      await resource.reload();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Videoni qayta ishlashni boshlashda xato yuz berdi.");
    }
  }

  useEffect(() => {
    const sectionIds = [...new Set((lessons.data ?? []).map((lesson) => lesson.section_id))];
    if (!sectionIds.length) return;
    let active = true;
    void Promise.all(sectionIds.map(async (sectionId) => {
      try {
        return await apiRequest<CourseSection>(`/admin/sections/${sectionId}`);
      } catch {
        return null;
      }
    })).then((resolved) => {
      if (!active) return;
      setSectionCache(Object.fromEntries(resolved.filter((section): section is CourseSection => Boolean(section)).map((section) => [section.id, section])));
    });
    return () => { active = false; };
  }, [lessons.data]);

  return (
    <>
      <AdminPageHeader
        eyebrow="VIDEO OPERATIONS"
        title="Dars videolari"
        subtitle="Har bir videoning qaysi kurs va darsga tegishli ekanini hamda processing holatini kuzating."
        action={<Link className="button button-primary" href="/admin/courses">+ Darsga video qo‘shish</Link>}
      />
      <AdminMetrics items={[
        { label: "Jami video", value: String(rows.length), icon: "video" },
        { label: "Processing", value: String(rows.filter((item) => ["waiting_upload", "processing"].includes(item.status)).length), icon: "clock", tone: "warning" },
        { label: "Ready", value: String(rows.filter((item) => item.status === "ready").length), icon: "check" },
        { label: "Xatolik", value: String(rows.filter((item) => item.status === "failed").length), icon: "shield", tone: "danger" },
      ]} />
      <AdminPanel className="admin-toolbar-v2 video-toolbar">
        <div><b>Video ro‘yxati</b><small>Kurs → bo‘lim → dars bo‘yicha ko‘rsatiladi.</small></div>
        <input aria-label="Video qidirish" placeholder="Kurs yoki darsni qidiring" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Video holati" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Barcha holatlar</option>
          <option value="waiting_upload">Upload kutilmoqda</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Xatolik</option>
        </select>
        <button type="button" onClick={() => void resource.reload()}>Yangilash</button>
      </AdminPanel>
      {actionError && <div className="admin-error"><p>{actionError}</p></div>}
      {resource.loading ? (
        <AdminLoading />
      ) : resource.error ? (
        <AdminError message={resource.error} retry={() => void resource.reload()} />
      ) : visibleRows.length ? (
        <AdminPanel>
          <AdminTable headings={["Kurs / bo‘lim", "Dars", "Holat", "Davomiyligi", "Amallar"]} minWidth={860}>
            {visibleRows.map((video) => {
              const lesson = lessonById.get(video.lesson_id);
              const section = lesson ? sectionCache[lesson.section_id] : undefined;
              const course = section ? courseById.get(section.course_id) : undefined;
              return (
                <tr key={video.id}>
                  <td><b>{course?.title ?? "Kurs aniqlanmoqda…"}</b><small>{section?.title ?? lesson?.section_id.slice(0, 8) ?? "—"}</small></td>
                  <td><b>{lesson?.title ?? video.lesson_id.slice(0, 8)}</b><small>{lesson?.lesson_type ?? video.provider}</small></td>
                  <td><AdminStatus value={video.status} />{video.error_message && <small>{video.error_message}</small>}</td>
                  <td>{video.duration_seconds ? `${Math.ceil(video.duration_seconds / 60)} daqiqa` : "—"}</td>
                  <td><div className="admin-row-actions">{video.status === "failed" && <button className="admin-row-button danger" type="button" onClick={() => void retryVideo(video)}>Qayta urinish</button>}{course ? <Link className="admin-row-button" href={`/admin/courses/${course.id}/content#lesson-${video.lesson_id}`}>Darsni ochish</Link> : "—"}</div></td>
                </tr>
              );
            })}
          </AdminTable>
        </AdminPanel>
      ) : (
        <AdminPanel><AdminEmpty icon="video" title={rows.length ? "Bu holatda video yo‘q" : "Video hali yuklanmagan"} body="Kurs ichidagi video darsdan fayl yuklanganda u shu ro‘yxatda paydo bo‘ladi." action={<Link className="button button-ghost" href="/admin/courses">Kurslarga o‘tish</Link>} /></AdminPanel>
      )}
      <AdminPanel className="admin-process video-process-guide">
        <h2>Video tayyor bo‘lish jarayoni</h2>
        <div><span>1. Upload</span><i>→</i><span>2. Processing</span><i>→</i><span>3. Ready</span><i>→</i><span>4. Playback</span></div>
      </AdminPanel>
    </>
  );
}

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { type DragEvent, type FormEvent, useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers";
import {
  ApiError,
  localizedApiError,
  type Course,
  type CourseSection,
  type Lesson,
  type VideoAsset,
} from "@/lib/api-client";
import {
  authoringRequest as apiRequest,
  loadCourseEditor,
  reorderLessons,
  reorderSections,
  uploadLessonVideo,
} from "@/features/course-authoring/api/course-authoring.api";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
} from "@/features/admin/components/admin-kit";
import { CourseWorkspaceNav } from "@/features/course-authoring/components/course-workspace-nav";

function editorError(reason: unknown, fallback: string) {
  if (!(reason instanceof ApiError)) {
    if (reason instanceof Error && reason.message.toLowerCase().includes("failed to fetch")) {
      return "Backend bilan aloqa uzildi. Server ishlayotganini tekshirib, qayta urinib ko‘ring.";
    }
    return reason instanceof Error ? reason.message : fallback;
  }
  const translations: Array<[string, string]> = [
    ["video lesson requires a video asset", "Video darsni nashr qilishdan oldin video yuklang."],
    ["video lesson requires a ready playable video", "Video hali tayyor emas. Processing tugashini kuting."],
    ["lesson title and slug are required", "Dars nomi va slug‘i kiritilishi kerak."],
    ["course slug already exists", "Bu slug boshqa kursda ishlatilgan."],
    ["a non-empty course section cannot be deleted", "Ichida darslar bor bo‘limni o‘chirib bo‘lmaydi."],
    ["only a draft lesson without history can be deleted", "Faqat draft darsni o‘chirish mumkin."],
  ];
  const matched = translations.find(([source]) => reason.message.includes(source));
  return matched?.[1] ?? reason.message ?? fallback;
}

function moveBefore(ids: string[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return ids;
  const next = ids.filter((item) => item !== sourceId);
  const targetIndex = next.indexOf(targetId);
  next.splice(targetIndex < 0 ? next.length : targetIndex, 0, sourceId);
  return next;
}

export default function CourseEditorPage() {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [uploadingLesson, setUploadingLesson] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<{ id: string; sectionId: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await loadCourseEditor(id);
      setCourse(data.course);
      setSections([...data.sections].sort((a, b) => a.position - b.position));
      setLessons(data.lessons);
      setVideos(data.videos);
      setError("");
    } catch (reason) {
      setError(localizedApiError(reason, t));
    }
  }, [id, t]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function run(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(success);
      await load();
      return true;
    } catch (reason) {
      setError(editorError(reason, localizedApiError(reason, t)));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function lessonsFor(sectionId: string) {
    return lessons
      .filter((lesson) => lesson.section_id === sectionId)
      .sort((a, b) => a.position - b.position);
  }

  async function dropSection(event: DragEvent, targetId: string) {
    event.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;
    const ids = moveBefore(sections.map((section) => section.id), draggedSection, targetId);
    setDraggedSection(null);
    await run(() => reorderSections(id, ids), "Bo‘limlar tartibi saqlandi.");
  }

  async function dropLesson(event: DragEvent, sectionId: string, targetId: string) {
    event.preventDefault();
    if (!draggedLesson || draggedLesson.sectionId !== sectionId || draggedLesson.id === targetId) return;
    const ids = moveBefore(lessonsFor(sectionId).map((lesson) => lesson.id), draggedLesson.id, targetId);
    setDraggedLesson(null);
    await run(() => reorderLessons(sectionId, ids), "Darslar tartibi saqlandi.");
  }

  async function addSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const position = Math.max(0, ...sections.map((section) => section.position)) + 1;
    const saved = await run(
      () => apiRequest(`/admin/courses/${id}/sections`, {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description") || null,
          translations: {},
          position,
          unlock_stage: Number(data.get("unlock_stage") || 1),
          is_published: data.get("is_closed") !== "on",
        }),
      }),
      `${sections.length + 1}-bo‘lim qo‘shildi.`,
    );
    if (saved) {
      form.reset();
      setAddingSection(false);
    }
  }

  async function updateSection(event: FormEvent<HTMLFormElement>, section: CourseSection) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const saved = await run(
      () => apiRequest(`/admin/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description") || null,
          unlock_stage: Number(data.get("unlock_stage") || 1),
          is_published: data.get("is_published") === "on",
        }),
      }),
      "Bo‘lim ma’lumotlari yangilandi.",
    );
    if (saved) setEditingSection(null);
  }

  async function deleteSection(section: CourseSection) {
    if (lessonsFor(section.id).length) {
      setError("Avval bo‘lim ichidagi darslarni o‘chiring.");
      return;
    }
    if (!window.confirm(`“${section.title}” bo‘limini o‘chirasizmi?`)) return;
    await run(
      () => apiRequest(`/admin/sections/${section.id}`, { method: "DELETE" }),
      "Bo‘lim o‘chirildi.",
    );
  }

  async function addLesson(event: FormEvent<HTMLFormElement>, section: CourseSection) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const sectionLessons = lessonsFor(section.id);
    const position = Math.max(0, ...sectionLessons.map((lesson) => lesson.position)) + 1;
    const saved = await run(
      () => apiRequest(`/admin/sections/${section.id}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          slug: data.get("slug"),
          description: data.get("description") || null,
          translations: {},
          lesson_type: data.get("lesson_type"),
          position,
          status: "draft",
          is_preview: data.get("is_preview") === "on",
          duration_seconds: Number(data.get("duration_minutes") || 0) * 60 || null,
          content_payload: {},
        }),
      }),
      `${sections.findIndex((item) => item.id === section.id) + 1}-bo‘limga ${sectionLessons.length + 1}-dars qo‘shildi.`,
    );
    if (saved) {
      form.reset();
      setAddingLessonTo(null);
    }
  }

  async function updateLesson(event: FormEvent<HTMLFormElement>, lesson: Lesson) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const saved = await run(
      () => apiRequest(`/admin/lessons/${lesson.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.get("title"),
          slug: data.get("slug"),
          description: data.get("description") || null,
          lesson_type: data.get("lesson_type"),
          is_preview: data.get("is_preview") === "on",
          duration_seconds: Number(data.get("duration_minutes") || 0) * 60 || null,
        }),
      }),
      "Dars yangilandi.",
    );
    if (saved) setEditingLesson(null);
  }

  async function deleteLesson(lesson: Lesson) {
    if (lesson.status !== "draft") {
      setError("Faqat draft darsni o‘chirish mumkin.");
      return;
    }
    if (!window.confirm(`“${lesson.title}” darsini o‘chirasizmi?`)) return;
    const video = videos.find((item) => item.lesson_id === lesson.id);
    await run(async () => {
      if (video) await apiRequest(`/admin/videos/${video.id}`, { method: "DELETE" });
      await apiRequest(`/admin/lessons/${lesson.id}`, { method: "DELETE" });
    }, "Dars o‘chirildi.");
  }

  async function uploadVideo(event: FormEvent<HTMLFormElement>, lesson: Lesson) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("video");
    if (!(file instanceof File) || !file.size) {
      setError("Video faylni tanlang.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await uploadLessonVideo(lesson.id, file);
      setMessage("Video yuklandi. Processing tugagach holati Ready bo‘ladi.");
      form.reset();
      setUploadingLesson(null);
      await load();
    } catch (reason) {
      setError(editorError(reason, localizedApiError(reason, t)));
    } finally {
      setBusy(false);
    }
  }

  if (!course && !error) return <AdminLoading />;
  if (!course) return <AdminError message={error || t("errors.course_not_found")} retry={() => void load()} />;
  const lessonSection = sections.find((section) => section.id === addingLessonTo) ?? null;

  return (
    <>
      <CourseWorkspaceNav course={course} active="curriculum" />
      <AdminPageHeader
        eyebrow="KURS DASTURI"
        title="Bo‘limlar va darslar"
        subtitle={`${sections.length} bo‘lim · ${lessons.length} dars. Bo‘limlar qo‘shilgan tartibda o‘quvchiga ko‘rinadi.`}
        action={<Link className="button button-primary" href={`/admin/courses/${id}/publish`}>Keyingi: nashr →</Link>}
      />
      {error && <div className="form-error page-alert"><b>Amal bajarilmadi.</b><span>{error}</span></div>}
      {searchParams.get("notice") === "cover-upload-failed" && <div className="form-error page-alert"><b>Draft kurs yaratildi.</b><span>Muqova yuklanmadi. “Umumiy ma’lumot” bo‘limidan qayta yuklang.</span></div>}
      {message && <div className="success-message page-alert">{message}</div>}

      <div className="content-builder-toolbar">
        <div>
          <b>Kurs tarkibi</b>
          <small>Avval bo‘lim yarating, keyin darsni aynan shu bo‘lim ichiga qo‘shing.</small>
        </div>
        <button className="button button-primary" type="button" disabled={busy} onClick={() => setAddingSection((value) => !value)}>
          + {sections.length + 1}-bo‘lim qo‘shish
        </button>
      </div>

      <section className="course-curriculum structured-curriculum">
        {sections.length ? sections.map((section, sectionIndex) => {
          const sectionLessons = lessonsFor(section.id);
          const sectionNumber = sectionIndex + 1;
          return (
            <article className="curriculum-section" key={section.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => void dropSection(event, section.id)}>
              <header>
                <span className="content-drag-handle" draggable onDragStart={() => setDraggedSection(section.id)} title="Bo‘lim tartibini o‘zgartirish">{String(sectionNumber).padStart(2, "0")}</span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description || `${section.unlock_stage}-to‘lov bosqichida ochiladi`}</p>
                </div>
                <small>{sectionLessons.length} dars</small>
                <div className="curriculum-section-actions">
                  <button type="button" onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}>Tahrirlash</button>
                  <button type="button" className="danger" disabled={Boolean(sectionLessons.length) || busy} title={sectionLessons.length ? "Avval darslarni o‘chiring" : "Bo‘limni o‘chirish"} onClick={() => void deleteSection(section)}>O‘chirish</button>
                  <button type="button" className="positive" disabled={busy} onClick={() => setAddingLessonTo(addingLessonTo === section.id ? null : section.id)}>+ Dars</button>
                </div>
              </header>

              {editingSection === section.id && (
                <form className="admin-form-grid curriculum-edit-form" onSubmit={(event) => void updateSection(event, section)}>
                  <label>Bo‘lim nomi<input name="title" required defaultValue={section.title} /></label>
                  <label>Ochilish bosqichi<select name="unlock_stage" defaultValue={section.unlock_stage}><option value="1">1-bosqich</option><option value="2">2-bosqich</option><option value="3">3-bosqich</option></select></label>
                  <label className="field-wide">Izoh<textarea name="description" rows={3} defaultValue={section.description ?? ""} /></label>
                  <label><input name="is_published" type="checkbox" defaultChecked={section.is_published} /> Bo‘limni o‘quvchiga ko‘rsatish</label>
                  <div className="field-wide inline-form-actions"><button type="button" className="button button-ghost" onClick={() => setEditingSection(null)}>Bekor qilish</button><button className="button button-primary" disabled={busy}>Saqlash</button></div>
                </form>
              )}

              <div className="lesson-list">
                {sectionLessons.length ? sectionLessons.map((lesson, lessonIndex) => {
                  const video = videos.find((item) => item.lesson_id === lesson.id);
                  return (
                    <div className="lesson-editor-row" id={`lesson-${lesson.id}`} key={lesson.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => void dropLesson(event, section.id, lesson.id)}>
                      <div className="admin-lesson">
                        <span className="content-drag-handle" draggable onDragStart={() => setDraggedLesson({ id: lesson.id, sectionId: section.id })} title="Dars tartibini o‘zgartirish">{String(lessonIndex + 1).padStart(2, "0")}</span>
                        <div><b>{lesson.title}</b><small>{lesson.lesson_type}</small></div>
                        <AdminStatus value={video?.status ?? lesson.status} />
                        <div className="lesson-row-actions">
                          <button type="button" onClick={() => setEditingLesson(editingLesson === lesson.id ? null : lesson.id)}>Tahrirlash</button>
                          {lesson.lesson_type === "video" && !video && <button type="button" className="positive" onClick={() => setUploadingLesson(uploadingLesson === lesson.id ? null : lesson.id)}>Video</button>}
                          {lesson.status === "draft" && <button type="button" className="positive" disabled={busy} onClick={() => void run(() => apiRequest(`/admin/lessons/${lesson.id}/publish`, { method: "POST" }), "Dars nashr qilindi.")}>Nashr qilish</button>}
                          {lesson.status === "published" && <button type="button" disabled={busy} onClick={() => void run(() => apiRequest(`/admin/lessons/${lesson.id}/archive`, { method: "POST" }), "Dars arxivlandi.")}>Arxivlash</button>}
                          {lesson.status !== "draft" && <button type="button" disabled={busy} onClick={() => void run(() => apiRequest(`/admin/lessons/${lesson.id}/draft`, { method: "POST" }), "Dars qoralamaga qaytarildi.")}>Draftga qaytarish</button>}
                          <button type="button" className="danger" disabled={busy || lesson.status !== "draft"} title={lesson.status !== "draft" ? "Faqat draft darsni o‘chirish mumkin" : "Darsni o‘chirish"} onClick={() => void deleteLesson(lesson)}>O‘chirish</button>
                        </div>
                      </div>
                      {editingLesson === lesson.id && (
                        <form className="admin-form-grid curriculum-edit-form lesson-edit-form" onSubmit={(event) => void updateLesson(event, lesson)}>
                          <label>Dars nomi<input name="title" required defaultValue={lesson.title} /></label>
                          <label>Slug<input name="slug" required pattern="[a-z0-9-]+" defaultValue={lesson.slug} /></label>
                          <label>Dars turi<select name="lesson_type" defaultValue={lesson.lesson_type} disabled={Boolean(video)}><option value="video">Video</option><option value="text">Text</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option></select></label>
                          <label>Davomiylik (daqiqa)<input name="duration_minutes" type="number" min="0" defaultValue={lesson.duration_seconds ? Math.ceil(lesson.duration_seconds / 60) : 0} /></label>
                          <label><input name="is_preview" type="checkbox" defaultChecked={lesson.is_preview} /> Bepul preview</label>
                          <label className="field-wide">Izoh<textarea name="description" rows={3} defaultValue={lesson.description ?? ""} /></label>
                          <div className="field-wide inline-form-actions"><button type="button" className="button button-ghost" onClick={() => setEditingLesson(null)}>Bekor qilish</button><button className="button button-primary" disabled={busy}>Saqlash</button></div>
                        </form>
                      )}
                      {uploadingLesson === lesson.id && (
                        <form className="video-inline-upload" onSubmit={(event) => void uploadVideo(event, lesson)}>
                          <div><b>{lesson.title} uchun video</b><small>MP4 yoki MOV faylni tanlang.</small></div>
                          <input name="video" type="file" accept="video/*" required />
                          <button className="button button-primary" disabled={busy}>Mux’ga yuklash</button>
                          <button className="button button-ghost" type="button" onClick={() => setUploadingLesson(null)}>Bekor qilish</button>
                        </form>
                      )}
                    </div>
                  );
                }) : (
                  <div className="curriculum-empty-row">Bu bo‘lim hali bo‘sh. “+ Dars” orqali birinchi darsni qo‘shing.</div>
                )}
              </div>
            </article>
          );
        }) : (
          <AdminPanel>
            <AdminEmpty
              icon="book"
              title="Birinchi bo‘limni yarating"
              body="Darslar alohida bo‘limlar ichida tartib bilan joylashadi."
              action={<button className="button button-primary" type="button" onClick={() => setAddingSection(true)}>+ 1-bo‘lim qo‘shish</button>}
            />
          </AdminPanel>
        )}
      </section>

      {sections.length > 0 && (
        <div className="content-builder-footer">
          <button className="button button-ghost" type="button" onClick={() => setAddingSection(true)}>+ {sections.length + 1}-bo‘lim qo‘shish</button>
          <Link className="button button-primary" href={`/admin/courses/${id}/publish`}>Nashr tekshiruviga o‘tish →</Link>
        </div>
      )}

      {addingSection && <>
        <button className="admin-drawer-backdrop" type="button" aria-label="Bo‘lim oynasini yopish" onClick={() => setAddingSection(false)} />
        <aside className="admin-drawer course-authoring-drawer" role="dialog" aria-modal="true" aria-labelledby="new-section-title">
          <header><div><span className="eyebrow">YANGI BO‘LIM</span><h2 id="new-section-title">{sections.length + 1}-bo‘limni qo‘shish</h2><small>Darslar shu bo‘lim ichiga joylanadi.</small></div><button type="button" aria-label="Yopish" onClick={() => setAddingSection(false)}>×</button></header>
          <form className="admin-drawer-form" onSubmit={addSection}>
            <label>Bo‘lim nomi <span className="required-mark">*</span><input name="title" required autoFocus /></label>
            <small className="field-help">O‘quvchiga ko‘rinadigan nom.</small>
            <label>Tavsif<textarea name="description" rows={4} /></label>
            <label>Qachon ochiladi? <span className="required-mark">*</span><select name="unlock_stage" defaultValue="1"><option value="1">1-qism to‘langach</option><option value="2">2-qism to‘langach</option><option value="3">3-qism to‘langach</option></select></label>
            <label className="drawer-switch"><input name="is_closed" type="checkbox" /><span><b>Bo‘limni hozircha yopiq saqlash</b><small>Yopiq bo‘lim o‘quvchiga ko‘rinmaydi.</small></span></label>
            <div className="drawer-context-card"><b>Kurs: {course.title}</b><small>Yaratilgach, “+ Dars qo‘shish” tugmasi shu bo‘limda paydo bo‘ladi.</small></div>
            <div className="admin-drawer-actions"><button className="button button-ghost" type="button" onClick={() => setAddingSection(false)}>Bekor qilish</button><button className="button button-primary" disabled={busy}>Bo‘limni yaratish →</button></div>
          </form>
        </aside>
      </>}

      {lessonSection && <>
        <button className="admin-drawer-backdrop" type="button" aria-label="Dars oynasini yopish" onClick={() => setAddingLessonTo(null)} />
        <aside className="admin-drawer course-authoring-drawer lesson-authoring-drawer" role="dialog" aria-modal="true" aria-labelledby="new-lesson-title">
          <header><div><span className="eyebrow">YANGI DARS</span><h2 id="new-lesson-title">{lessonSection.position}-bo‘limga dars qo‘shish</h2><small>{lessonSection.title}</small></div><button type="button" aria-label="Yopish" onClick={() => setAddingLessonTo(null)}>×</button></header>
          <div className="drawer-context-card"><b>{course.title} → {lessonSection.title}</b><small>Dars aynan shu bo‘lim ichida saqlanadi.</small></div>
          <form className="admin-drawer-form" onSubmit={(event) => void addLesson(event, lessonSection)}>
            <label>Dars turi <span className="required-mark">*</span><select name="lesson_type" defaultValue="video"><option value="video">Video</option><option value="text">Matn</option><option value="assignment">Topshiriq</option><option value="quiz">Test</option></select></label>
            <label>Dars nomi <span className="required-mark">*</span><input name="title" required autoFocus /></label>
            <label>URL manzili <span className="required-mark">*</span><input name="slug" required pattern="[a-z0-9-]+" placeholder="reference-bilan-ishlash" /></label>
            <label>Qisqa tavsif<textarea name="description" rows={3} /></label>
            <label>Davomiylik (daqiqa)<input name="duration_minutes" type="number" min="0" /></label>
            <label className="drawer-switch"><input name="is_preview" type="checkbox" /><span><b>Bepul preview</b><small>Yoqilsa, kursga kirish huquqisiz ham ko‘rish mumkin.</small></span></label>
            <div className="admin-drawer-actions"><button className="button button-ghost" type="button" onClick={() => setAddingLessonTo(null)}>Bekor qilish</button><button className="button button-primary" disabled={busy}>Saqlash va bo‘limga qo‘shish →</button></div>
          </form>
        </aside>
      </>}
    </>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui";
import { MediaImage } from "@/components/media-image";
import { StudentError, StudentLoading } from "@/components/ui/student-states";
import { useLocale } from "@/components/providers";
import { apiRequest, formatMoney, type CourseProgress, type Course, type CourseSection, type Enrollment } from "@/lib/api-client";
import { getCourseDetail } from "@/features/courses/api/courses.api";
import { localizedCourse } from "@/features/student/api/student-workspace.api";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLocale();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => { setLoading(true); setError(""); getCourseDetail(slug).then(async (data) => { setCourse(data.course); setSections(data.sections); setEnrollment(data.enrollment); if (data.enrollment) setProgress(await apiRequest<CourseProgress>(`/progress/courses/${data.course.id}`)); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Kursni yuklab bo‘lmadi")).finally(() => setLoading(false)); };
  useEffect(() => {
    let active = true;
    getCourseDetail(slug).then(async (data) => {
      if (!active) return;
      setCourse(data.course); setSections(data.sections); setEnrollment(data.enrollment);
      if (data.enrollment) { const nextProgress = await apiRequest<CourseProgress>(`/progress/courses/${data.course.id}`); if (active) setProgress(nextProgress); }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Kursni yuklab bo‘lmadi"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);
  if (loading) return <StudentLoading cards={3}/>;
  if (error || !course) return <StudentError message={error} onRetry={load}/>;
  const copy = localizedCourse(course, locale);
  const completed = new Set(progress?.lessons.filter((item) => item.is_completed).map((item) => item.lesson_id) ?? []);
  const accessStage = enrollment?.access_stage ?? 0;
  const totalLessons = sections.reduce((sum, section) => sum + (section.lessons?.length ?? 0), 0);

  return <div className="course-detail-v3"><Link href={enrollment ? "/app/courses" : "/app/courses/catalog"} className="back-link-inline">← Kurslarga qaytish</Link><header className="course-detail-hero"><div className="course-detail-image"><MediaImage src={course.thumbnail_url} alt={copy.title} sizes="520px" className="media-image"/></div><div><span className="lime-label">{enrollment ? "SIZNING KURSINGIZ" : "KURSLAR KATALOGI"}</span><h1>{copy.title}</h1><p>{copy.description}</p><div className="course-facts"><span>{sections.length} modul</span><span>{totalLessons} dars</span><span>{Number(course.price) ? formatMoney(course.price, course.currency) : "Narx admin bilan kelishiladi"}</span></div>{enrollment ? <><div className="course-progress-label"><span>Umumiy progress</span><b>{Math.round((progress?.completion_ratio ?? 0) * 100)}%</b></div><div className="progress-track"><i style={{ width: `${Math.round((progress?.completion_ratio ?? 0) * 100)}%` }}/></div></> : <div className="course-access-notice"><AppIcon name="shield"/><div><b>Kirish admin tomonidan ochiladi</b><p>Kurs va to‘lov rejasi admin bilan kelishilgach, ochilgan qismlar shu kabinetda ko‘rinadi.</p></div></div>}</div></header>
    <section className="curriculum-v3"><div className="panel-head"><h2>Kurs tarkibi</h2><span>{sections.length} bo‘lim · {totalLessons} dars</span></div>{sections.map((section, index) => { const open = Boolean(enrollment && accessStage >= section.unlock_stage); return <article className={open ? "curriculum-module open" : "curriculum-module locked"} key={section.id}><header><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{section.translations?.[locale]?.title ?? section.title}</h3><p>{section.description}</p></div><small>{open ? `${section.unlock_stage}-qism ochiq` : `${section.unlock_stage}-qism qulflangan`}</small></header><div>{section.lessons?.map((lesson) => { const accessible = open || lesson.is_preview; return accessible ? <Link href={`/app/lessons/${lesson.id}`} key={lesson.id}><span>{completed.has(lesson.id) ? "✓" : lesson.position}</span><b>{lesson.translations?.[locale]?.title ?? lesson.title}</b><small>{completed.has(lesson.id) ? "Yakunlangan" : lesson.is_preview ? "Bepul preview" : "Ochish"} →</small></Link> : <div className="locked-lesson" key={lesson.id}><span><AppIcon name="shield" size={16}/></span><b>{lesson.translations?.[locale]?.title ?? lesson.title}</b><small>{section.unlock_stage}-qism ochilganda</small></div>; })}</div></article>; })}</section>
  </div>;
}

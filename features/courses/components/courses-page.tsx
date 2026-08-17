"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { AppIcon } from "@/components/ui";
import { StudentEmpty, StudentError, StudentLoading } from "@/components/ui/student-states";
import { useLocale } from "@/components/providers";
import { formatMoney, type Course } from "@/lib/api-client";
import { localizedCourse, type StudentCourse } from "@/features/student/api/student-workspace.api";
import { useStudentWorkspace } from "@/features/student/hooks/use-student-workspace";

type Filter = "all" | "active" | "completed";

export default function CoursesPage() {
  const { locale } = useLocale();
  const { data, loading, error, reload } = useStudentWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const courses = useMemo(() => data?.courses ?? [], [data]);
  const counts = { all: courses.length, active: courses.filter((item) => item.progressPercent < 100 && item.enrollment.status === "active").length, completed: courses.filter((item) => item.progressPercent === 100).length };
  const visible = useMemo(() => courses.filter((item) => {
    const matchesFilter = filter === "all" || (filter === "active" ? item.progressPercent < 100 && item.enrollment.status === "active" : item.progressPercent === 100);
    return matchesFilter && localizedCourse(item.course, locale).title.toLocaleLowerCase().includes(search.toLocaleLowerCase());
  }), [courses, filter, locale, search]);
  const enrolledIds = useMemo(() => new Set(data?.enrollments.map((item) => item.course_id) ?? []), [data]);
  const available = useMemo(() => filter === "all" ? (data?.catalog ?? []).filter((course) => !enrolledIds.has(course.id) && localizedCourse(course, locale).title.toLocaleLowerCase().includes(search.toLocaleLowerCase())) : [], [data, enrolledIds, filter, locale, search]);

  return <div className="my-courses-page"><header className="student-page-heading with-action"><div><span className="lime-label">KURSLARIM</span><h1>Mening kurslarim</h1><p>O‘qish jarayoni, ochilgan qismlar va keyingi darslarni boshqaring.</p></div><Link className="button button-ghost" href="/app/courses/catalog">Kurslar katalogi <AppIcon name="arrow"/></Link></header>
    <div className="student-toolbar"><div className="segmented-tabs">{(["all", "active", "completed"] as Filter[]).map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item === "all" ? "Barchasi" : item === "active" ? "Jarayonda" : "Tugallangan"}<span>{counts[item]}</span></button>)}</div><label className="student-search"><AppIcon name="search"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kursni qidiring"/></label></div>
    {loading ? <StudentLoading cards={2}/> : error || !data ? <StudentError message={error} onRetry={() => void reload()}/> : <>{visible.length > 0 && <section className="my-course-list">{visible.map((item) => <MyCourseCard item={item} locale={locale} key={item.course.id}/>)}</section>}{available.length > 0 && <section className="inline-course-catalog"><div className="inline-course-catalog-head"><div><span className="lime-label">MAVJUD KURSLAR</span><h2>Katalogga kirmasdan tanlang</h2></div><Link href="/app/courses/catalog">Barchasini ko‘rish <AppIcon name="arrow" size={16}/></Link></div><div className="catalog-grid">{available.map((course) => <AvailableCourseCard course={course} locale={locale} key={course.id}/>)}</div></section>}{visible.length === 0 && available.length === 0 && <StudentEmpty title={search ? "Mos kurs topilmadi" : "Hali kurslaringiz yo‘q"} body={search ? "Qidiruv so‘zini o‘zgartirib ko‘ring." : "Yangi kurslar nashr qilingach shu yerda ko‘rinadi."}/>}</>}
  </div>;
}

function AvailableCourseCard({ course, locale }: { course: Course; locale: string }) {
  const copy = localizedCourse(course, locale);
  return <article className="catalog-card"><div className="catalog-cover"><MediaImage src={course.thumbnail_url} alt={course.cover_alt_text ?? copy.title} sizes="320px" className="media-image"/></div><div><span className="lime-label">AI KURS</span><h2>{copy.title}</h2><p>{copy.shortDescription || "Kurs haqida batafsil ma’lumotni oching."}</p><small>{Number(course.price) ? formatMoney(course.price, course.currency) : "Bepul"}</small><Link className="button button-primary" href={`/app/courses/${course.slug}`}>Kursni ko‘rish <AppIcon name="arrow"/></Link></div></article>;
}

function MyCourseCard({ item, locale }: { item: StudentCourse; locale: string }) {
  const copy = localizedCourse(item.course, locale);
  const accessStage = item.enrollment.access_stage ?? 0;
  const href = item.nextLesson ? `/app/lessons/${item.nextLesson.id}` : `/app/courses/${item.course.slug}`;
  return <article className="my-course-card"><div className="my-course-cover"><MediaImage src={item.course.thumbnail_url} alt={copy.title} sizes="380px" className="media-image"/></div><div className="my-course-content"><span className="lime-label">{item.progressPercent === 100 ? "TUGALLANGAN" : "JARAYONDA"}</span><h2>{copy.title}</h2><p>{item.totalLessons} dars · {item.sections.length} modul</p><div className="course-progress-label"><span>{item.completedLessons} / {item.totalLessons} dars yakunlandi</span><b>{item.progressPercent}%</b></div><div className="progress-track"><i style={{ width: `${item.progressPercent}%` }}/></div><p className="next-lesson">Keyingi dars: <b>{item.nextLesson?.title ?? (item.progressPercent === 100 ? "Barcha darslar yakunlangan" : "Kurs tarkibini ko‘ring")}</b></p><Link className="button button-primary" href={href}>{item.progressPercent === 100 ? "Kursni qayta ko‘rish" : "Darsni davom ettirish"} <AppIcon name="arrow"/></Link></div><aside className="course-access-map"><h3>Ochilish holati</h3>{[1, 2, 3].map((stage) => <div className={stage <= accessStage ? "unlocked" : stage === accessStage + 1 ? "waiting" : "locked"} key={stage}><span>{stage <= accessStage ? "✓" : <AppIcon name="shield" size={17}/>}</span><div><b>{stage}-qism</b><small>{stage <= accessStage ? "Ochiq" : stage === accessStage + 1 ? "To‘lov tasdig‘i kutilmoqda" : "Oldingi qismdan keyin ochiladi"}</small></div></div>)}<Link href="/app/orders">To‘lov holatini ko‘rish <AppIcon name="arrow" size={16}/></Link></aside></article>;
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { AppIcon } from "@/components/ui";
import { StudentEmpty, StudentError, StudentLoading } from "@/components/ui/student-states";
import { useLocale } from "@/components/providers";
import { formatMoney } from "@/lib/api-client";
import { localizedCourse } from "@/features/student/api/student-workspace.api";
import { useStudentWorkspace } from "@/features/student/hooks/use-student-workspace";

export default function CourseCatalogPage() {
  const { locale } = useLocale();
  const { data, loading, error, reload } = useStudentWorkspace();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "price-low" | "price-high">("new");
  const enrolled = new Set(data?.enrollments.map((item) => item.course_id) ?? []);
  const courses = useMemo(() => [...(data?.catalog ?? [])].filter((course) => {
    const copy = localizedCourse(course, locale);
    return `${copy.title} ${copy.shortDescription ?? ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase());
  }).sort((a, b) => sort === "price-low" ? Number(a.price) - Number(b.price) : sort === "price-high" ? Number(b.price) - Number(a.price) : (b.published_at ?? "").localeCompare(a.published_at ?? "")), [data, locale, search, sort]);

  return <div className="course-catalog-page"><header className="student-page-heading with-action"><div><span className="lime-label">KURSLAR KATALOGI</span><h1>O‘zingizga mos kursni tanlang</h1><p>Amaliy maqsadingiz bo‘yicha mavjud kurslarni toping.</p></div><Link className="button button-ghost" href="/app/courses">Mening kurslarim <AppIcon name="arrow"/></Link></header>
    <div className="catalog-toolbar"><label className="student-search wide"><AppIcon name="search"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kurs yoki mavzuni qidiring…"/></label><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="new">Eng yangi</option><option value="price-low">Narx: arzonidan</option><option value="price-high">Narx: qimmatidan</option></select></div>
    <div className="catalog-summary"><b>{courses.length} ta kurs topildi</b><span><AppIcon name="shield" size={16}/>Kursga kirish admin tasdiqlagandan keyin ochiladi</span></div>
    {loading ? <StudentLoading cards={6}/> : error || !data ? <StudentError message={error} onRetry={() => void reload()}/> : courses.length ? <section className="catalog-grid">{courses.map((course) => { const copy = localizedCourse(course, locale); const owned = enrolled.has(course.id); return <article className="catalog-card" key={course.id}><div className="catalog-cover"><MediaImage src={course.thumbnail_url} alt={copy.title} sizes="320px" className="media-image"/></div><div><span className="lime-label">AI KURS</span><h2>{copy.title}</h2><p>{copy.shortDescription || "Kurs haqida batafsil ma’lumotni oching."}</p>{owned ? <span className="owned-course"><AppIcon name="check" size={16}/>Sizda mavjud</span> : <small>{Number(course.price) ? formatMoney(course.price, course.currency) : "Narx admin bilan kelishiladi"}</small>}<Link className={owned ? "button button-primary" : "button button-ghost"} href={`/app/courses/${course.slug}`}>{owned ? "Kursga qaytish" : "Batafsil"} <AppIcon name="arrow"/></Link></div></article>; })}</section> : <StudentEmpty title="Mos kurs topilmadi" body="Qidiruv so‘zini o‘zgartirib ko‘ring yoki keyinroq qayting."/>}
  </div>;
}


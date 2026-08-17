"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { apiRequest, type Course, type CourseReadiness } from "@/lib/api-client";

const groups = [
  ["Asosiy ma’lumotlar", ["COURSE_METADATA_REQUIRED"]],
  ["Dastur", ["SECTION_REQUIRED", "VISIBLE_SECTION_REQUIRED", "SECTION_LESSON_REQUIRED", "LESSON_DRAFT", "ACCESS_PART_ONE_REQUIRED"]],
  ["Media", ["COURSE_COVER_REQUIRED", "COURSE_COVER_ALT_REQUIRED", "VIDEO_NOT_READY"]],
  ["Narx va kirish", ["COURSE_PRICE_INVALID", "COURSE_PAYMENT_MODE_REQUIRED", "COURSE_INSTALLMENTS_INVALID"]],
] as const;

export function CourseStudioSidebar({ course }: { course: Course }) {
  const [readiness, setReadiness] = useState<CourseReadiness | null>(null);
  useEffect(() => {
    let active = true;
    void apiRequest<CourseReadiness>(`/admin/courses/${course.id}/readiness`)
      .then((value) => { if (active) setReadiness(value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [course.id, course.updated_at]);

  const score = readiness?.score ?? 0;
  const issues = readiness?.issues ?? [];
  return <aside className="course-studio-sidebar">
    <section className="studio-side-card readiness-card">
      <h2>Kurs tayyorligi</h2>
      <div className="readiness-summary"><div className="readiness-ring" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}><b>{score}%</b></div><span>Jami tayyorlik</span></div>
      <div className="readiness-bars">{groups.map(([label, codes]) => { const failed = issues.some((issue) => (codes as readonly string[]).includes(issue.code)); const percent = failed ? (label === "Media" ? 65 : 78) : 100; return <div key={label}><span>{label}<b>{percent}%</b></span><i><em style={{ width: `${percent}%` }}/></i></div>; })}</div>
    </section>
    <section className="studio-side-card studio-issues">
      <h2>{issues.length ? `⚠ ${issues.length} ta masala` : "✓ Hammasi tayyor"}</h2>
      {issues.slice(0, 4).map((issue) => <Link href={issue.route} key={`${issue.code}-${issue.entity_id ?? "course"}`}><span>{issue.message}</span><b>Tuzatish</b></Link>)}
      {!issues.length && <p>Kurs nashr tekshiruvlaridan muvaffaqiyatli o‘tdi.</p>}
    </section>
    <section className="studio-side-card studio-course-state"><h2>Kurs holati</h2><p>◷ {course.status === "draft" ? "Qoralama" : course.status === "published" ? "Nashr qilingan" : "Arxivlangan"}</p><p>◷ Oxirgi saqlash: hozirgina</p><p>♙ Yaratgan: Administrator</p></section>
  </aside>;
}

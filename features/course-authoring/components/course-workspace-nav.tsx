import Link from "next/link";
import { AppIcon } from "@/components/ui";
import { AdminStatus } from "@/features/admin/components/admin-kit";
import type { Course } from "@/lib/api-client";

type WorkspaceTab = "general" | "curriculum" | "pricing" | "media" | "settings" | "publish";

export function CourseWorkspaceNav({ course, active }: { course: Course; active: WorkspaceTab }) {
  const base = `/admin/courses/${course.id}`;
  const tabs: Array<[WorkspaceTab, string, string]> = [
    ["general", "Umumiy", `${base}/edit`],
    ["curriculum", "Dastur", `${base}/content`],
    ["pricing", "Narx va kirish", `${base}/pricing`],
    ["media", "Media", `${base}/media`],
    ["publish", "Nashr", `${base}/publish`],
  ];
  const subtitles: Record<WorkspaceTab, string> = {
    general: "Kursning asosiy ma’lumotlari va katalog ko‘rinishini boshqaring.",
    curriculum: "Kurs tarkibi va o‘quv ketma-ketligini boshqaring.",
    pricing: "Kurs narxi, to‘lov rejasi va kirish bosqichlarini boshqaring.",
    media: "Kurs muqovasi, promo video va dars media fayllarini boshqaring.",
    settings: "Kurs holati va xavfsiz amallarni boshqaring.",
    publish: "Kursni talabalarga ko‘rsatishdan oldin yakuniy holatini tekshiring.",
  };
  return <section className="course-workspace-head">
    <div className="course-workspace-title">
      <div><span className="course-studio-crumb">Admin　/　Kurslar　/　<b>{course.title}</b></span><div className="course-title-line"><h1>{course.title}</h1><AdminStatus value={course.status}/></div><p>{subtitles[active]}</p></div>
      <div className="course-studio-actions"><span className="studio-saved">✓ Barcha o‘zgarishlar saqlandi</span><Link className="button button-ghost" href={`/app/courses/${course.slug}`}><AppIcon name="search" size={17}/> Talaba ko‘rinishi</Link><Link className="button button-primary" href={`${base}/publish`}><AppIcon name="sparkles" size={17}/> Nashrga tayyorlash</Link></div>
    </div>
    <nav className="course-workspace-tabs" aria-label="Kurs workspace bo‘limlari">
      {tabs.map(([key, label, href]) => <Link className={active === key ? "active" : ""} href={href} key={key}>{label}</Link>)}
    </nav>
  </section>;
}

"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers";
import { AppIcon } from "@/components/ui";
import { MediaImage } from "@/components/media-image";
import { StudentEmpty, StudentError, StudentLoading } from "@/components/ui/student-states";
import { localizedCourse } from "@/features/student/api/student-workspace.api";
import { useStudentWorkspace } from "@/features/student/hooks/use-student-workspace";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useStudentWorkspace();
  if (loading) return <><PageHeading name={user?.first_name}/><StudentLoading cards={4}/></>;
  if (error || !data) return <><PageHeading name={user?.first_name}/><StudentError message={error} onRetry={() => void reload()}/></>;

  const activeCourses = data.courses.filter((item) => item.enrollment.status === "active");
  const current = activeCourses.find((item) => item.progressPercent < 100) ?? activeCourses[0];
  const ownRank = data.leaderboard.find((item) => item.user_id === user?.id);
  const totalLessons = activeCourses.reduce((sum, item) => sum + item.totalLessons, 0);
  const completedLessons = activeCourses.reduce((sum, item) => sum + item.completedLessons, 0);
  const overallProgress = totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0;
  const latestPayment = data.paymentStatuses.sort((a, b) => b.order.created_at.localeCompare(a.order.created_at))[0];
  const paymentStage = latestPayment?.access_stage ?? 0;
  const details = current ? localizedCourse(current.course, "uz") : null;
  const continueHref = current?.nextLesson ? `/app/lessons/${current.nextLesson.id}` : current ? `/app/courses/${current.course.slug}` : "/app/courses/catalog";
  const plan = [
    { done: Boolean(current && current.progressPercent === 100), label: current?.nextLesson ? `Keyingi dars: ${current.nextLesson.title}` : "Kursdagi keyingi darsni yakunlash" },
    { done: false, label: "Bitta yangi prompt yaratish" },
    { done: Boolean(user?.phone_verified_at && user?.email_verified_at), label: "Profil kontaktlarini tasdiqlash" },
  ];

  return <div className="student-dashboard"><PageHeading name={user?.first_name}/>
    <section className="student-metrics">
      <Metric icon="book" label="Faol kurs" value={String(activeCourses.length)} meta={current?.course.title ?? "Faol kurs yo‘q"}/>
      <Metric icon="motion" label="Kurs progressi" value={`${overallProgress}%`} meta={`${completedLessons} / ${totalLessons} dars`}/>
      <Metric icon="star" label="Jami ball" value={String(ownRank?.points ?? 0)} meta={ownRank ? `Reytingda ${ownRank.rank}-o‘rin` : "Reyting hali shakllanmagan"}/>
      <Metric icon="bag" label="To‘lov holati" value={latestPayment ? `${paymentStage} / ${latestPayment.installments.length || 1}` : "—"} meta={latestPayment ? (latestPayment.order.plan_status === "assigned" ? "Reja biriktirilgan" : "Admin rejasi kutilmoqda") : "Faol to‘lov rejasi yo‘q"}/>
    </section>
    <section className="student-dashboard-grid">
      <article className="panel continue-learning"><h2>O‘qishni davom ettiring</h2>{current && details ? <div className="continue-learning-body"><div className="continue-cover"><MediaImage src={current.course.thumbnail_url} alt={details.title} sizes="360px" className="media-image"/></div><div><span className="lime-label">JARAYONDA</span><h3>{details.title}</h3><p>{current.completedLessons} / {current.totalLessons} dars yakunlandi</p><div className="progress-track"><i style={{ width: `${current.progressPercent}%` }}/></div><div className="continue-next"><small>Keyingi dars</small><b>{current.nextLesson?.title ?? "Kurs tarkibini ko‘rish"}</b></div><Link className="button button-primary" href={continueHref}>Darsni davom ettirish <AppIcon name="arrow"/></Link><small className="access-note"><AppIcon name="shield" size={15}/>{current.enrollment.access_stage ?? 0}-qismgacha ochiq</small></div></div> : <StudentEmpty title="Hali faol kursingiz yo‘q" body="Kurslar katalogini ko‘ring. Kirish admin sizga reja biriktirgandan so‘ng ochiladi." action={<Link className="button button-primary" href="/app/courses/catalog">Kurslarni ko‘rish</Link>}/>}</article>
      <article className="panel dashboard-actions"><h2>Tezkor amallar</h2><Action href="/app/ai-tools" icon="sparkles" title="AI prompt yaratish" body="Modelga mos inglizcha prompt"/><Action href="/app/courses/catalog" icon="book" title="Kurslarni ko‘rish" body="O‘qishni rejalashtiring"/><Action href="/app/orders" icon="bag" title="To‘lov holatini ko‘rish" body="Reja va karta ma’lumotlari"/></article>
      <article className="panel recent-prompts"><div className="panel-head"><h2>Oxirgi promptlar</h2><Link href="/app/ai-tools">Yangi prompt <AppIcon name="arrow" size={16}/></Link></div><StudentEmpty icon="sparkles" title="Saqlangan promptlar yo‘q" body="Prompt yarating va natijani nusxalab oling." action={<Link href="/app/ai-tools">AI yordamchini ochish</Link>}/></article>
      <article className="panel daily-plan"><div className="panel-head"><h2>Bugungi reja</h2><b>{plan.filter((item) => item.done).length} / {plan.length} bajarildi</b></div>{plan.map((item) => <div className={item.done ? "done" : ""} key={item.label}><span>{item.done ? "✓" : ""}</span>{item.label}</div>)}</article>
    </section>
  </div>;
}

function PageHeading({ name }: { name?: string }) { return <header className="student-page-heading"><span className="lime-label">SHAXSIY KABINET</span><h1>Xush kelibsiz, {name ?? "foydalanuvchi"}</h1><p>O‘qishni davom ettiring va modelga mos promptlaringizni boshqaring.</p></header>; }
function Metric({ icon, label, value, meta }: { icon: "book" | "motion" | "star" | "bag"; label: string; value: string; meta: string }) { return <article className="student-metric"><span><AppIcon name={icon}/></span><div><small>{label}</small><strong>{value}</strong><p>{meta}</p></div></article>; }
function Action({ href, icon, title, body }: { href: string; icon: "sparkles" | "book" | "bag"; title: string; body: string }) { return <Link href={href}><span><AppIcon name={icon}/></span><div><b>{title}</b><small>{body}</small></div><AppIcon name="arrow"/></Link>; }

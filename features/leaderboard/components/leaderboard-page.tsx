"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers";
import { AppIcon } from "@/components/ui";
import { StudentEmpty, StudentError, StudentLoading } from "@/components/ui/student-states";
import { useStudentWorkspace } from "@/features/student/hooks/use-student-workspace";

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useStudentWorkspace();
  const [search, setSearch] = useState("");
  const entries = useMemo(() => data?.leaderboard ?? [], [data]);
  const own = entries.find((entry) => entry.user_id === user?.id);
  const top = entries.slice(0, 3);
  const visible = useMemo(() => entries.filter((entry) => entry.display_name.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [entries, search]);
  const next = own && own.rank > 1 ? entries.find((entry) => entry.rank === own.rank - 1) : null;
  return <div className="leaderboard-v3"><header className="student-page-heading with-action"><div><span className="lime-label">O‘QUVCHILAR REYTINGI</span><h1>Reyting</h1><p>Darslar va tasdiqlangan o‘quv faoliyati asosida shakllanadi.</p></div><div className="segmented-tabs"><button disabled>Haftalik</button><button disabled>Oylik</button><button className="active">Umumiy</button></div></header>
    {loading ? <StudentLoading cards={4}/> : error || !data ? <StudentError message={error} onRetry={() => void reload()}/> : !entries.length ? <StudentEmpty icon="trophy" title="Reyting hali shakllanmagan" body="O‘quvchilar darslarni yakunlagach natijalar shu yerda ko‘rinadi."/> : <>
      {own && <section className="panel own-ranking-card"><div className="rank-avatar large">{initials(own.display_name)}</div><div><small>Sizning natijangiz</small><h2>{own.rank}-o‘rin</h2><strong>{own.points.toLocaleString()} ball</strong></div><div className="own-ranking-stats"><span><AppIcon name="book"/><b>{own.completed_lessons ?? 0}</b><small>dars</small></span><span><AppIcon name="clock"/><b>{own.watched_minutes ?? 0}</b><small>daqiqa</small></span></div><div className="next-rank"><small>{next ? `${next.rank}-o‘ringacha ${Math.max(0, next.points - own.points)} ball qoldi` : "Siz birinchi o‘rindasiz"}</small><div className="progress-track"><i style={{ width: `${next ? Math.min(100, Math.max(4, own.points / Math.max(1, next.points) * 100)) : 100}%` }}/></div></div></section>}
      <section className="panel podium-section"><h2>Eng yuqori natijalar</h2><div className="ranking-podium">{[top[1], top[0], top[2]].filter(Boolean).map((entry) => <article className={entry.rank === 1 ? "podium-person first" : "podium-person"} key={entry.user_id}><span className="rank-badge">{entry.rank}</span><div className="rank-avatar">{initials(entry.display_name)}</div><h3>{entry.display_name}</h3><strong>{entry.points.toLocaleString()} ball</strong><small>{entry.completed_lessons ?? 0} dars</small></article>)}</div></section>
      <section className="leaderboard-table-grid"><article className="panel ranking-table"><div className="panel-head"><h2>Umumiy jadval</h2><label className="student-search"><AppIcon name="search"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="O‘quvchini qidiring"/></label></div><div className="leader-head"><span>O‘rin</span><span>O‘quvchi</span><span>Darslar</span><span>O‘qish vaqti</span><span>Ball</span></div>{visible.map((entry) => <div className={entry.user_id === user?.id ? "leader-row current" : "leader-row"} key={entry.user_id}><strong>{entry.rank}</strong><div><span className="mini-avatar">{initials(entry.display_name)}</span><b>{entry.display_name}{entry.user_id === user?.id ? " (Siz)" : ""}</b></div><span>{entry.completed_lessons ?? 0}</span><span>{entry.watched_minutes ?? 0} daq.</span><strong>{entry.points.toLocaleString()}</strong></div>)}</article><aside className="panel points-guide"><h2>Ballar qanday hisoblanadi?</h2><div><AppIcon name="book"/><span>Darsni yakunlash</span><b>+10 ball</b></div><div><AppIcon name="calendar"/><span>Amaliy topshiriq</span><b>+20 ball</b></div><div><AppIcon name="clock"/><span>Kundalik faollik</span><b>+5 ball</b></div><div><AppIcon name="shield"/><span>Admin tasdiqlagan loyiha</span><b>+30 ball</b></div><p>Ballar faqat backend tasdiqlagan faoliyatdan keyin yangilanadi.</p></aside></section>
    </>}
  </div>;
}

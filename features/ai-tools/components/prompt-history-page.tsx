"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui";
import { getPromptHistory, type PromptHistoryItem } from "@/lib/api-client";

export default function PromptHistoryPage() {
  const [items, setItems] = useState<PromptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getPromptHistory().then(setItems).catch((reason) => setError(reason instanceof Error ? reason.message : "Tarixni yuklab bo‘lmadi")).finally(() => setLoading(false)); }, []);
  return <div className="prompt-history-page">
    <header className="student-page-heading with-action"><div><span className="lime-label">AI YORDAMCHI</span><h1>So‘nggi promptlar</h1><p>Oldingi promptlaringiz faqat sizga ko‘rinadi.</p></div><Link className="button button-primary" href="/app/ai-tools">+ Yangi prompt</Link></header>
    {loading ? <div className="panel history-state">Yuklanmoqda…</div> : error ? <div className="form-error" role="alert">{error}</div> : !items.length ? <div className="panel history-state"><AppIcon name="clock" size={42}/><h2>Tarix hali bo‘sh</h2><p>Birinchi professional promptingizni yarating.</p></div> : <div className="prompt-history-grid">{items.map((item) => <article className="panel" key={item.id}><header><span>{item.mediaType === "image" ? "Tasvir" : "Video"}</span><time>{new Date(item.createdAt).toLocaleString("uz-UZ")}</time></header><h2>{item.title}</h2><p>{item.promptPreview}</p><footer><b>{item.targetLabel} · {item.profileVersion}</b><span>{item.status === "success" ? "✓ Tayyor" : item.status}</span></footer></article>)}</div>}
  </div>;
}

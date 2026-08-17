"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui";
import { MediaImage } from "@/components/media-image";
import { StudentEmpty, StudentError, StudentLoading } from "@/components/ui/student-states";
import { formatMoney, type OrderPaymentStatus, type PaymentAccount } from "@/lib/api-client";
import { localizedCourse } from "@/features/student/api/student-workspace.api";
import { useStudentWorkspace } from "@/features/student/hooks/use-student-workspace";

export default function OrdersPage() {
  const { data, loading, error, reload } = useStudentWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const statuses = useMemo(() => [...(data?.paymentStatuses ?? [])].sort((a, b) => b.order.created_at.localeCompare(a.order.created_at)), [data]);
  const selected = statuses.find((item) => item.order.id === selectedId) ?? statuses[0];
  const course = data?.catalog.find((item) => item.id === selected?.order.course_id);
  if (loading) return <><Heading/><StudentLoading cards={3}/></>;
  if (error || !data) return <><Heading/><StudentError message={error} onRetry={() => void reload()}/></>;
  if (!selected || !course) return <><Heading/><StudentEmpty icon="bag" title="Faol to‘lov rejasi yo‘q" body="To‘lov rejasi admin tomonidan biriktirilgach, summa, bosqichlar va rekvizitlar shu yerda ko‘rinadi."/></>;
  const copy = localizedCourse(course, "uz");
  const total = selected.order.agreed_total_amount ?? selected.order.amount;
  const paid = selected.order.paid_amount;
  const ratio = Number(total) ? Math.min(100, Math.round(Number(paid) / Number(total) * 100)) : 0;

  return <div className="payment-status-page"><Heading/>{statuses.length > 1 && <div className="payment-course-tabs">{statuses.map((item) => <button className={item.order.id === selected.order.id ? "active" : ""} key={item.order.id} onClick={() => setSelectedId(item.order.id)}>{data.catalog.find((courseItem) => courseItem.id === item.order.course_id)?.title ?? `#${item.order.id.slice(0, 8)}`}</button>)}</div>}
    <article className="payment-course-summary"><div className="payment-course-cover"><MediaImage src={course.thumbnail_url} alt={copy.title} sizes="240px" className="media-image"/></div><div className="payment-course-main"><h2>{copy.title}</h2><span className="lime-label">{selected.order.payment_mode === "installment_3" ? "3 QISMGA BO‘LIB TO‘LASH" : "TO‘LIQ TO‘LOV"}</span><div className="payment-numbers"><div><small>Umumiy summa</small><b>{formatMoney(total, selected.order.currency)}</b></div><div><small>To‘langan</small><b className="lime-text">{formatMoney(paid, selected.order.currency)}</b></div><div><small>Qoldiq</small><b>{formatMoney(selected.remaining_amount, selected.order.currency)}</b></div><div><small>Kursga kirish</small><b>{selected.access_stage} / {Math.max(1, selected.installments.length)} qism</b></div></div><div className="progress-track"><i style={{ width: `${ratio}%` }}/></div></div>{selected.payment_account && <button className="button button-primary" onClick={() => setCardOpen(true)}>Karta ma’lumotlarini ko‘rish <AppIcon name="arrow"/></button>}</article>
    <section className="panel installment-plan"><h2>To‘lov rejasi</h2><div className="installment-timeline">{selected.installments.map((item) => <article className={item.status} key={item.id}><span>{item.status === "paid" ? "✓" : item.sequence}</span><h3>{item.sequence}-qism</h3><b>{formatMoney(item.amount, selected.order.currency)}</b><p>{item.due_date ? new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.due_date)) : "Sana belgilanmagan"}</p><small>{item.status === "paid" ? "To‘langan" : item.status === "overdue" ? "Muddati o‘tgan" : "To‘lov kutilmoqda"}</small><em><AppIcon name="shield" size={15}/>{item.status === "paid" ? `Kursning ${item.sequence}-qismi ochiq` : "Admin tasdiqlagach ochiladi"}</em></article>)}</div></section>
    <div className="payment-info-strip"><AppIcon name="shield"/><p>To‘lovni bank ilovasi orqali amalga oshiring. Admin tasdiqlagandan keyin kursning navbatdagi qismi avtomatik ochiladi.</p></div>
    <section className="panel payment-history"><h2>To‘lovlar tarixi</h2>{data.payments.filter((item) => item.order_id === selected.order.id).length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>To‘lov</th><th>Summa</th><th>Sana</th><th>Holat</th></tr></thead><tbody>{data.payments.filter((item) => item.order_id === selected.order.id).map((item) => <tr key={item.id}><td>#{item.id.slice(0, 8)}</td><td>{formatMoney(item.amount, item.currency)}</td><td>{new Intl.DateTimeFormat("uz-UZ").format(new Date(item.paid_at ?? item.created_at))}</td><td><span className="status-pill">{item.status === "succeeded" ? "To‘langan" : item.status}</span></td></tr>)}</tbody></table></div> : <p className="muted-copy">Tasdiqlangan to‘lovlar hali yo‘q.</p>}</section>
    {cardOpen && selected.payment_account && <PaymentCardModal account={selected.payment_account} status={selected} onClose={() => setCardOpen(false)}/>} 
  </div>;
}

function Heading() { return <header className="student-page-heading"><span className="lime-label">TO‘LOV NAZORATI</span><h1>To‘lov holati</h1><p>Admin biriktirgan reja, to‘langan qismlar va kursga kirish holatini kuzating.</p></header>; }
function PaymentCardModal({ account, status, onClose }: { account: PaymentAccount; status: OrderPaymentStatus; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const pending = status.installments.find((item) => item.status !== "paid");
  async function copyCard() { await navigator.clipboard.writeText(account.card_number.replace(/\s/g, "")); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="payment-card-modal" role="dialog" aria-modal="true" aria-labelledby="card-title"><button className="modal-close" aria-label="Yopish" onClick={onClose}>×</button><header><span><AppIcon name="bag"/></span><div><h2 id="card-title">To‘lov uchun karta ma’lumotlari</h2><p>Administrator biriktirgan rekvizitlar.</p></div></header><div className="modal-payment-sum"><small>To‘lov summasi</small><strong>{formatMoney(pending?.amount ?? status.remaining_amount, status.order.currency)}</strong><span>To‘lov kutilmoqda</span></div><div className="bank-card"><small>Karta raqami</small><strong>{account.card_number}</strong><button onClick={() => void copyCard()}><AppIcon name="copy" size={17}/>{copied ? "Nusxalandi" : "Nusxalash"}</button><div><span>Karta egasi<b>{account.card_holder_name}</b></span><span>To‘lov tizimi<b>{account.bank_name ?? account.name}</b></span></div></div><p className="secure-note"><AppIcon name="shield" size={17}/>Rekvizitlar faqat administrator tomonidan o‘zgartiriladi.</p><div className="modal-actions"><button className="button button-ghost" onClick={onClose}>Yopish</button><button className="button button-primary" onClick={() => void copyCard()}><AppIcon name="copy"/>Karta raqamini nusxalash</button></div></section></div>;
}

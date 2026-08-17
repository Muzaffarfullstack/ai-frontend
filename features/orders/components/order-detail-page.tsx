"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers";
import { AppIcon } from "@/components/ui";
import { formatMoney, localizedApiError, type OrderPaymentStatus, type PaymentInstructions } from "@/lib/api-client";
import { getOrderPaymentInstructions, getOrderPaymentStatus } from "@/features/orders/api/orders.api";

export default function OrderPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const [data, setData] = useState<OrderPaymentStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getOrderPaymentStatus(id)); }
    catch (reason) { setError(localizedApiError(reason, t)); }
    finally { setLoading(false); }
  }, [id, t]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  async function openInstructions() {
    setInstructionsLoading(true); setError("");
    try { setInstructions(await getOrderPaymentInstructions(id)); setInstructionsOpen(true); }
    catch (reason) { setError(localizedApiError(reason, t)); }
    finally { setInstructionsLoading(false); }
  }

  if (loading) return <div className="center-screen"><span className="loader"/></div>;
  const isFree = data ? Number(data.order.amount) === 0 : false;
  return <>
    <Link href="/app/orders" className="back-link-inline">← Buyurtmalar</Link>
    <header className="page-heading"><span className="eyebrow">ORDER · {id.slice(0, 8)}</span><h1>To‘lov holati</h1><p>Admin biriktirgan reja, to‘lov rekvizitlari va kursga kirish bosqichini kuzating.</p></header>
    {error && <div className="form-error page-alert">{error}<button className="text-button" onClick={() => void load()}>Qayta urinish</button></div>}
    {data && <div className="payment-readonly-grid">
      <section className="panel payment-plan-summary"><div className="panel-head"><h2>{formatMoney(data.order.agreed_total_amount ?? data.order.amount, data.order.currency)}</h2><span className={`status-pill ${data.order.status === "pending" ? "warning" : ""}`}>{data.order.status}</span></div>
        <div className="readonly-payment-metrics"><div><small>Reja</small><b>{isFree ? "Bepul kirish" : data.order.plan_status === "assigned" ? (data.order.payment_mode === "full" ? "To‘liq to‘lov" : "3 bo‘lib to‘lash") : data.order.payment_mode === "installment_3" ? "3 bo‘lib — admin tasdig‘i kutilmoqda" : "To‘liq — admin tasdig‘i kutilmoqda"}</b></div><div><small>To‘langan</small><b>{isFree ? "Talab qilinmaydi" : formatMoney(data.order.paid_amount, data.order.currency)}</b></div><div><small>Qolgan</small><b>{isFree ? "0 UZS" : formatMoney(data.remaining_amount, data.order.currency)}</b></div><div><small>Kursga kirish</small><b>{isFree && data.access_stage === 3 ? "To‘liq kirish" : data.access_stage ? `${data.access_stage} / 3 bosqich` : "Hali ochilmagan"}</b></div></div>
        {data.order.agreement_note && <p className="payment-agreement-note">{data.order.agreement_note}</p>}
      </section>
      <section className="panel payment-account-readonly"><h2>To‘lov rekvizitlari</h2>{isFree ? <div className="empty-state"><AppIcon name="check" size={40}/><h3>Bepul kurs faollashtirildi</h3><p>Bu kurs uchun to‘lov va admin rejasi talab qilinmaydi.</p></div> : data.payment_account ? <div><span>{data.payment_account.bank_name ?? data.payment_account.name}</span><strong>{data.payment_account.card_number}</strong><b>{data.payment_account.card_holder_name}</b><p>{data.payment_account.instructions}</p><button className="button button-primary" disabled={instructionsLoading || Number(data.remaining_amount) <= 0} onClick={() => void openInstructions()}>{instructionsLoading ? "Yuklanmoqda…" : "To‘lov qilish"}</button></div> : <div className="empty-state"><AppIcon name="clock" size={40}/><h3>Admin siz tanlagan rejani biriktiradi</h3><p>{data.order.payment_mode === "installment_3" ? "3 bo‘lib to‘lash" : "To‘liq to‘lash"} uchun aniq summa va karta shu yerda ko‘rinadi.</p></div>}</section>
      {data.installments.length > 0 && <section className="panel payment-installments"><h2>Bo‘lib to‘lash jadvali</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Bosqich</th><th>Summa</th><th>Muddat</th><th>Holat</th></tr></thead><tbody>{data.installments.map(item => <tr key={item.id}><td>{item.sequence} / 3</td><td>{formatMoney(item.amount, data.order.currency)}</td><td>{item.due_date ? new Date(`${item.due_date}T00:00:00`).toLocaleDateString() : "—"}</td><td><span className={`status-pill ${item.status !== "paid" ? "warning" : ""}`}>{item.status}</span></td></tr>)}</tbody></table></div></section>}
      {!isFree && <div className="payment-readonly-note"><AppIcon name="shield"/><p>To‘lov holatini faqat admin bank o‘tkazmasini tekshirgandan keyin o‘zgartiradi. Bu sahifada chek yuklash yoki “to‘ladim” amali mavjud emas.</p></div>}
    </div>}
    {instructionsOpen && instructions && <div className="payment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInstructionsOpen(false); }}><section className="payment-instructions-modal" role="dialog" aria-modal="true" aria-labelledby="payment-instructions-title"><header><div><span className="eyebrow">MANUAL TRANSFER</span><h2 id="payment-instructions-title">To‘lov qilish</h2></div><button type="button" aria-label="Yopish" onClick={() => setInstructionsOpen(false)}>×</button></header><p className="admin-muted">Quyidagi rekvizitlarga bank ilovangiz orqali aniq summani o‘tkazing.</p><div className="payment-instruction-amount"><small>To‘lanadigan summa</small><strong>{formatMoney(instructions.amount, instructions.currency)}</strong></div>{instructions.payment_accounts.map((account) => <article className="payment-instruction-account" key={account.id}><dl><div><dt>Bank</dt><dd>{account.bank_name ?? account.name}</dd></div><div><dt>Karta raqami</dt><dd>{account.card_number}</dd></div><div><dt>Karta egasi</dt><dd>{account.card_holder_name}</dd></div></dl>{account.instructions && <p>{account.instructions}</p>}</article>)}<div className="payment-readonly-note"><AppIcon name="shield"/><p>Bu yerda chek yuklash yoki “To‘ladim” tugmasi yo‘q. Tashqi o‘tkazmani tekshirgach, holatni faqat admin yangilaydi.</p></div><button className="button button-ghost" type="button" onClick={() => setInstructionsOpen(false)}>Yopish</button></section></div>}
  </>;
}

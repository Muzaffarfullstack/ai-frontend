"use client";

import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers";
import { AppIcon } from "@/components/ui/app-icon";
import { getAdminOrderPaymentStatus, mutateAdminResource } from "@/features/admin/api/admin.api";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminMetrics,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  useAdminResource,
} from "@/features/admin/components/admin-kit";
import {
  API_BASE_URL,
  formatMoney,
  localizedApiError,
  type AdminPaymentPage,
  type AdminPaymentStats,
  type Course,
  type Order,
  type OrderPaymentStatus,
  type Payment,
  type PaymentAccount,
  type UserProfile,
} from "@/lib/api-client";

const PAGE_SIZE = 25;

function shortId(prefix: string, id: string) {
  return `#${prefix}-${id.slice(0, 4).toUpperCase()}`;
}

function displayName(user?: UserProfile) {
  return user ? `${user.first_name} ${user.last_name ?? ""}`.trim() : "Noma’lum foydalanuvchi";
}

function contact(user?: UserProfile) {
  return user?.phone_number || user?.email || "Kontakt yo‘q";
}

function statusInfo(status: Payment["status"]) {
  if (status === "succeeded") return { label: "Tasdiqlangan", tone: "success" };
  if (status === "failed") return { label: "Rad etilgan", tone: "danger" };
  if (status === "cancelled" || status === "refunded") return { label: "Bekor qilingan", tone: "danger" };
  return { label: "Kutilmoqda", tone: "warning" };
}

function pageNumbers(current: number, total: number) {
  if (total <= 6) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  return [...values].filter((value) => value > 0 && value <= total).sort((a, b) => a - b);
}

export default function AdminPaymentsPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [status, setStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderPaymentStatus | null>(null);
  const [verified, setVerified] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createOrder, setCreateOrder] = useState<OrderPaymentStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ offset: String((page - 1) * PAGE_SIZE), limit: String(PAGE_SIZE) });
    if (deferredQuery) params.set("search", deferredQuery);
    if (status) params.set("status", status);
    if (dateFilter === "month") {
      const now = new Date();
      params.set("date_from", new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
      params.set("date_to", new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());
    }
    return `/admin/payments/page?${params.toString()}`;
  }, [dateFilter, deferredQuery, page, status]);

  const resource = useAdminResource<AdminPaymentPage>(listPath);
  const stats = useAdminResource<AdminPaymentStats>("/admin/payments/stats");
  const orders = useAdminResource<Order[]>("/admin/orders/?limit=100");
  const users = useAdminResource<UserProfile[]>("/admin/users/?limit=100");
  const courses = useAdminResource<Course[]>("/admin/courses/?limit=100");
  const accounts = useAdminResource<PaymentAccount[]>("/admin/payment-accounts/?limit=100&is_active=true");
  const rows = resource.data?.items ?? [];
  const total = resource.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const orderById = useMemo(() => new Map((orders.data ?? []).map((order) => [order.id, order])), [orders.data]);
  const userById = useMemo(() => new Map((users.data ?? []).map((user) => [user.id, user])), [users.data]);
  const courseById = useMemo(() => new Map((courses.data ?? []).map((course) => [course.id, course])), [courses.data]);
  const accountById = useMemo(() => new Map((accounts.data ?? []).map((account) => [account.id, account])), [accounts.data]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) closeDrawers();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [busy]);

  function context(payment: Payment) {
    const order = orderById.get(payment.order_id);
    return {
      order,
      user: order ? userById.get(order.user_id) : undefined,
      course: order ? courseById.get(order.course_id) : undefined,
      account: accountById.get(payment.payment_account_id),
    };
  }

  function closeDrawers() {
    setSelected(null);
    setSelectedOrder(null);
    setCreateOpen(false);
    setCreateOrder(null);
    setRejectMode(false);
    setVerified(false);
    setReason("");
    setError("");
  }

  async function reloadAll() {
    await Promise.all([resource.reload(), stats.reload(), orders.reload()]);
  }

  async function openPayment(payment: Payment) {
    setError("");
    setNotice("");
    setSelected(payment);
    setVerified(false);
    setRejectMode(false);
    try {
      setSelectedOrder(await getAdminOrderPaymentStatus<OrderPaymentStatus>(payment.order_id));
    } catch (value) {
      setError(localizedApiError(value, t));
    }
  }

  async function approve() {
    if (!selected || !verified) return;
    setBusy(true);
    setError("");
    try {
      await mutateAdminResource(`/admin/payments/${selected.id}/approve`, { method: "POST" });
      setNotice("To‘lov tasdiqlandi va tegishli kurs qismi ochildi.");
      closeDrawers();
      await reloadAll();
    } catch (value) {
      setError(localizedApiError(value, t, "errors.payment_approval"));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!selected || !reason.trim()) return;
    setBusy(true);
    setError("");
    try {
      await mutateAdminResource(`/admin/payments/${selected.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejection_reason: reason }),
      });
      setNotice("To‘lov rad etildi.");
      closeDrawers();
      await reloadAll();
    } catch (value) {
      setError(localizedApiError(value, t));
    } finally {
      setBusy(false);
    }
  }

  async function chooseCreateOrder(orderId: string) {
    setCreateOrder(null);
    if (!orderId) return;
    try {
      setCreateOrder(await getAdminOrderPaymentStatus<OrderPaymentStatus>(orderId));
    } catch (value) {
      setError(localizedApiError(value, t));
    }
  }

  async function createPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createOrder) return;
    const data = new FormData(event.currentTarget);
    const nextInstallment = createOrder.installments.find((item) => item.status !== "paid");
    const amount = nextInstallment?.amount ?? createOrder.order.agreed_total_amount ?? createOrder.order.amount;
    setBusy(true);
    setError("");
    try {
      await mutateAdminResource("/admin/payments/", {
        method: "POST",
        body: JSON.stringify({
          order_id: createOrder.order.id,
          installment_id: nextInstallment?.id ?? null,
          payment_account_id: data.get("payment_account_id"),
          amount,
          user_note: data.get("user_note") || null,
        }),
      });
      setNotice("To‘lov tekshirish uchun qayd etildi.");
      closeDrawers();
      await reloadAll();
    } catch (value) {
      setError(localizedApiError(value, t));
    } finally {
      setBusy(false);
    }
  }

  const selectedContext = selected ? context(selected) : null;
  const selectedInstallment = selectedOrder?.installments.find((item) => item.id === selected?.installment_id);
  const currentStage = selectedOrder?.access_stage ?? 0;
  const nextStage = selectedInstallment?.sequence ?? 3;
  const availableOrders = (orders.data ?? []).filter((order) => order.status === "pending" && order.plan_status === "assigned");
  const createInstallment = createOrder?.installments.find((item) => item.status !== "paid");
  const createAmount = createInstallment?.amount ?? createOrder?.order.agreed_total_amount ?? createOrder?.order.amount;

  return <>
    <AdminPageHeader
      eyebrow="TO‘LOV NAZORATI"
      title="To‘lovlar"
      subtitle="Bank o‘tkazmalarini qayd eting, tasdiqlang va kurs kirishini avtomatik yangilang."
      action={<button className="button button-primary admin-add-payment" type="button" onClick={() => setCreateOpen(true)}>＋ To‘lovni qayd etish</button>}
    />
    <AdminMetrics items={[
      { label: "Tasdiqlash kutilmoqda", value: String(stats.data?.pending ?? 0), hint: "Tekshirilmagan o‘tkazmalar", icon: "clock", tone: "warning" },
      { label: "Bugun tasdiqlangan", value: String(stats.data?.confirmed_today ?? 0), hint: "Bugungi operatsiyalar", icon: "check" },
      { label: "Rad etilgan", value: String(stats.data?.rejected ?? 0), hint: "Noto‘g‘ri o‘tkazmalar", icon: "shield", tone: "danger" },
      { label: "Bu oy", value: formatMoney(stats.data?.confirmed_month_amount ?? 0, stats.data?.currency ?? "UZS"), hint: "Tasdiqlangan summa", icon: "bag" },
    ]}/>

    <AdminPanel className="payments-filter-panel">
      <div className="payments-toolbar">
        <label className="payments-search"><AppIcon name="search" size={20}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="To‘lov yoki buyurtma raqami, foydalanuvchi"/></label>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Barcha holatlar</option><option value="pending">Kutilmoqda</option><option value="succeeded">Tasdiqlangan</option><option value="failed">Rad etilgan</option></select>
        <select value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }}><option value="">Barcha vaqt</option><option value="month">Bu oy</option></select>
        <button type="button" onClick={() => { setQuery(""); setStatus(""); setDateFilter(""); setPage(1); }}>Filtrlarni tozalash</button>
      </div>
    </AdminPanel>

    {error && <div className="admin-error"><p>{error}</p><button type="button" onClick={() => setError("")}>Yopish</button></div>}
    {notice && !selected && !createOpen && <div className="admin-success-message">{notice}</div>}
    {resource.loading || orders.loading || users.loading || courses.loading ? <AdminLoading/> : resource.error ? <AdminError message={resource.error} retry={() => void resource.reload()}/> : rows.length ? <AdminPanel className="payments-table-panel">
      <AdminTable headings={["To‘lov", "Buyurtma", "Foydalanuvchi", "Qism", "Hisob", "Summa", "Sana", "Holat", "Amallar"]} minWidth={1140}>
        {rows.map((payment) => {
          const item = context(payment);
          const info = statusInfo(payment.status);
          return <tr className={payment.status === "pending" ? "pending" : ""} key={payment.id}>
            <td><b>{shortId("PAY", payment.id)}</b></td>
            <td><b>{shortId("ORD", payment.order_id)}</b></td>
            <td><b>{displayName(item.user)}</b><small>{contact(item.user)}</small></td>
            <td>{payment.installment_id ? "Qismli to‘lov" : "To‘liq"}</td>
            <td><b>{item.account?.name ?? "—"}</b><small>{item.account?.last4 ? `•••• ${item.account.last4}` : ""}</small></td>
            <td><b>{formatMoney(payment.amount, payment.currency)}</b></td>
            <td>{new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(payment.created_at))}<small>{new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(payment.created_at))}</small></td>
            <td><span className={`payment-review-state ${info.tone}`}>{info.label}</span></td>
            <td><button className={`admin-row-button ${payment.status === "pending" ? "primary" : ""}`} type="button" onClick={() => void openPayment(payment)}>{payment.status === "pending" ? "Tekshirish" : "Ko‘rish"} →</button></td>
          </tr>;
        })}
      </AdminTable>
      <div className="payments-pagination"><b>Jami {total} ta to‘lov</b><div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</button>{pageNumbers(page, pageCount).map((value, index, values) => <span key={value}>{index > 0 && value - values[index - 1] > 1 && <i>…</i>}<button className={page === value ? "active" : ""} onClick={() => setPage(value)}>{value}</button></span>)}<button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>›</button></div></div>
    </AdminPanel> : <AdminPanel><AdminEmpty icon="receipt" title="To‘lov topilmadi" body="Tanlangan filtr bo‘yicha to‘lov mavjud emas."/></AdminPanel>}

    {(selected || createOpen) && <button className="admin-drawer-backdrop" type="button" aria-label="Panelni yopish" onClick={() => { if (!busy) closeDrawers(); }}/>} 

    {selected && selectedContext && <aside className="admin-drawer payment-review-drawer" role="dialog" aria-modal="true" aria-label="To‘lovni tekshirish">
      <header><div><span className="eyebrow">MANUAL TO‘LOV</span><h2>{selectedInstallment ? `${selectedInstallment.sequence}-qism to‘lovini tasdiqlash` : "To‘lovni tasdiqlash"}</h2><small>{shortId("PAY", selected.id)}　·　{shortId("ORD", selected.order_id)}</small></div><button type="button" aria-label="Yopish" onClick={closeDrawers}>×</button></header>
      <div className="payment-review-summary"><span>{selectedContext.user?.first_name?.[0] ?? "?"}</span><div><b>{displayName(selectedContext.user)}</b><small>{contact(selectedContext.user)}</small></div><div><small>Kurs</small><b>{selectedContext.course?.title ?? "Noma’lum kurs"}</b><small>Reja: {selectedContext.order?.payment_mode === "installment_3" ? "3 qismli" : "to‘liq"}</small></div></div>
      {error && <div className="admin-error"><p>{error}</p></div>}
      <section className="payment-transfer-card"><h3>O‘tkazma ma’lumotlari</h3><dl><div><dt>To‘langan summa</dt><dd>{formatMoney(selected.amount, selected.currency)}</dd></div><div><dt>To‘lov hisobi</dt><dd>{selectedContext.account?.name ?? "—"}　·　•••• {selectedContext.account?.last4 ?? ""}</dd></div><div><dt>To‘lovchi</dt><dd>{displayName(selectedContext.user).toUpperCase()}</dd></div><div><dt>Yuborilgan sana va vaqt</dt><dd>{new Date(selected.created_at).toLocaleString("uz-UZ")}</dd></div><div><dt>Izoh</dt><dd>{selected.user_note ?? "Izoh qo‘shilmagan"}</dd></div></dl>{selected.receipt_file_key && <a className="payment-receipt-link" href={`${API_BASE_URL}/admin/payments/${selected.id}/receipt`} target="_blank" rel="noreferrer">▧ To‘lov chekini ko‘rish　↗</a>}</section>
      <section className="payment-result-card"><h3>Tasdiqlash natijasi</h3><div className="payment-stage-comparison"><div><small>HOZIR</small>{[1,2,3].map((stage) => <span className={stage <= currentStage ? "open" : ""} key={stage}>{stage}-qism <b>{stage <= currentStage ? "OCHIQ" : "YOPIQ"}</b></span>)}</div><strong>→</strong><div><small>TASDIQLANGACH</small>{[1,2,3].map((stage) => <span className={stage <= Math.max(currentStage, nextStage) ? "open" : ""} key={stage}>{stage}-qism <b>{stage <= Math.max(currentStage, nextStage) ? "OCHIQ" : "YOPIQ"}</b></span>)}</div></div><div className="payment-result-progress"><b>{currentStage}/3 → {Math.max(currentStage, nextStage)}/3 to‘langan</b><span>Qolgan summa　{formatMoney(selectedOrder?.remaining_amount ?? 0, selected.currency)}</span></div><p>ⓘ Tasdiqlash bir tranzaksiyada Payment, installment va Enrollment kirishini yangilaydi.</p></section>
      {selected.status === "pending" && <><label className="payment-verified-check"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)}/> Bank o‘tkazmasini tekshirdim va summa to‘g‘ri.</label>{rejectMode && <label className="payment-reject-reason">Rad etish sababi<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Foydalanuvchiga tushunarli sabab yozing…"/></label>}<div className="payment-review-actions"><button className="button danger" type="button" disabled={busy} onClick={() => setRejectMode(true)}>Rad etish</button><button className="button button-ghost" type="button" disabled={busy} onClick={closeDrawers}>Bekor qilish</button>{rejectMode ? <button className="button danger" type="button" disabled={busy || !reason.trim()} onClick={() => void reject()}>Rad etishni tasdiqlash</button> : <button className="button button-primary" type="button" disabled={busy || !verified || !selectedOrder} onClick={() => void approve()}>Tasdiqlash va {nextStage}-qismni ochish →</button>}</div></>}
      {selected.rejection_reason && <div className="admin-danger-box"><b>Rad etish sababi</b><p>{selected.rejection_reason}</p></div>}
      <p className="payment-audit-note">Amal admin nomidan bajariladi, vaqt va izoh audit jurnaliga yoziladi.</p>
    </aside>}

    {createOpen && <aside className="admin-drawer create-payment-drawer" role="dialog" aria-modal="true" aria-label="To‘lovni qayd etish"><header><div><span className="eyebrow">MANUAL TO‘LOV</span><h2>To‘lovni qayd etish</h2></div><button type="button" aria-label="Yopish" onClick={closeDrawers}>×</button></header>{error && <div className="admin-error"><p>{error}</p></div>}<form className="admin-drawer-form" onSubmit={createPayment}><label>Buyurtma<select required defaultValue="" onChange={(event) => void chooseCreateOrder(event.target.value)}><option value="">Buyurtmani tanlang</option>{availableOrders.map((order) => { const user = userById.get(order.user_id); const course = courseById.get(order.course_id); return <option key={order.id} value={order.id}>{shortId("ORD", order.id)} · {displayName(user)} · {course?.title}</option>; })}</select></label>{createOrder && <div className="create-payment-summary"><span>{createInstallment ? `${createInstallment.sequence}-qism` : "To‘liq to‘lov"}</span><b>{formatMoney(createAmount ?? 0, createOrder.order.currency)}</b></div>}<label>To‘lov hisobi<select name="payment_account_id" required defaultValue={createOrder?.order.assigned_payment_account_id ?? ""}><option value="">Hisobni tanlang</option>{(accounts.data ?? []).map((account) => <option key={account.id} value={account.id}>{account.name} · •••• {account.last4}</option>)}</select></label><label>Izoh<textarea name="user_note" rows={3} placeholder="Bank o‘tkazmasi yoki kelishuv haqida izoh…"/></label><button className="button button-primary" disabled={busy || !createOrder}>{busy ? "Qayd etilmoqda…" : "Tekshirish uchun qayd etish →"}</button></form></aside>}
  </>;
}

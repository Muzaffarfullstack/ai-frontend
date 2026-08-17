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
  formatMoney,
  localizedApiError,
  type AdminOrderPage,
  type AdminOrderStats,
  type Course,
  type Order,
  type OrderPaymentStatus,
  type PaymentAccount,
  type PaymentMode,
  type UserProfile,
} from "@/lib/api-client";

const PAGE_SIZE = 25;

function userName(user?: UserProfile) {
  return user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "Noma’lum foydalanuvchi";
}

function userContact(user?: UserProfile) {
  return user?.phone_number || user?.email || "Kontakt kiritilmagan";
}

function shortOrderId(id: string) {
  return `#ORD-${id.slice(0, 4).toUpperCase()}`;
}

function inputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, count: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + count);
  return copy;
}

function orderStatus(order: Order) {
  if (order.status === "paid") return { label: "Yakunlangan", tone: "success" };
  if (order.status === "cancelled") return { label: "Bekor qilingan", tone: "danger" };
  if (order.status === "expired") return { label: "Muddati o‘tgan", tone: "danger" };
  if (order.status === "refunded") return { label: "Qaytarilgan", tone: "danger" };
  if (order.plan_status === "unassigned") return { label: "Reja kutilmoqda", tone: "warning" };
  return { label: "Jarayonda", tone: "info" };
}

function planLabel(order: Order) {
  if (order.plan_status === "unassigned") return "Reja biriktirilmagan";
  return order.payment_mode === "installment_3" ? "3 qism" : "To‘liq";
}

function pageNumbers(current: number, total: number) {
  if (total <= 6) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  return [...values].filter((value) => value > 0 && value <= total).sort((a, b) => a - b);
}

export default function AdminOrdersPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [courseFilter, setCourseFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OrderPaymentStatus | null>(null);
  const [mode, setMode] = useState<PaymentMode>("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ offset: String((page - 1) * PAGE_SIZE), limit: String(PAGE_SIZE) });
    if (deferredQuery) params.set("search", deferredQuery);
    if (courseFilter) params.set("course_id", courseFilter);
    if (planFilter === "unassigned") params.set("plan_status", "unassigned");
    if (planFilter === "full" || planFilter === "installment_3") params.set("payment_mode", planFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter === "month") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      params.set("date_from", start.toISOString());
      params.set("date_to", end.toISOString());
    }
    return `/admin/orders/page?${params.toString()}`;
  }, [courseFilter, dateFilter, deferredQuery, page, planFilter, statusFilter]);

  const resource = useAdminResource<AdminOrderPage>(listPath);
  const stats = useAdminResource<AdminOrderStats>("/admin/orders/stats");
  const users = useAdminResource<UserProfile[]>("/admin/users/?limit=100");
  const courses = useAdminResource<Course[]>("/admin/courses/?limit=100");
  const accounts = useAdminResource<PaymentAccount[]>("/admin/payment-accounts/?limit=100&is_active=true");
  const orders = resource.data?.items ?? [];
  const total = resource.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userById = useMemo(() => new Map((users.data ?? []).map((user) => [user.id, user])), [users.data]);
  const courseById = useMemo(() => new Map((courses.data ?? []).map((course) => [course.id, course])), [courses.data]);
  const activeFilters = [courseFilter, planFilter, statusFilter, dateFilter].filter(Boolean).length;

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        setSelected(null);
        setCreateOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [busy]);

  async function reloadOrders() {
    await Promise.all([resource.reload(), stats.reload()]);
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await mutateAdminResource("/admin/orders/", {
        method: "POST",
        body: JSON.stringify({ user_id: data.get("user_id"), course_id: data.get("course_id") }),
      });
      setCreateOpen(false);
      setNotice("Buyurtma yaratildi. Endi unga to‘lov rejasini biriktirishingiz mumkin.");
      await reloadOrders();
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function open(order: Order) {
    setError("");
    setNotice("");
    try {
      const detail = await getAdminOrderPaymentStatus<OrderPaymentStatus>(order.id);
      setSelected(detail);
      setMode(detail.order.payment_mode ?? "installment_3");
    } catch (reason) {
      setError(localizedApiError(reason, t));
    }
  }

  async function refreshSelected(orderId: string) {
    const detail = await getAdminOrderPaymentStatus<OrderPaymentStatus>(orderId);
    setSelected(detail);
    await reloadOrders();
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    const agreed = selected.order.amount;
    const installments = mode === "installment_3"
      ? [1, 2, 3].map((sequence) => ({
          sequence,
          amount: String(data.get(`amount_${sequence}`)),
          due_date: String(data.get(`due_${sequence}`)),
        }))
      : [];
    setBusy(true);
    setError("");
    try {
      await mutateAdminResource(`/admin/orders/${selected.order.id}/assign-payment-plan`, {
        method: "POST",
        body: JSON.stringify({
          payment_mode: mode,
          payment_account_id: data.get("payment_account_id"),
          agreed_total_amount: agreed,
          installments,
          agreement_note: data.get("agreement_note") || null,
          notify_user: data.get("notify_user") === "on",
        }),
      });
      setNotice("To‘lov rejasi muvaffaqiyatli biriktirildi.");
      await refreshSelected(selected.order.id);
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(sequence?: number) {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const path = sequence
        ? `/admin/orders/${selected.order.id}/installments/${sequence}/mark-paid`
        : `/admin/orders/${selected.order.id}/mark-full-paid`;
      await mutateAdminResource(path, { method: "POST" });
      setNotice("To‘lov tasdiqlandi va kursga tegishli kirish ochildi.");
      await refreshSelected(selected.order.id);
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  function clearFilters() {
    setPage(1);
    setQuery("");
    setCourseFilter("");
    setPlanFilter("");
    setStatusFilter("");
    setDateFilter("");
  }

  const selectedUser = selected ? userById.get(selected.order.user_id) : undefined;
  const selectedCourse = selected ? courseById.get(selected.order.course_id) : undefined;
  const defaultAccount = (accounts.data ?? []).find((account) => account.is_default) ?? accounts.data?.[0];
  const totalAmount = selected ? Math.round(Number(selected.order.amount)) : 0;
  const basePart = Math.floor(totalAmount / 3);
  const installmentAmounts = [basePart, basePart, totalAmount - basePart * 2];
  const today = new Date();

  return (
    <>
      <AdminPageHeader
        eyebrow="BUYURTMA BOSHQARUVI"
        title="Buyurtmalar"
        subtitle="Kurs so‘rovlariga to‘lov rejasini biriktiring va keyingi jarayonni kuzating."
        action={<button className="button button-primary admin-add-order" type="button" onClick={() => setCreateOpen(true)}>＋ Buyurtma yaratish</button>}
      />
      <AdminMetrics items={[
        { label: "Jami", value: String(stats.data?.total_orders ?? 0), hint: "Barcha buyurtmalar", icon: "bag" },
        { label: "Reja kutilmoqda", value: String(stats.data?.awaiting_plan ?? 0), hint: "Reja biriktirilmagan", icon: "clock", tone: "warning" },
        { label: "To‘lov jarayonida", value: String(stats.data?.in_payment ?? 0), hint: "Faol to‘lov rejasi", icon: "receipt" },
        { label: "Yakunlangan", value: String(stats.data?.completed ?? 0), hint: "To‘liq to‘langan", icon: "check" },
      ]} />

      <AdminPanel className="orders-filter-panel">
        <div className="orders-toolbar">
          <label className="orders-search"><AppIcon name="search" size={20}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buyurtma raqami, ism yoki telefon" /></label>
          <select value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setPage(1); }} aria-label="Kurs"><option value="">Barcha kurslar</option>{(courses.data ?? []).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
          <select value={planFilter} onChange={(event) => { setPlanFilter(event.target.value); setPage(1); }} aria-label="To‘lov rejasi"><option value="">Barcha rejalar</option><option value="unassigned">Reja kutilmoqda</option><option value="full">To‘liq to‘lov</option><option value="installment_3">3 qismli to‘lov</option></select>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Holat"><option value="">Barcha holatlar</option><option value="pending">Jarayonda</option><option value="paid">Yakunlangan</option><option value="cancelled">Bekor qilingan</option><option value="expired">Muddati o‘tgan</option></select>
          <select value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} aria-label="Sana"><option value="">Barcha vaqt</option><option value="month">Bu oy</option></select>
        </div>
        {activeFilters > 0 && <div className="orders-active-filter"><b>Faol filtrlar:</b><span>{activeFilters} ta filtr</span><button type="button" onClick={clearFilters}>Tozalash</button></div>}
      </AdminPanel>

      {error && <div className="admin-error"><p>{error}</p><button type="button" onClick={() => setError("")}>Yopish</button></div>}
      {notice && !selected && <div className="admin-success-message">{notice}</div>}
      {resource.loading ? <AdminLoading /> : resource.error ? (
        <AdminError message={resource.error} retry={() => void resource.reload()} />
      ) : orders.length ? (
        <AdminPanel className="orders-table-panel">
          <AdminTable headings={["Buyurtma", "Foydalanuvchi", "Kurs", "Narx", "To‘lov rejasi", "To‘langan", "Keyingi to‘lov", "Holat", "Amallar"]} minWidth={1220}>
            {orders.map((order) => {
              const user = userById.get(order.user_id);
              const course = courseById.get(order.course_id);
              const target = Number(order.agreed_total_amount ?? order.amount);
              const paid = Number(order.paid_amount);
              const progress = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : 100;
              const state = orderStatus(order);
              return <tr key={order.id}>
                <td><b>{shortOrderId(order.id)}</b></td>
                <td><b>{userName(user)}</b><small>{userContact(user)}</small></td>
                <td><b>{course?.title ?? "Noma’lum kurs"}</b></td>
                <td><b>{formatMoney(order.amount, order.currency)}</b></td>
                <td><span className={`order-plan ${order.plan_status === "unassigned" ? "warning" : order.payment_mode === "installment_3" ? "info" : "success"}`}>{planLabel(order)}</span></td>
                <td><b>{formatMoney(order.paid_amount, order.currency)}</b><div className="order-payment-progress"><i style={{ width: `${progress}%` }}/></div><small>{progress}%</small></td>
                <td>{order.status === "paid" || order.plan_status === "unassigned" ? "—" : "Reja bo‘yicha"}</td>
                <td><span className={`order-state ${state.tone}`}>{state.label}</span></td>
                <td><button className={`admin-row-button ${order.plan_status === "unassigned" ? "primary" : ""}`} type="button" onClick={() => void open(order)}>{order.plan_status === "unassigned" ? "Reja tuzish" : "Ochish"} <span>→</span></button></td>
              </tr>;
            })}
          </AdminTable>
          <div className="orders-pagination"><b>Jami {total} ta buyurtma</b><div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</button>{pageNumbers(page, pageCount).map((value, index, values) => <span key={value}>{index > 0 && value - values[index - 1] > 1 && <i>…</i>}<button className={page === value ? "active" : ""} onClick={() => setPage(value)}>{value}</button></span>)}<button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>›</button></div></div>
        </AdminPanel>
      ) : <AdminPanel><AdminEmpty icon="bag" title="Buyurtmalar topilmadi" body="Filtrlarni tozalang yoki yangi buyurtma yarating." /></AdminPanel>}

      {(selected || createOpen) && <button className="admin-drawer-backdrop" type="button" aria-label="Panelni yopish" onClick={() => { if (!busy) { setSelected(null); setCreateOpen(false); } }} />}

      {selected && <aside className="admin-drawer order-plan-drawer" role="dialog" aria-modal="true" aria-label="Buyurtmaga to‘lov rejasini biriktirish">
        <header><div><span className="eyebrow">TO‘LOV REJASI</span><h2>{selected.order.plan_status === "unassigned" ? "Buyurtmaga reja biriktirish" : "Buyurtma tafsilotlari"}</h2><small>{shortOrderId(selected.order.id)}</small></div><button type="button" aria-label="Yopish" onClick={() => setSelected(null)}>×</button></header>
        <div className="order-drawer-summary"><span>{selectedUser?.first_name?.[0] ?? "?"}</span><div><b>{userName(selectedUser)}</b><small>{userContact(selectedUser)}</small></div><div><b>{selectedCourse?.title ?? "Noma’lum kurs"}</b><small>Kurs</small></div><div><b>{formatMoney(selected.order.amount, selected.order.currency)}</b><small>Kurs narxi</small></div></div>
        {error && <div className="admin-error"><p>{error}</p></div>}
        {notice && <div className="admin-success-message">{notice}</div>}
        {selected.order.plan_status === "unassigned" ? <form className="order-plan-form" onSubmit={assign}>
          <div className="order-warning">△ Reja biriktirilmaguncha to‘lov qayd etib bo‘lmaydi va kurs ochilmaydi.</div>
          <section><h3>To‘lov usulini tanlang</h3><div className="order-mode-grid">
            <button className={mode === "full" ? "selected" : ""} type="button" onClick={() => setMode("full")}><i>▣</i><span><b>To‘liq to‘lov</b><small>{formatMoney(selected.order.amount, selected.order.currency)} · bir marta</small><em>Tasdiqlangach kursning barcha 3 qismi ochiladi.</em></span></button>
            <button className={mode === "installment_3" ? "selected" : ""} type="button" onClick={() => setMode("installment_3")}><i>▦</i><span><b>3 qismli to‘lov</b><small>{formatMoney(String(installmentAmounts[0]), selected.order.currency)} × 3</small><em>Har tasdiqlangan to‘lovdan keyin navbatdagi kurs qismi ochiladi.</em></span></button>
          </div></section>
          {mode === "installment_3" && <section key={`${selected.order.id}-${mode}`}><h3>3 qismli jadval</h3><div className="order-installment-table"><div className="head"><span>Qism</span><span>To‘lov summasi</span><span>To‘lov muddati</span><span>Ochiladigan qism</span></div>{[1, 2, 3].map((sequence) => <div className="row" key={sequence}><b>{sequence}-qism</b><label><input name={`amount_${sequence}`} type="number" min="1" required defaultValue={installmentAmounts[sequence - 1]} /><span>UZS</span></label><input name={`due_${sequence}`} type="date" required defaultValue={inputDate(addMonths(today, sequence - 1))}/><em>{sequence}-qism ochiladi</em></div>)}<footer><b>Jami&nbsp; {formatMoney(selected.order.amount, selected.order.currency)}</b><span>✓ Kurs narxiga teng</span></footer></div></section>}
          <section><h3>To‘lov uchun ko‘rsatiladigan hisob</h3><div className="order-account-card"><span>▤</span><select name="payment_account_id" required defaultValue={defaultAccount?.id ?? ""}><option value="">Faol hisobni tanlang</option>{(accounts.data ?? []).map((account) => <option key={account.id} value={account.id}>{account.name} · {account.card_number} · {account.card_holder_name}</option>)}</select></div></section>
          <section><h3>Admin izohi</h3><textarea name="agreement_note" rows={3} placeholder="Kelishuv yoki maxsus shartlar…" defaultValue={selected.order.agreement_note ?? ""}/></section>
          <label className="order-notify"><input name="notify_user" type="checkbox" defaultChecked /> Foydalanuvchiga reja tayyor bo‘lgani haqida xabar yuborish</label>
          <div className="order-drawer-actions"><button className="button button-ghost" type="button" disabled={busy} onClick={() => setSelected(null)}>Bekor qilish</button><button className="button button-primary" disabled={busy || accounts.loading || !defaultAccount}>{busy ? "Saqlanmoqda…" : "Rejani biriktirish →"}</button></div>
          <p className="order-drawer-note">Reja saqlanadi, lekin hech qanday qism to‘lov tasdiqlanmaguncha ochilmaydi.</p>
        </form> : <div className="assigned-order-view">
          <dl><div><dt>Reja</dt><dd>{planLabel(selected.order)}</dd></div><div><dt>To‘langan</dt><dd>{formatMoney(selected.order.paid_amount, selected.order.currency)}</dd></div><div><dt>Qolgan</dt><dd>{formatMoney(selected.remaining_amount, selected.order.currency)}</dd></div><div><dt>Kirish bosqichi</dt><dd>{selected.access_stage} / 3</dd></div></dl>
          {selected.order.payment_mode === "installment_3" ? <div className="admin-installment-list">{selected.installments.map((item) => <article key={item.id}><div><b>{item.sequence}-to‘lov · {formatMoney(item.amount, selected.order.currency)}</b><small>{item.due_date ?? "Muddat belgilanmagan"}</small></div><span className={`order-state ${item.status === "paid" ? "success" : item.status === "overdue" ? "danger" : "warning"}`}>{item.status === "paid" ? "To‘langan" : item.status === "overdue" ? "Kechikkan" : "Kutilmoqda"}</span>{item.status !== "paid" && <button type="button" disabled={busy} onClick={() => void markPaid(item.sequence)}>Tasdiqlash</button>}</article>)}</div> : selected.order.status !== "paid" && <button className="button button-primary admin-drawer-primary" disabled={busy} onClick={() => void markPaid()}>To‘liq to‘lovni tasdiqlash</button>}
        </div>}
      </aside>}

      {createOpen && <aside className="admin-drawer create-order-drawer" role="dialog" aria-modal="true" aria-label="Buyurtma yaratish"><header><div><span className="eyebrow">YANGI BUYURTMA</span><h2>Buyurtma yaratish</h2></div><button type="button" aria-label="Yopish" onClick={() => setCreateOpen(false)}>×</button></header><div className="admin-info-box">Mavjud foydalanuvchi va kursni tanlang. To‘lov rejasi buyurtma yaratilgandan keyin alohida biriktiriladi.</div>{error && <div className="admin-error"><p>{error}</p></div>}<form className="admin-drawer-form" onSubmit={createOrder}><label>Foydalanuvchi<select name="user_id" required defaultValue=""><option value="">Tanlang</option>{(users.data ?? []).filter((user) => user.is_active).map((user) => <option value={user.id} key={user.id}>{userName(user)} · {userContact(user)}</option>)}</select></label><label>Kurs<select name="course_id" required defaultValue=""><option value="">Tanlang</option>{(courses.data ?? []).filter((course) => course.status === "published").map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label><button className="button button-primary" disabled={busy}>{busy ? "Yaratilmoqda…" : "Buyurtmani yaratish →"}</button></form></aside>}
    </>
  );
}

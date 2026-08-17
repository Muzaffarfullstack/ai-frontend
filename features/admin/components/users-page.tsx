"use client";

import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers";
import { AppIcon } from "@/components/ui/app-icon";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import {
  AdminConfirmDialog,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminMetrics,
  AdminPageHeader,
  AdminPanel,
  useAdminResource,
} from "@/features/admin/components/admin-kit";
import {
  localizedApiError,
  parseContact,
  type AdminUserDetail,
  type AdminUserPage,
  type AdminUserStats,
  type Course,
  type Enrollment,
  type Order,
  type UserProfile,
  type UserRole,
} from "@/lib/api-client";

type UserRow = UserProfile & { last_login_at?: string | null };
type UserTab = "general" | "courses" | "payments" | "activity";
type PendingState = { value: boolean } | null;

const PAGE_SIZE = 25;

function displayName(user: UserProfile) {
  return `${user.first_name} ${user.last_name ?? ""}`.trim();
}

function initials(user: UserProfile) {
  return `${user.first_name[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
}

function roleLabel(role: UserRole) {
  return role === "admin" ? "Admin" : role === "mentor" ? "Mentor" : "O‘quvchi";
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value))
    : "Ma’lumot yo‘q";
}

function relativeTime(value?: string | null) {
  if (!value) return "Kirmagan";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Hozir online";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
}

function paymentInfo(orders: Order[]) {
  if (!orders.length) return { label: "Buyurtma yo‘q", tone: "neutral" };
  const paid = orders.find((order) => order.status === "paid");
  if (paid) return { label: "To‘liq to‘langan", tone: "success" };
  const partial = orders.find((order) => Number(order.paid_amount) > 0);
  if (partial) return { label: "Qisman to‘langan", tone: "warning" };
  return { label: "To‘lov kutilmoqda", tone: "warning" };
}

function userIsVerified(user: UserProfile) {
  return Boolean(user.email_verified_at || user.phone_verified_at);
}

export default function AdminUsersPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [role, setRole] = useState("");
  const [state, setState] = useState("");
  const [verification, setVerification] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<AdminUserDetail | null>(null);
  const [tab, setTab] = useState<UserTab>("general");
  const [draftRole, setDraftRole] = useState<UserRole>("user");
  const [draftActive, setDraftActive] = useState(true);
  const [pendingState, setPendingState] = useState<PendingState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const listPath = useMemo(() => {
    const params = new URLSearchParams({ offset: String((page - 1) * PAGE_SIZE), limit: String(PAGE_SIZE) });
    if (deferredQuery) params.set("search", deferredQuery);
    if (role) params.set("role", role);
    if (state) params.set("is_active", String(state === "active"));
    if (verification) params.set("is_verified", String(verification === "verified"));
    return `/admin/users/page?${params.toString()}`;
  }, [deferredQuery, page, role, state, verification]);

  const resource = useAdminResource<AdminUserPage>(listPath);
  const stats = useAdminResource<AdminUserStats>("/admin/users/stats");
  const enrollments = useAdminResource<Enrollment[]>("/admin/enrollments/?limit=100");
  const orders = useAdminResource<Order[]>("/admin/orders/?limit=100");
  const courses = useAdminResource<Course[]>("/admin/courses/?limit=100");
  const rows = resource.data?.items ?? [];
  const total = resource.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        setSelected(null);
        setCreateOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy]);

  const selectedEnrollments = selected
    ? (enrollments.data ?? []).filter((item) => item.user_id === selected.id)
    : [];
  const selectedOrders = selected
    ? (orders.data ?? []).filter((item) => item.user_id === selected.id)
    : [];
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course]));
  const profileFields = selected
    ? [selected.first_name, selected.last_name, selected.phone_number, selected.email].filter(Boolean).length
    : 0;
  const profilePercent = Math.round((profileFields / 4) * 100);

  function selectUser(user: AdminUserDetail) {
    setSelected(user);
    setDraftRole(user.role);
    setDraftActive(user.is_active);
  }

  async function openUser(user: UserRow) {
    setError("");
    setNotice("");
    setTab("general");
    try {
      selectUser(await mutateAdminResource<AdminUserDetail>(`/admin/users/${user.id}`, { method: "GET" }));
    } catch (reason) {
      setError(localizedApiError(reason, t));
    }
  }

  async function reloadUsers() {
    await Promise.all([resource.reload(), stats.reload()]);
  }

  async function saveUser() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await mutateAdminResource<AdminUserDetail>(`/admin/users/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: draftRole, is_active: draftActive }),
      });
      selectUser(updated);
      setNotice("O‘zgarishlar saqlandi.");
      await reloadUsers();
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function applyStateChange() {
    if (!selected || !pendingState) return;
    setBusy(true);
    setError("");
    try {
      const updated = await mutateAdminResource<AdminUserDetail>(`/admin/users/${selected.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: pendingState.value }),
      });
      selectUser(updated);
      setPendingState(null);
      await reloadUsers();
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function revokeSessions() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      selectUser(await mutateAdminResource<AdminUserDetail>(`/admin/users/${selected.id}/sessions/revoke`, { method: "POST" }));
      setNotice("Foydalanuvchi barcha sessiyalardan chiqarildi.");
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    if (!selected) return;
    const contact = selected.email ? { email: selected.email } : selected.phone_number ? { phone_number: selected.phone_number } : null;
    if (!contact) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await mutateAdminResource("/auth/forgot-password", { method: "POST", body: JSON.stringify(contact) });
      setNotice("Parolni tiklash kodi yuborildi.");
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const created = await mutateAdminResource<AdminUserDetail>("/admin/users/", {
        method: "POST",
        body: JSON.stringify({
          first_name: String(data.get("first_name") ?? ""),
          last_name: String(data.get("last_name") ?? "") || null,
          ...parseContact(String(data.get("contact") ?? "")),
          password: String(data.get("password") ?? ""),
          role: String(data.get("role") ?? "user"),
          is_active: true,
        }),
      });
      form.reset();
      setCreateOpen(false);
      selectUser(created);
      setNotice("Foydalanuvchi qo‘shildi.");
      await reloadUsers();
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setRole("");
    setState("");
    setVerification("");
    setPage(1);
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? rows.map((user) => user.id) : []);
  }

  const visiblePages = Array.from(new Set([1, page - 1, page, page + 1, pageCount]))
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  return <>
    <AdminPageHeader
      eyebrow="FOYDALANUVCHI BOSHQARUVI"
      title="Foydalanuvchilar"
      subtitle="Hisoblar, rollar, tasdiqlash va kursga kirish holatini boshqaring."
      action={<button className="button button-primary admin-add-user" onClick={() => { setError(""); setCreateOpen(true); }}>+ Foydalanuvchi qo‘shish</button>}
    />

    <AdminMetrics items={[
      { label: "Jami", value: String(stats.data?.total_users ?? 0), hint: "Barcha foydalanuvchilar", icon: "user" },
      { label: "Faol", value: String(stats.data?.active_users ?? 0), hint: "Faol foydalanuvchilar", icon: "check" },
      { label: "Tasdiqlanmagan", value: String(stats.data?.unverified_users ?? 0), hint: "Tasdiqlash kutilmoqda", icon: "clock", tone: "warning" },
      { label: "Bloklangan", value: String(stats.data?.blocked_users ?? 0), hint: "Bloklangan hisoblar", icon: "shield", tone: "danger" },
    ]}/>

    <AdminPanel className="admin-toolbar-v2 users-toolbar">
      <label className="users-search"><AppIcon name="search" size={20}/><input aria-label="Foydalanuvchini qidirish" placeholder="Ism, email yoki telefon bo‘yicha qidiring" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}/></label>
      <select aria-label="Rol" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">Barcha rollar</option><option value="user">O‘quvchi</option><option value="mentor">Mentor</option><option value="admin">Admin</option></select>
      <select aria-label="Holat" value={state} onChange={(event) => { setState(event.target.value); setPage(1); }}><option value="">Barcha holatlar</option><option value="active">Faol</option><option value="blocked">Bloklangan</option></select>
      <select aria-label="Tasdiqlash" value={verification} onChange={(event) => { setVerification(event.target.value); setPage(1); }}><option value="">Tasdiqlash</option><option value="verified">Tasdiqlangan</option><option value="unverified">Tasdiqlanmagan</option></select>
      <button onClick={resetFilters}>Filtrlarni tozalash</button>
    </AdminPanel>

    {error && !selected && !createOpen && <div className="admin-error"><p>{error}</p></div>}
    {resource.loading ? <AdminLoading/> : resource.error ? <AdminError message={resource.error} retry={() => void resource.reload()}/> : rows.length ? <AdminPanel className="users-table-panel">
      <div className="admin-table-wrap"><table className="admin-table users-table"><thead><tr>
        <th><input aria-label="Barchasini tanlash" type="checkbox" checked={rows.length > 0 && rows.every((user) => selectedIds.includes(user.id))} onChange={(event) => toggleAll(event.target.checked)}/></th>
        <th>Foydalanuvchi</th><th>Kontakt</th><th>Rol</th><th>Kurslar</th><th>To‘lov holati</th><th>Oxirgi faollik</th><th>Holat</th><th>Amallar</th>
      </tr></thead><tbody>{rows.map((user) => {
        const userEnrollments = (enrollments.data ?? []).filter((item) => item.user_id === user.id && item.status === "active");
        const userOrders = (orders.data ?? []).filter((item) => item.user_id === user.id);
        const payment = paymentInfo(userOrders);
        const verified = userIsVerified(user);
        return <tr key={user.id}>
          <td><input aria-label={`${displayName(user)}ni tanlash`} type="checkbox" checked={selectedIds.includes(user.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))}/></td>
          <td><button className="user-identity" onClick={() => void openUser(user)}><span>{initials(user)}</span><b>{displayName(user)}</b></button></td>
          <td>{user.email ?? user.phone_number ?? "Kontakt yo‘q"}</td>
          <td><span className={`user-role role-${user.role}`}>{roleLabel(user.role)}</span></td>
          <td>{userEnrollments.length} kurs</td>
          <td><span className={`payment-pill ${payment.tone}`}>{payment.label}</span></td>
          <td><span className={relativeTime(user.last_login_at) === "Hozir online" ? "online-time" : ""}>{relativeTime(user.last_login_at)}</span></td>
          <td><span className={`user-state ${!user.is_active ? "blocked" : verified ? "active" : "unverified"}`}>{!user.is_active ? "Bloklangan" : verified ? "Faol" : "Tasdiqlanmagan"}</span></td>
          <td><button className="admin-row-button" onClick={() => void openUser(user)}>Boshqarish <AppIcon name="arrow" size={15}/></button></td>
        </tr>;
      })}</tbody></table></div>
    </AdminPanel> : <AdminPanel><AdminEmpty icon="user" title="Foydalanuvchi topilmadi" body="Filtrlarni o‘zgartirib qayta urinib ko‘ring."/></AdminPanel>}

    <div className="users-pagination"><span>{total ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} / ${total}` : "0 / 0"}</span><div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>←</button>{visiblePages.map((value, index) => <span key={value}>{index > 0 && value - visiblePages[index - 1] > 1 && <i>…</i>}<button className={value === page ? "active" : ""} onClick={() => setPage(value)}>{value}</button></span>)}<button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>→</button></div></div>

    {selected && <><button className="admin-drawer-backdrop" aria-label="Profilni yopish" onClick={() => setSelected(null)}/><aside className="admin-drawer admin-user-drawer" role="dialog" aria-modal="true" aria-labelledby="user-drawer-title">
      <header><h2 id="user-drawer-title">Foydalanuvchi profili</h2><button aria-label="Yopish" onClick={() => setSelected(null)}>×</button></header>
      <div className="admin-drawer-profile"><span>{initials(selected)}</span><div><h3>{displayName(selected)}</h3><p>{selected.phone_number ?? "Telefon yo‘q"}<br/>{selected.email ?? "Email yo‘q"}</p></div><div className="drawer-profile-pills"><span className={`user-role role-${selected.role}`}>{roleLabel(selected.role)}</span><span className={`user-state ${selected.is_active ? "active" : "blocked"}`}>{selected.is_active ? "Faol" : "Bloklangan"}</span></div></div>
      <nav className="user-drawer-tabs" aria-label="Profil bo‘limlari">{(["general", "courses", "payments", "activity"] as UserTab[]).map((value) => <button className={tab === value ? "active" : ""} key={value} onClick={() => setTab(value)}>{value === "general" ? "Umumiy" : value === "courses" ? "Kurslar" : value === "payments" ? "To‘lovlar" : "Faollik"}</button>)}</nav>
      {error && <div className="admin-error"><p>{error}</p></div>}{notice && <div className="admin-success-message">{notice}</div>}

      {tab === "general" && <>
        <dl className="user-overview-grid"><div><dt>Ro‘yxatdan o‘tgan:</dt><dd>{formatDate(selected.created_at)}</dd></div><div><dt>Oxirgi kirish:</dt><dd>{relativeTime(selected.last_login_at)}</dd></div><div><dt>Qurilma:</dt><dd>{selected.session_user_agent?.split(" ").slice(0, 2).join(" ") || selected.session_device || "Ma’lumot yo‘q"}</dd></div><div><dt>Profil to‘liqligi:</dt><dd>{profilePercent}% <i><span style={{ width: `${profilePercent}%` }}/></i></dd></div></dl>
        <section className="user-drawer-section"><h3>Rol va hisob holati</h3><div className="role-status-card"><label>Rol<select value={draftRole} onChange={(event) => setDraftRole(event.target.value as UserRole)}><option value="user">O‘quvchi</option><option value="mentor">Mentor</option><option value="admin">Admin</option></select></label><label>Hisob holati<button type="button" className={`account-switch ${draftActive ? "on" : ""}`} onClick={() => setDraftActive((value) => !value)}><i/><span>{draftActive ? "Hisob faol" : "Hisob bloklangan"}</span></button></label><p>Admin rolini berish barcha boshqaruv sahifalariga kirish imkonini beradi.</p><button className="button button-primary" disabled={busy || (draftRole === selected.role && draftActive === selected.is_active)} onClick={() => void saveUser()}>{busy ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}</button></div></section>
        <section className="user-drawer-section"><h3>Kurs va to‘lov holati</h3><div className="drawer-course-list">{selectedEnrollments.length ? selectedEnrollments.map((item) => { const course = courseById.get(item.course_id); const relatedOrders = selectedOrders.filter((order) => order.course_id === item.course_id); const payment = paymentInfo(relatedOrders); return <article key={item.id}><span className="course-avatar">{course?.title?.[0] ?? "K"}</span><div><b>{course?.title ?? `Kurs #${item.course_id.slice(0, 8)}`}</b><small>Umumiy progress</small><i className="course-progress"><span style={{ width: `${Math.max(8, (item.access_stage ?? 1) * 20)}%` }}/></i></div><div className="access-stages"><span className="open">1-qism<br/>Ochiq</span><span className={(item.access_stage ?? 1) >= 2 ? "open" : ""}>2-qism<br/>{(item.access_stage ?? 1) >= 2 ? "Ochiq" : "Yopiq"}</span><span className={(item.access_stage ?? 1) >= 3 ? "open" : ""}>3-qism<br/>{(item.access_stage ?? 1) >= 3 ? "Ochiq" : "Yopiq"}</span></div><span className={`payment-pill ${payment.tone}`}>{payment.label}</span></article>; }) : <p className="drawer-empty">Foydalanuvchida faol kurs yo‘q.</p>}</div></section>
        <section className="user-drawer-section security-section"><h3>Xavfsizlik</h3><div><span>Faol sessiya: {selected.active_session_count} qurilma</span><button disabled={busy || !selected.active_session_count} onClick={() => void revokeSessions()}>Barcha sessiyalardan chiqarish</button></div><div><span>Parolni tiklash kodi</span><button disabled={busy} onClick={() => void sendPasswordReset()}>Yuborish</button></div></section>
        <section className="admin-danger-box user-block-box"><div><h3>{selected.is_active ? "Hisobni vaqtincha bloklash" : "Hisobni faollashtirish"}</h3><p>Kurs progressi va to‘lov tarixi saqlanadi. Foydalanuvchi tizimga kira olmaydi.</p></div><button onClick={() => setPendingState({ value: !selected.is_active })}>{selected.is_active ? "Bloklash" : "Faollashtirish"}</button></section>
        <p className="audit-note">ⓘ Barcha admin o‘zgarishlari audit jurnaliga yoziladi.</p>
      </>}

      {tab === "courses" && <section className="drawer-tab-list"><h3>Kurslar ({selectedEnrollments.length})</h3>{selectedEnrollments.length ? selectedEnrollments.map((item) => <article key={item.id}><b>{courseById.get(item.course_id)?.title ?? `Kurs #${item.course_id.slice(0, 8)}`}</b><span>{item.access_stage ?? 1}/3 qism · {item.status}</span></article>) : <p>Kurslar mavjud emas.</p>}</section>}
      {tab === "payments" && <section className="drawer-tab-list"><h3>To‘lovlar ({selectedOrders.length})</h3>{selectedOrders.length ? selectedOrders.map((order) => <article key={order.id}><b>{courseById.get(order.course_id)?.title ?? `Buyurtma #${order.id.slice(0, 8)}`}</b><span>{Number(order.paid_amount).toLocaleString("uz-UZ")} / {Number(order.amount).toLocaleString("uz-UZ")} {order.currency}</span></article>) : <p>To‘lovlar mavjud emas.</p>}</section>}
      {tab === "activity" && <section className="drawer-tab-list"><h3>Faollik</h3><article><b>Oxirgi kirish</b><span>{relativeTime(selected.last_login_at)}</span></article><article><b>Faol sessiya</b><span>{selected.active_session_count} qurilma</span></article><article><b>IP manzil</b><span>{selected.session_ip_address ?? "Ma’lumot yo‘q"}</span></article></section>}
    </aside></>}

    {createOpen && <><button className="admin-drawer-backdrop" aria-label="Yopish" onClick={() => setCreateOpen(false)}/><aside className="admin-drawer create-user-drawer" role="dialog" aria-modal="true" aria-labelledby="create-user-title"><header><div><span className="eyebrow">YANGI HISOB</span><h2 id="create-user-title">Foydalanuvchi qo‘shish</h2></div><button aria-label="Yopish" onClick={() => setCreateOpen(false)}>×</button></header>{error && <div className="admin-error"><p>{error}</p></div>}<form className="admin-drawer-form" onSubmit={(event) => void createUser(event)}><label>Ism<input name="first_name" required maxLength={255}/></label><label>Familiya<input name="last_name" maxLength={255}/></label><label>Email yoki telefon<input name="contact" required placeholder="user@example.com yoki +998…"/></label><label>Vaqtinchalik parol<input name="password" required type="password" minLength={8}/></label><label>Rol<select name="role" defaultValue="user"><option value="user">O‘quvchi</option><option value="mentor">Mentor</option><option value="admin">Admin</option></select></label><button className="button button-primary admin-drawer-primary" disabled={busy} type="submit">{busy ? "Qo‘shilmoqda…" : "Foydalanuvchini qo‘shish"}</button></form></aside></>}

    {pendingState && selected && <AdminConfirmDialog title={pendingState.value ? "Hisobni faollashtirish" : "Hisobni vaqtincha bloklash"} body={pendingState.value ? `${displayName(selected)} yana tizimga kira oladi.` : `${displayName(selected)} tizimga kira olmaydi. Progress va to‘lov tarixi saqlanadi.`} confirmLabel={pendingState.value ? "Faollashtirish" : "Bloklash"} tone={pendingState.value ? "warning" : "danger"} busy={busy} onCancel={() => setPendingState(null)} onConfirm={() => void applyStateChange()}/>} 
  </>;
}

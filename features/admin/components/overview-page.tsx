"use client";

import Link from "next/link";
import {
  formatMoney,
  type AdminSummary,
  type Course,
  type Order,
  type UserProfile,
} from "@/lib/api-client";
import {
  AdminActionLink,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminMetrics,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  AdminTable,
  useAdminResource,
} from "@/features/admin/components/admin-kit";

export default function AdminOverviewPage() {
  const summary = useAdminResource<AdminSummary>("/admin/dashboard/summary");
  const orders = useAdminResource<Order[]>("/admin/orders/?limit=5");
  const users = useAdminResource<UserProfile[]>("/admin/users/?limit=100");
  const courses = useAdminResource<Course[]>("/admin/courses/?limit=100");
  const userById = new Map((users.data ?? []).map((user) => [user.id, user]));
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course]));

  return <>
    <AdminPageHeader
      eyebrow="BUGUNGI HOLAT"
      title="Boshqaruv paneli"
      subtitle="Muhim ko‘rsatkichlar, kutilayotgan ishlar va so‘nggi buyurtmalar."
      action={<div className="admin-row-actions">
        <AdminActionLink href="/admin/courses/new">+ Yangi kurs</AdminActionLink>
        <AdminActionLink href="/admin/payments">To‘lovni qayd etish</AdminActionLink>
      </div>}
    />
    {summary.loading ? <AdminLoading /> : summary.error ? (
      <AdminError message={summary.error} retry={() => void summary.reload()} />
    ) : summary.data && <>
      <AdminMetrics items={[
        { label: "Jami foydalanuvchilar", value: summary.data.total_users.toLocaleString(), icon: "user" },
        { label: "Faol kurslar", value: String(summary.data.published_courses), icon: "book" },
        { label: "Kutilayotgan ishlar", value: String(summary.data.pending_orders + summary.data.failed_videos), icon: "clock", tone: "warning" },
        { label: "Jami tushum", value: formatMoney(summary.data.total_revenue, summary.data.currency), icon: "bag" },
      ]} />
      <div className="admin-overview-grid">
        <AdminPanel>
          <div className="admin-panel-title"><h2>Tushum holati</h2><span>Tasdiqlangan to‘lovlar</span></div>
          <div className="admin-zero-chart"><i /><p>{Number(summary.data.total_revenue) ? formatMoney(summary.data.total_revenue, summary.data.currency) : "Hozircha tasdiqlangan tushum yo‘q"}</p></div>
        </AdminPanel>
        <AdminPanel>
          <div className="admin-panel-title"><h2>Kutilayotgan vazifalar</h2></div>
          {summary.data.pending_orders || summary.data.failed_videos ? <div className="admin-task-list">
            {summary.data.pending_orders > 0 && <Link href="/admin/orders"><b>{summary.data.pending_orders}</b><span>Ko‘rib chiqilishi kerak bo‘lgan buyurtmalar</span></Link>}
            {summary.data.failed_videos > 0 && <Link href="/admin/videos"><b>{summary.data.failed_videos}</b><span>Xatolik bergan videolar</span></Link>}
          </div> : <AdminEmpty icon="receipt" title="Kutilayotgan vazifa yo‘q" body="Barcha muhim jarayonlar nazoratda." />}
        </AdminPanel>
      </div>
      <div className="admin-bottom-grid">
        <AdminPanel>
          <div className="admin-panel-title"><h2>So‘nggi buyurtmalar</h2><Link href="/admin/orders">Barchasini ko‘rish →</Link></div>
          {orders.loading ? <AdminLoading /> : (orders.data ?? []).length ? <AdminTable headings={["Foydalanuvchi", "Kurs", "Miqdor", "Holat"]}>
            {(orders.data ?? []).map((order) => {
              const user = userById.get(order.user_id);
              const course = courseById.get(order.course_id);
              return <tr key={order.id}>
                <td><b>{user ? `${user.first_name} ${user.last_name ?? ""}` : `#${order.user_id.slice(0, 8)}`}</b><small>{user?.email ?? user?.phone_number ?? "Kontakt yo‘q"}</small></td>
                <td>{course?.title ?? `#${order.course_id.slice(0, 8)}`}</td>
                <td>{formatMoney(order.agreed_total_amount ?? order.amount, order.currency)}</td>
                <td><AdminStatus value={order.status} /></td>
              </tr>;
            })}
          </AdminTable> : <AdminEmpty icon="bag" title="Buyurtmalar yo‘q" body="Yangi buyurtmalar shu yerda ko‘rinadi." />}
        </AdminPanel>
        <AdminPanel>
          <div className="admin-panel-title"><h2>Tezkor amallar</h2></div>
          <div className="admin-quick-actions">
            <AdminActionLink href="/admin/users">Foydalanuvchilar</AdminActionLink>
            <AdminActionLink href="/admin/payment-accounts">To‘lov hisoblari</AdminActionLink>
            <AdminActionLink href="/admin/showcase">Landing galereyasi</AdminActionLink>
            <AdminActionLink href="/admin/prompt-models">AI modellari</AdminActionLink>
          </div>
        </AdminPanel>
      </div>
    </>}
  </>;
}

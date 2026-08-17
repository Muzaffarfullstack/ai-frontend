"use client";

import { useParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { useLocale } from "@/components/providers";
import { mutateAdminResource } from "@/features/admin/api/admin.api";
import { AdminError, AdminLoading, AdminPanel, useAdminResource } from "@/features/admin/components/admin-kit";
import { CourseStudioSidebar } from "./course-studio-sidebar";
import { CourseWorkspaceNav } from "./course-workspace-nav";
import { localizedApiError, type Course } from "@/lib/api-client";

const splitPrice = (price: number) => {
  const base = Math.floor(price / 3 / 1000) * 1000;
  return [base, base, price - base * 2];
};

export default function CoursePricingPage() {
  const { id } = useParams<{ id: string }>();
  const resource = useAdminResource<Course>(`/admin/courses/${id}`);
  if (resource.loading || !resource.data) return resource.error ? <AdminError message={resource.error} retry={() => void resource.reload()}/> : <AdminLoading/>;
  return <CoursePricingEditor course={resource.data} onReload={resource.reload}/>;
}

function CoursePricingEditor({ course, onReload }: { course: Course; onReload: () => Promise<void> }) {
  const { t } = useLocale();
  const id = course.id;
  const initialPrice = Number(course.price);
  const [paid, setPaid] = useState(initialPrice > 0);
  const [price, setPrice] = useState(initialPrice);
  const [full, setFull] = useState(course.allow_full_payment ?? true);
  const [installments, setInstallments] = useState(course.allow_installments ?? false);
  const [amounts, setAmounts] = useState<number[]>(course.installment_amounts?.length === 3 ? course.installment_amounts : splitPrice(initialPrice));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const installmentTotal = useMemo(() => amounts.reduce((sum, item) => sum + Number(item || 0), 0), [amounts]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    const finalPrice = paid ? price : 0;
    if (paid && installments && installmentTotal !== finalPrice) { setError("3 qism summasi kurs narxiga teng bo‘lishi kerak."); setBusy(false); return; }
    try {
      await mutateAdminResource(`/admin/courses/${id}`, { method: "PATCH", body: JSON.stringify({
        price: finalPrice, currency: "UZS", is_price_visible: data.get("is_price_visible") === "on",
        allow_full_payment: paid && full, allow_installments: paid && installments,
        installment_amounts: paid && installments ? amounts : [], is_catalog_visible: data.get("is_catalog_visible") === "on",
        is_enrollment_open: data.get("is_enrollment_open") === "on",
        access_duration_days: data.get("unlimited") === "on" ? null : Number(data.get("access_duration_days") || 0) || null,
      }) });
      setMessage("Narx va kirish sozlamalari saqlandi."); await onReload();
    } catch (reason) { setError(localizedApiError(reason, t)); } finally { setBusy(false); }
  }

  return <>
    <CourseWorkspaceNav course={course} active="pricing"/>
    {error && <div className="form-error page-alert">{error}</div>}{message && <div className="success-message page-alert">{message}</div>}
    <div className="course-studio-layout"><form className="studio-main-column" onSubmit={save}>
      <AdminPanel className="studio-form-card"><h2>Narxlash</h2><p>Talaba katalogda ko‘radigan narx va xarid turini belgilang.</p>
        <div className="studio-segmented"><button type="button" className={!paid ? "active" : ""} onClick={() => setPaid(false)}>Bepul</button><button type="button" className={paid ? "active" : ""} onClick={() => setPaid(true)}>Pullik</button></div>
        {paid && <label className="studio-price-field"><span>UZS</span><input type="number" min="0" step="1000" value={price} onChange={(event) => { const value = Number(event.target.value); setPrice(value); if (!course.installment_amounts?.length) setAmounts(splitPrice(value)); }}/></label>}
        <label className="studio-switch"><input name="is_price_visible" type="checkbox" defaultChecked={course.is_price_visible ?? true}/><i/><span>Katalogda narxni ko‘rsatish</span></label>
      </AdminPanel>
      {paid && <AdminPanel className="studio-form-card"><h2>To‘lov rejasi</h2><p>Talabaga taqdim etiladigan to‘lov usullarini tanlang.</p>
        <div className="payment-option-grid"><button type="button" className={full ? "selected" : ""} onClick={() => setFull((value) => !value)}><b>✓　To‘liq to‘lov</b><small>{price.toLocaleString("uz-UZ")} UZS · Kurs to‘liq ochiladi</small></button><button type="button" className={installments ? "selected" : ""} onClick={() => setInstallments((value) => !value)}><b>✓　3 qismga bo‘lib to‘lash</b><small>Har tasdiqlangan qism navbatdagi kontentni ochadi</small></button></div>
        {installments && <div className="course-installment-table">{amounts.map((amount, index) => <label key={index}><b>{index + 1}-qism</b><input type="number" min="1000" step="1000" value={amount} onChange={(event) => setAmounts((items) => items.map((item, itemIndex) => itemIndex === index ? Number(event.target.value) : item))}/><span>{index === 2 ? "Barcha bo‘limlar ochiladi" : `${index + 1}-bo‘lim ochiladi`}</span></label>)}<footer>Jami: <b>{installmentTotal.toLocaleString("uz-UZ")} UZS</b><em className={installmentTotal === price ? "valid" : ""}>{installmentTotal === price ? "✓ Kurs narxiga teng" : "Summani tenglashtiring"}</em></footer></div>}
      </AdminPanel>}
      <AdminPanel className="studio-form-card"><h2>Kirish va ko‘rinish</h2><div className="studio-access-grid"><label>Kursga kirish muddati<input name="access_duration_days" type="number" min="1" defaultValue={course.access_duration_days ?? 365}/></label><label className="studio-switch"><input name="unlimited" type="checkbox" defaultChecked={!course.access_duration_days}/><i/><span>Cheklanmagan</span></label><label className="studio-switch"><input name="is_catalog_visible" type="checkbox" defaultChecked={course.is_catalog_visible ?? true}/><i/><span>Katalogda ko‘rsatish</span></label><label className="studio-switch"><input name="is_enrollment_open" type="checkbox" defaultChecked={course.is_enrollment_open ?? true}/><i/><span>Yangi buyurtmalarga ochiq</span></label></div></AdminPanel>
      <div className="studio-save-row"><span>O‘zgarishlar joriy kurs konfiguratsiyasiga qo‘llanadi.</span><button className="button button-primary" disabled={busy}>{busy ? "Saqlanmoqda…" : "Narx va kirishni saqlash"}</button></div>
    </form><CourseStudioSidebar course={course}/></div>
  </>;
}

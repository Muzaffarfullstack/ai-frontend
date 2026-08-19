"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppIcon } from "@/components/ui";
import { apiRequest, type UserProfile } from "@/lib/api-client";
import { localeNames, type Locale } from "@/lib/i18n";
import { useAuth, useLocale } from "@/components/providers";

export default function ProfilePage() {
  const { t, locale, setLocale } = useLocale();
  const { user, refreshUser, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [contactMode, setContactMode] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [contactStep, setContactStep] = useState<"closed" | "edit" | "verify">("closed");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const completion = useMemo(() => {
    const fields = [user?.first_name, user?.last_name, user?.email, user?.phone_number];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaved(false); setError("");
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest<UserProfile>("/users/me", { method: "PATCH", body: JSON.stringify({ first_name: data.get("first_name"), last_name: data.get("last_name") || null }) });
      await refreshUser(); setSaved(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Profil saqlanmadi"); }
  }

  async function updateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try {
      if (contactStep === "edit") {
        await apiRequest(`/users/me/${contactMode}/change`, { method: "POST", body: JSON.stringify({ [contactMode === "email" ? "email" : "phone_number"]: contact }) });
        setContactStep("verify");
      } else if (contactStep === "verify") {
        await apiRequest(`/users/me/${contactMode}/verify`, { method: "POST", body: JSON.stringify({ code }) });
        await refreshUser(); setContactStep("closed"); setContact(""); setCode(""); setSaved(true);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kontakt yangilanmadi"); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password: data.get("current_password"), new_password: data.get("new_password") }) });
      setPasswordOpen(false); setSaved(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Parol yangilanmadi"); }
  }

  function openContact(mode: "phone" | "email") {
    setContactMode(mode); setContactStep("edit"); setContact(""); setCode("");
  }

  const joined = user?.created_at ? new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(user.created_at)) : "—";

  return <div className="profile-page"><header className="student-page-heading"><span className="lime-label">HISOB SOZLAMALARI</span><h1>{t("profile.title")}</h1><p>{t("profile.subtitle")}</p></header>{error && <div className="form-error page-alert">{error}</div>}{saved && <div className="success-message page-alert">Ma’lumotlar saqlandi.</div>}
    <section className="panel profile-summary"><div className="profile-identity"><div className="profile-avatar">{user?.first_name.slice(0, 1)}</div><div><h2>{user?.first_name} {user?.last_name}</h2><p>{user?.role === "admin" ? "Administrator" : user?.role === "mentor" ? "Mentor" : "O‘quvchi"}</p>{user?.email_verified_at && <span className="verified-badge"><AppIcon name="check" size={15}/>Email tasdiqlangan</span>}</div></div><div className="profile-completion"><span>Profil to‘liqligi</span><strong>{completion}%</strong><div className="progress-track"><i style={{ width: `${completion}%` }}/></div><small>{completion < 100 ? "Yetishmayotgan ma’lumotlarni qo‘shing" : "Profilingiz to‘liq"}</small></div><div className="profile-summary-item"><AppIcon name="calendar"/><span>Qo‘shilgan sana<strong>{joined}</strong></span></div><div className="profile-summary-item"><AppIcon name="shield"/><span>Hisob holati<strong>{user?.is_active ? "Faol" : "Faol emas"}</strong></span></div></section>
    <section className="profile-content-grid"><form className="panel personal-form" key={user?.updated_at ?? user?.id} onSubmit={submit}><h2>Shaxsiy ma’lumotlar</h2><div className="form-grid"><label className="field"><span>{t("profile.firstName")}</span><input name="first_name" required defaultValue={user?.first_name}/></label><label className="field"><span>{t("profile.lastName")}</span><input name="last_name" defaultValue={user?.last_name ?? ""} placeholder="Familiyangiz"/></label><label className="field"><span>{t("profile.email")}</span><input disabled value={user?.email ?? "Email kiritilmagan"}/></label><label className="field"><span>{t("profile.phone")}</span><input disabled value={user?.phone_number ?? "Telefon kiritilmagan"}/></label><label className="field field-wide"><span>{t("profile.language")}</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>{(Object.keys(localeNames) as Locale[]).map((item) => <option key={item} value={item}>{localeNames[item]}</option>)}</select></label></div><footer><small>O‘zgarishlar faqat “Saqlash” tugmasidan keyin qo‘llanadi.</small><button className="button button-primary">O‘zgarishlarni saqlash</button></footer></form>
      <div className="profile-right-stack"><article className="panel contact-card"><h2>Bog‘lanish ma’lumotlari</h2><div className="contact-row"><span><AppIcon name="mail"/></span><div><b>Email</b><small>{user?.email ?? "Kiritilmagan"}</small></div><i className={user?.email_verified_at ? "verified" : "unset"}>{user?.email_verified_at ? "Tasdiqlangan" : "Sozlanmagan"}</i><button onClick={() => openContact("email")}>Yangilash</button></div><div className="contact-row"><span><AppIcon name="phone"/></span><div><b>Telefon</b><small>{user?.phone_number ?? "Kiritilmagan"}</small></div><i className={user?.phone_verified_at ? "verified" : "unset"}>{user?.phone_verified_at ? "Tasdiqlangan" : "Sozlanmagan"}</i><button onClick={() => openContact("phone")}>Telefon qo‘shish</button></div>
        {contactStep !== "closed" && <form className="inline-contact-form" onSubmit={updateContact}>{contactStep === "edit" ? <><input required value={contact} onChange={(event) => setContact(event.target.value)} placeholder={contactMode === "email" ? "name@email.com" : "+998901234567"}/><button className="button button-ghost">Kod yuborish</button></> : <><input required inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000"/><button className="button button-primary">Tasdiqlash</button></>}<button type="button" className="text-button" onClick={() => setContactStep("closed")}>Bekor qilish</button></form>}
        <p>Aloqa ma’lumotini almashtirish tasdiqlash kodi orqali bajariladi.</p></article>
        <article className="panel security-panel"><h2>Xavfsizlik</h2><button onClick={() => setPasswordOpen((open) => !open)}><span><AppIcon name="shield"/></span><div><b>Parolni yangilash</b></div><i>›</i></button>{passwordOpen && <form className="password-form" onSubmit={changePassword}><input name="current_password" type="password" required placeholder="Joriy parol"/><input name="new_password" type="password" minLength={8} required placeholder="Yangi parol"/><button className="button button-primary">Yangilash</button></form>}<div className="security-row"><span><AppIcon name="clock"/></span><div><b>Faol qurilma</b><small>Hozirgi sessiya</small></div></div><button className="logout-all" onClick={() => void logout()}>Barcha sessiyalardan chiqish</button></article>
      </div>
    </section>
  </div>;
}



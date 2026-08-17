"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell, InlineAlert, PasswordField, authError } from "@/features/auth/components/auth-shell";
import { useAuth, useLocale } from "@/components/providers";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();
  const { t } = useLocale();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!loading && user) router.replace("/app"); }, [loading, router, user]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmation) { setError(t("errors.passwords_mismatch")); return; }
    const normalizedPhone = phone.replace(/\s+/g, "");
    setBusy(true); setError("");
    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), phone: normalizedPhone, email, password });
      sessionStorage.setItem("verify_contact", normalizedPhone);
      sessionStorage.setItem("verify_resend_at", String(Date.now() + 60_000));
      router.push("/verify-contact");
    } catch (reason) { setError(authError(reason, t, "errors.invalid_input")); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="RO‘YXATDAN O‘TISH" title="Hisob yarating" subtitle="Telefon raqamingiz asosiy kirish usuli bo‘ladi. Email ixtiyoriy."><form className="auth-form-upgraded" onSubmit={submit}>
    <div className="auth-name-grid"><label className="auth-field"><span>Ism</span><input required maxLength={255} autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Ismingiz"/></label><label className="auth-field"><span>Familiya</span><input maxLength={255} autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Familiyangiz"/></label></div>
    <label className="auth-field"><span>Telefon raqam</span><input required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+998 90 123 45 67"/><small>Tasdiqlash kodi shu raqamga yuboriladi.</small></label>
    <label className="auth-field"><span>Email <em>ixtiyoriy</em></span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@email.com"/></label>
    <PasswordField id="register-password" label="Parol" value={password} onChange={setPassword}/><p className="password-hint"><i className={password.length >= 8 ? "valid" : ""}/>Kamida 8 belgi</p><PasswordField id="register-confirm" label="Parolni tasdiqlang" value={confirmation} onChange={setConfirmation}/>
    <label className="auth-checkbox"><input required type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)}/><span>Foydalanish shartlari va Maxfiylik siyosatiga roziman.</span></label>{error && <InlineAlert>{error}</InlineAlert>}<button className="button button-primary auth-primary" disabled={busy || !accepted}>{busy ? "Yaratilmoqda…" : "Hisob yaratish"}</button><p className="auth-switch">Hisobingiz bormi? <Link href="/login">Kirish →</Link></p>
  </form></AuthShell>;
}

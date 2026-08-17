"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell, ContactField, InlineAlert, authError } from "@/features/auth/components/auth-shell";
import { useAuth, useLocale } from "@/components/providers";

export default function ForgotPasswordPage() {
  const router = useRouter(); const { forgotPassword } = useAuth(); const { t } = useLocale(); const [contact, setContact] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); if (busy) return; setBusy(true); setError(""); try { await forgotPassword(contact); sessionStorage.setItem("reset_contact", contact.trim()); sessionStorage.setItem("reset_resend_at", String(Date.now() + 60_000)); router.push("/forgot-password/verify"); } catch (reason) { setError(authError(reason, t)); } finally { setBusy(false); } }
  return <AuthShell progress={{ step: 1, label: "Aloqa ma’lumoti" }} eyebrow="HISOBNI TIKLASH" title="Parolni tiklash" subtitle="Hisobingizga bog‘langan email yoki telefon raqamingizni kiriting."><form className="auth-form-upgraded" onSubmit={submit}><ContactField value={contact} onChange={setContact}/>{error && <InlineAlert>{error}</InlineAlert>}<button className="button button-primary auth-primary" disabled={busy}>{busy ? "Yuborilmoqda…" : "Tasdiqlash kodini yuborish"}</button><p className="auth-switch"><Link href="/login">← Kirishga qaytish</Link></p><InlineAlert tone="success">Agar bu kontaktga bog‘langan hisob mavjud bo‘lsa, tasdiqlash kodi yuboriladi.</InlineAlert></form></AuthShell>;
}

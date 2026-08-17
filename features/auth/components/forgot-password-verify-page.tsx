"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell, InlineAlert, OtpInput, authError } from "@/features/auth/components/auth-shell";
import { useAuth, useLocale } from "@/components/providers";

export default function ForgotVerifyPage() {
  const router = useRouter(); const { verifyPasswordResetCode, resend } = useAuth(); const { t } = useLocale(); const [contact, setContact] = useState(""); const [code, setCode] = useState(""); const [seconds, setSeconds] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { const tick = () => setSeconds(Math.max(0, Math.ceil((Number(sessionStorage.getItem("reset_resend_at")) - Date.now()) / 1000))); queueMicrotask(() => { const saved = sessionStorage.getItem("reset_contact") ?? ""; setContact(saved); if (!saved) router.replace("/forgot-password"); tick(); }); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, [router]);
  async function submit(event: FormEvent) { event.preventDefault(); if (code.length !== 6 || busy) return; setBusy(true); setError(""); try { const result = await verifyPasswordResetCode(contact, code); sessionStorage.setItem("password_reset_token", result.resetToken); sessionStorage.setItem("password_reset_expires_at", String(Date.now() + result.expiresIn * 1000)); router.push("/forgot-password/new-password"); } catch (reason) { setError(authError(reason, t, "errors.verification_code_invalid")); } finally { setBusy(false); } }
  async function sendAgain() { if (seconds > 0 || busy) return; setBusy(true); setError(""); try { await resend(contact, "reset_password"); sessionStorage.setItem("reset_resend_at", String(Date.now() + 60_000)); setSeconds(60); } catch (reason) { setError(authError(reason, t)); } finally { setBusy(false); } }
  return <AuthShell progress={{ step: 2, label: "Tasdiqlash kodi" }} eyebrow="XAVFSIZ TASDIQLASH" title="Kodni kiriting" subtitle="Kontaktga yuborilgan 6 xonali kodni kiriting."><form className="auth-form-upgraded" onSubmit={submit}><label className="auth-field"><span>Tasdiqlash kodi</span><OtpInput value={code} onChange={setCode} error={error}/></label><p className="auth-help">Kod 10 daqiqa davomida amal qiladi.</p>{error && <InlineAlert id="otp-error">{error}</InlineAlert>}<button className="button button-primary auth-primary" disabled={busy || code.length !== 6}>{busy ? "Tekshirilmoqda…" : "Kodni tasdiqlash"}</button><div className="auth-dual-links"><Link href="/forgot-password">← Ma’lumotni o‘zgartirish</Link><button type="button" disabled={seconds > 0 || busy} onClick={sendAgain}>{seconds > 0 ? `Qayta yuborish 00:${String(seconds).padStart(2,"0")}` : "Kodni qayta yuborish"}</button></div></form></AuthShell>;
}

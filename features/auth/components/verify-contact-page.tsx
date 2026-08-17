"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell, InlineAlert, OtpInput, authError } from "@/features/auth/components/auth-shell";
import { useAuth, useLocale } from "@/components/providers";

export default function VerifyContactPage() {
  const router = useRouter(); const { verify, resend } = useAuth(); const { t } = useLocale(); const [contact, setContact] = useState(""); const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [seconds, setSeconds] = useState(0);
  useEffect(() => { const tick = () => setSeconds(Math.max(0, Math.ceil((Number(sessionStorage.getItem("verify_resend_at")) - Date.now()) / 1000))); queueMicrotask(() => { setContact(sessionStorage.getItem("verify_contact") ?? ""); tick(); }); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (code.length !== 6 || busy) return; setBusy(true); setError(""); try { await verify(contact, code); sessionStorage.removeItem("verify_contact"); sessionStorage.removeItem("verify_resend_at"); router.replace("/login?verified=1"); } catch (reason) { setError(authError(reason, t, "errors.verification_code_invalid")); } finally { setBusy(false); } }
  async function sendAgain() { if (seconds > 0 || busy) return; setBusy(true); setError(""); try { await resend(contact, "register"); sessionStorage.setItem("verify_resend_at", String(Date.now() + 60_000)); setSeconds(60); } catch (reason) { setError(authError(reason, t)); } finally { setBusy(false); } }
  return <AuthShell eyebrow="XAVFSIZ TASDIQLASH" title="Kontaktni tasdiqlang" subtitle={contact ? `${contact} manziliga yuborilgan 6 xonali kodni kiriting.` : "Tasdiqlash ma’lumoti topilmadi."}>{contact ? <form className="auth-form-upgraded" onSubmit={submit}><label className="auth-field"><span>Tasdiqlash kodi</span><OtpInput value={code} onChange={setCode} error={error}/></label>{error && <InlineAlert id="otp-error">{error}</InlineAlert>}<button className="button button-primary auth-primary" disabled={busy || code.length !== 6}>{busy ? "Tekshirilmoqda…" : "Tasdiqlash"}</button><button className="auth-secondary-action" type="button" disabled={seconds > 0 || busy} onClick={sendAgain}>{seconds > 0 ? `Qayta yuborish 00:${String(seconds).padStart(2,"0")}` : "Kodni qayta yuborish"}</button></form> : <InlineAlert>Jarayon ma’lumoti yo‘q. <Link href="/register">Qayta ro‘yxatdan o‘ting.</Link></InlineAlert>}</AuthShell>;
}

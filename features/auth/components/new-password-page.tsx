"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell, InlineAlert, PasswordField, authError } from "@/features/auth/components/auth-shell";
import { useAuth, useLocale } from "@/components/providers";
import { ApiError } from "@/lib/api-client";

export default function NewPasswordPage() {
  const router = useRouter(); const { completePasswordReset } = useAuth(); const { t } = useLocale(); const [token, setToken] = useState(""); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { queueMicrotask(() => { const saved = sessionStorage.getItem("password_reset_token") ?? ""; const expires = Number(sessionStorage.getItem("password_reset_expires_at")); if (!saved || !expires || expires <= Date.now()) { sessionStorage.removeItem("password_reset_token"); router.replace("/forgot-password"); return; } setToken(saved); }); }, [router]);
  const hasMinimumLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordMeetsPolicy = hasMinimumLength && hasUppercase && hasNumber;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!passwordMeetsPolicy) {
      setError("Parol kamida 8 belgi, bitta katta harf va bitta raqamdan iborat bo‘lishi kerak.");
      return;
    }
    if (password !== confirmation) {
      setError(t("errors.passwords_mismatch"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await completePasswordReset(token, password, confirmation);
      for (const key of ["password_reset_token", "password_reset_expires_at", "reset_contact", "reset_resend_at"]) {
        sessionStorage.removeItem(key);
      }
      router.replace("/login?reset=success");
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "password_policy_violation") {
        setError(reason.message);
      } else if (
        reason instanceof ApiError
        && ["verification_code_invalid", "verification_code_expired", "invalid_reset_token"].includes(reason.code)
      ) {
        setError(t("errors.invalid_reset_token"));
      } else {
        setError(authError(reason, t));
      }
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell progress={{ step: 3, label: "Yangi parol" }} eyebrow="YAKUNIY QADAM" title="Yangi parol yarating" subtitle="Hisobingiz uchun yangi va kuchli parol kiriting."><form className="auth-form-upgraded" onSubmit={submit}><PasswordField id="new-password" label="Yangi parol" value={password} onChange={setPassword}/><p className="password-hint"><i className={hasMinimumLength ? "valid" : ""}/> Kamida 8 belgi</p><p className="password-hint"><i className={hasUppercase ? "valid" : ""}/> Kamida 1 ta katta harf</p><p className="password-hint"><i className={hasNumber ? "valid" : ""}/> Kamida 1 ta raqam</p><PasswordField id="new-password-confirm" label="Parolni tasdiqlang" value={confirmation} onChange={setConfirmation}/>{error && <InlineAlert>{error}</InlineAlert>}<button className="button button-primary auth-primary" disabled={busy || !token || !passwordMeetsPolicy}>{busy ? "Yangilanmoqda…" : "Parolni yangilash"}</button><p className="auth-help auth-centered">Parol yangilangach barcha faol sessiyalar tugatiladi.</p><p className="auth-switch"><Link href="/login">← Kirishga qaytish</Link></p></form></AuthShell>;
}

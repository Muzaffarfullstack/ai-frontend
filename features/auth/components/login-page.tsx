"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthShell, ContactField, InlineAlert, PasswordField, authError } from "@/features/auth/components/auth-shell";
import { useAuth, useLocale } from "@/components/providers";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading, login } = useAuth();
  const { t } = useLocale();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (!loading && user) router.replace("/app"); }, [loading, router, user]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await login(contact, password);
      const requested = search.get("next");
      const safeNext = requested?.startsWith("/") && !requested.startsWith("//") ? requested : null;
      router.replace(safeNext ?? "/app");
    } catch (reason) { setError(authError(reason, t, "errors.invalid_credentials")); }
    finally { setBusy(false); }
  }
  return <AuthShell eyebrow="XAVFSIZ KIRISH" title="Platformaga kirish" subtitle="Email yoki telefon raqamingiz orqali davom eting."><form className="auth-form-upgraded" onSubmit={submit}><ContactField value={contact} onChange={setContact}/><PasswordField id="login-password" label="Parol" value={password} onChange={setPassword} autoComplete="current-password"/><div className="auth-form-link"><Link href="/forgot-password">Parolni unutdingizmi?</Link></div>{error && <InlineAlert>{error}</InlineAlert>}<button className="button button-primary auth-primary" disabled={busy}>{busy ? "Kirilmoqda…" : "Kirish"}</button><p className="auth-switch">Hisobingiz yo‘qmi? <Link href="/register">Ro‘yxatdan o‘tish →</Link></p></form></AuthShell>;
}

export default function LoginPage() { return <Suspense fallback={null}><LoginForm/></Suspense>; }

"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { AppIcon } from "@/components/ui/app-icon";
import { Brand } from "@/components/ui/brand";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLocale } from "@/components/providers";

export function AuthShell({ eyebrow, title, subtitle, children, progress }: { eyebrow: string; title: string; subtitle: string; children: ReactNode; progress?: { step: number; label: string } }) {
  const { locale } = useLocale();
  const marketing = locale === "ru" ? { label: "ПРАКТИЧЕСКОЕ AI-ОБУЧЕНИЕ", title: "Превратите идею в сильный промпт.", body: "Изучайте визуальные AI-инструменты и модель-специфичные промпты на практике.", points: ["Уроки на понятном языке", "Практические проекты", "Prompt Builder под модель"] } : locale === "en" ? { label: "PRACTICAL AI LEARNING", title: "Turn your idea into a powerful prompt.", body: "Learn visual AI tools and model-specific prompting through practical workflows.", points: ["Clear, structured lessons", "Practical projects", "Model-specific Prompt Builder"] } : { label: "AMALIY AI TA’LIM", title: "G‘oyangizni kuchli promptga aylantiring.", body: "Tasvir va video yaratish, modelga mos prompt yozish va amaliy AI ko‘nikmalarini bosqichma-bosqich o‘rganing.", points: ["O‘zbek tilidagi darslar", "Amaliy loyihalar", "Modelga mos Prompt Builder"] };
  return <main className="auth-shell"><section className="auth-story"><Brand compact/><div className="auth-story-copy"><span className="eyebrow">{marketing.label}</span><h1>{marketing.title}</h1><p>{marketing.body}</p><ul>{marketing.points.map((point, index) => <li key={point}><span><AppIcon name={["file", "bag", "sparkles"][index] as "file" | "bag" | "sparkles"}/></span>{point}</li>)}</ul></div><div className="auth-journey" aria-hidden="true"><span>G‘oya</span><i>→</i><span>Prompt</span><i>→</i><span>Natija</span></div><div className="auth-story-lines" aria-hidden="true"/></section><section className="auth-workspace"><header><Link href="/">← PromptUsta</Link><LanguageSwitcher/></header><div className="auth-card-upgraded">{progress && <AuthFlowProgress step={progress.step} label={progress.label}/>}<span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p>{children}</div></section></main>;
}

export function PasswordField({ id, label, value, onChange, autoComplete = "new-password" }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="auth-field" htmlFor={id}><span>{label}</span><div className="auth-input-with-icon"><AppIcon name="shield"/><input id={id} required minLength={8} maxLength={128} type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)}/><button type="button" aria-label={visible ? "Parolni yashirish" : "Parolni ko‘rsatish"} onClick={() => setVisible((current) => !current)}>{visible ? "Yopish" : "Ko‘rish"}</button></div></label>;
}

export function OtpInput({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  function update(event: ChangeEvent<HTMLInputElement>) { onChange(event.target.value.replace(/\D/g, "").slice(0, 6)); }
  return <div className="otp-control" onClick={() => input.current?.focus()}><input ref={input} aria-label="6 xonali tasdiqlash kodi" aria-describedby={error ? "otp-error" : undefined} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" value={value} onChange={update}/>{Array.from({ length: 6 }, (_, index) => <span className={index === value.length ? "active" : ""} key={index}>{value[index] ?? ""}</span>)}</div>;
}

export function AuthFlowProgress({ step, label }: { step: number; label: string }) {
  return <div className="auth-progress"><div><strong>{step} / 3</strong><span>{label}</span></div><div>{[1,2,3].map((item) => <i className={item <= step ? "active" : ""} key={item}/>)}</div></div>;
}

export function InlineAlert({ tone = "error", children, id }: { tone?: "error" | "success"; children: ReactNode; id?: string }) {
  return <div className={`auth-alert ${tone}`} id={id} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function authError(reason: unknown, t: Translate, fallbackKey = "errors.request_failed") {
  return localizedApiError(reason, t, fallbackKey);
}

export function ContactField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="auth-field" htmlFor="contact"><span>Email yoki telefon raqam</span><div className="auth-input-with-icon"><AppIcon name="mail"/><input id="contact" required autoComplete="username" value={value} onChange={(event) => onChange(event.target.value)} placeholder="name@email.com yoki +998 90 123 45 67"/></div></label>;
}

"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
export { useAdminResource } from "@/features/admin/hooks/use-admin-resource";

export function AdminPageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <header className="admin-page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</header>;
}

export function AdminMetrics({ items }: { items: Array<{ label: string; value: string; hint?: string; icon: AppIconName; tone?: "danger" | "warning" }> }) {
  return <div className="admin-metrics">{items.map((item) => <article className={`admin-metric ${item.tone ?? ""}`} key={item.label}><span><AppIcon name={item.icon}/></span><div><small>{item.label}</small><strong>{item.value}</strong>{item.hint && <p>{item.hint}</p>}</div></article>)}</div>;
}

export function AdminEmpty({ icon, title, body, action }: { icon: AppIconName; title: string; body: string; action?: ReactNode }) {
  return <div className="admin-empty"><span><AppIcon name={icon} size={52}/></span><h2>{title}</h2><p>{body}</p>{action}</div>;
}

export function AdminPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`admin-panel ${className}`}>{children}</section>;
}

export function AdminStatus({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = ["published", "ready", "active", "paid", "succeeded"].includes(normalized) ? "success" : ["failed", "cancelled", "archived", "expired"].includes(normalized) ? "danger" : "warning";
  return <span className={`admin-status ${tone}`}>{value.replaceAll("_", " ")}</span>;
}

export function AdminTable({ headings, children, minWidth = 820 }: { headings: string[]; children: ReactNode; minWidth?: number }) {
  return <div className="admin-table-wrap"><table className="admin-table" style={{ minWidth }}><thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function AdminActionLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="admin-action-link" href={href}>{children}<AppIcon name="arrow" size={17}/></Link>;
}

export function AdminConfirmDialog({ title, body, confirmLabel, tone = "danger", busy = false, onCancel, onConfirm, children }: { title: string; body: string; confirmLabel: string; tone?: "danger" | "warning"; busy?: boolean; onCancel: () => void; onConfirm: () => void; children?: ReactNode }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [busy, onCancel]);
  return <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}><section className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-body"><span className={`admin-confirm-icon ${tone}`}>!</span><h2 id="admin-confirm-title">{title}</h2><p id="admin-confirm-body">{body}</p>{children}<div><button ref={cancelRef} className="button button-ghost" disabled={busy} onClick={onCancel}>Bekor qilish</button><button className={`button ${tone === "danger" ? "danger" : "button-primary"}`} disabled={busy} onClick={onConfirm}>{busy ? "Bajarilmoqda…" : confirmLabel}</button></div></section></div>;
}

export function AdminLoading() {
  return <div className="admin-loading" aria-label="Loading"><i/><i/><i/></div>;
}

export function AdminError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="admin-error" role="alert"><p>{message}</p><button type="button" onClick={retry}>Qayta urinish</button></div>;
}

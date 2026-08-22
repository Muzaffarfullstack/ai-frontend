"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, useLocale } from "@/components/providers";
import { AppIcon } from "./app-icon";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { RequireAuth } from "./require-auth";

const adminNavigation = [
  ["ASOSIY", "/admin", "admin.overview", "home"],
  ["ASOSIY", "/admin/users", "admin.users", "user"],
  ["TA’LIM", "/admin/courses", "admin.courses", "book"],
  ["TA’LIM", "/admin/videos", "admin.videos", "video"],
  ["AI TIZIMI", "/admin/ai-assistant", "admin.promptModels", "sparkles"],
  ["TIJORAT", "/admin/orders", "admin.orders", "bag"],
  ["TIJORAT", "/admin/payments", "admin.payments", "receipt"],
  ["TIJORAT", "/admin/enrollments", "admin.enrollments", "shield"],
  ["TIJORAT", "/admin/payment-accounts", "admin.paymentAccounts", "file"],
  ["KONTENT", "/admin/showcase", "admin.gallery", "star"],
  ["TIZIM", "/admin/settings", "admin.settings", "settings"],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { t } = useLocale();
  const { user } = useAuth();
  const current = adminNavigation.find(([, href]) => href === "/admin" ? path === href : path.startsWith(href));
  const labelFor = (label: (typeof adminNavigation)[number][2]) => label === "admin.gallery" ? "Landing galereyasi" : label === "admin.promptModels" ? "AI yordamchi" : t(label);

  return (
    <RequireAuth admin>
      <div className="manage-shell">
        <aside className="manage-sidebar">
          <Brand />
          <div className="manage-badge">ADMIN · {user?.first_name}</div>
          <nav aria-label="Admin navigation">
            {adminNavigation.map(([section, href, label, icon], index) => {
              const active = href === "/admin" ? path === href : path.startsWith(href);
              return (
                <div className="manage-nav-item" key={href}>
                  {(index === 0 || adminNavigation[index - 1][0] !== section) && <span className="manage-nav-section">{section}</span>}
                  <Link className={active ? "active" : ""} href={href}>
                    <AppIcon name={icon} />
                    <b>{labelFor(label)}</b>
                  </Link>
                </div>
              );
            })}
          </nav>
          <Link className="button button-ghost manage-home-link" href="/app"><i>{user?.first_name?.slice(0, 1) ?? "A"}</i><span>← {t("nav.home")}</span></Link>
        </aside>
        <div className="manage-content">
          <header className="admin-topbar">
            <div className="admin-breadcrumb"><span>Admin</span><i>/</i><b>{current ? labelFor(current[2]) : t("admin.overview")}</b></div>
            <div><LanguageSwitcher /><button className="admin-notification" aria-label="Bildirishnomalar"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 8H3c0-1 3-1 3-8ZM10 21h4"/></svg><i>3</i></button><span className="admin-mini-profile" aria-label={user?.first_name}><b>{user?.first_name?.slice(0, 1) ?? "A"}</b></span></div>
          </header>
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}

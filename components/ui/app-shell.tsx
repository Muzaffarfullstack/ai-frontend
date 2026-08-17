"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth, useLocale } from "@/components/providers";
import { AppIcon } from "./app-icon";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { RequireAuth } from "./require-auth";

const navigation = [
  ["/app", "Bosh sahifa", "home"],
  ["/app/courses", "Kurslar", "book"],
  ["/app/ai-tools", "AI yordamchi", "sparkles"],
  ["/app/leaderboard", "Reyting", "trophy"],
  ["/app/orders", "To‘lov holati", "bag"],
  ["/app/profile", "Profil", "user"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const current = navigation.find(([href]) => href === "/app" ? path === href : path.startsWith(href));

  const sidebar = <aside className={menuOpen ? "sidebar is-open" : "sidebar"}>
    <div className="sidebar-brand-row"><Brand/><button type="button" aria-label="Menyuni yopish" onClick={() => setMenuOpen(false)}>×</button></div>
    <nav className="side-nav" aria-label="Shaxsiy kabinet navigatsiyasi">
      {navigation.map(([href, label, icon]) => {
        const active = href === "/app" ? path === href : path.startsWith(href);
        return <Link className={active ? "side-link active" : "side-link"} href={href} key={href} onClick={() => setMenuOpen(false)}><AppIcon name={icon}/><b>{label}</b></Link>;
      })}
    </nav>
    <div className="sidebar-user">
      {isAdmin && <Link className="side-link admin-side-link" href="/admin"><AppIcon name="shield"/><b>Admin panel</b></Link>}
      <div className="sidebar-profile"><div className="avatar">{user?.first_name?.slice(0, 1) ?? "U"}</div><div><strong>{user?.first_name} {user?.last_name}</strong><small>{user?.email ?? user?.phone_number}</small></div></div>
      <button className="sidebar-logout" onClick={() => void logout()}><AppIcon name="logout"/>{t("nav.logout")}</button>
    </div>
  </aside>;

  return <RequireAuth><div className="app-shell">{sidebar}{menuOpen && <button className="sidebar-scrim" aria-label="Menyuni yopish" onClick={() => setMenuOpen(false)}/>}<div className="app-column">
    <header className="app-topbar"><button className="mobile-menu-trigger" type="button" aria-label="Menyuni ochish" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><span/><span/><span/></button><Brand compact/><div className="breadcrumbs"><Link href="/app">Shaxsiy kabinet</Link><span>/</span><b>{current?.[1] ?? "Bosh sahifa"}</b></div><LanguageSwitcher minimal/></header>
    <main className="app-main">{children}</main>
  </div></div></RequireAuth>;
}

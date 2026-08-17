"use client";

import Link from "next/link";
import { useAuth, useLocale } from "@/components/providers";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";

export function PublicHeader() {
  const { t } = useLocale(); const { user } = useAuth();
  return <header className="public-header"><div className="container header-inner"><Brand compact /><div className="header-actions"><LanguageSwitcher minimal /><Link className="button button-ghost hide-mobile" href={user ? "/app" : "/auth"}>{user ? t("nav.home") : t("nav.login")}</Link><Link className="button button-primary" href={user ? "/app" : "/auth?mode=register"}>{t("nav.start")}</Link></div></div></header>;
}

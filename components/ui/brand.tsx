"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  return (
    <Link className="brand" href="/" aria-label="PromptUsta">
      <span className="brand-mark">P</span>
      <span><strong>PromptUsta</strong>{!compact && <small>{t("brand.tagline")}</small>}</span>
    </Link>
  );
}

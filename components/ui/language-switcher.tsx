"use client";

import { useLocale } from "@/components/providers";
import { localeNames, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ minimal = false }: { minimal?: boolean }) {
  const { locale, setLocale } = useLocale();
  return <label className={minimal ? "language language-minimal" : "language"}><span className="sr-only">Language</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">{(Object.keys(localeNames) as Locale[]).map((item) => <option key={item} value={item}>{localeNames[item]}</option>)}</select></label>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchPlatformSettings, uploadSettingsLogo } from "@/features/admin/api/settings.api";
import type { PlatformSettingsDTO } from "@/features/admin/types";
import {
  SettingsInlineError,
  SettingsSection,
  SettingsTextField,
  dirtyFieldCount,
} from "./shared";

export function GeneralTab({
  initial,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: PlatformSettingsDTO;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: PlatformSettingsDTO) => void;
}) {
  const [form, setForm] = useState({
    title: initial.title,
    public_url: initial.public_url,
    support_email: initial.support_email,
    reply_to_name: initial.reply_to_name,
    default_lang: initial.default_lang,
    timezone: initial.timezone,
  });
  const [error, setError] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    onDirtyChange(dirtyFieldCount(initial, form));
  }, [form, initial, onDirtyChange]);

  useEffect(
    () =>
      registerSave(async () => {
        setError("");
        try {
          const updated = await patchPlatformSettings({
            title: form.title.trim() || initial.title,
            public_url: form.public_url.trim() || initial.public_url,
            support_email: form.support_email.trim() || initial.support_email,
            reply_to_name: form.reply_to_name.trim() || initial.reply_to_name,
            default_lang: form.default_lang,
            timezone: form.timezone,
          });
          onSaved(updated);
          return true;
        } catch (reason) {
          setError(localizedApiError(reason, t));
          return false;
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, initial, onSaved, registerSave],
  );

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    setLogoBusy(true);
    setError("");
    try {
      const result = await uploadSettingsLogo(file);
      setLogoUrl(result.logo_url);
      // Logo uploads are saved immediately. Keep the parent snapshot in sync so
      // switching tabs and returning does not restore the previous preview.
      onSaved({ ...initial, logo_url: result.logo_url });
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setLogoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <SettingsInlineError message={error} />
      <SettingsSection
        title="Platform ma’lumotlari"
        subtitle="Platforma nomi, manzili va qo‘llab-quvvatlash kontaktlari."
      >
        <div className="settings-form-grid">
          <SettingsTextField
            label="Platform nomi"
            value={form.title}
            onChange={(title) => setForm((prev) => ({ ...prev, title }))}
            placeholder="PromptUsta"
          />
          <SettingsTextField
            label="Public URL"
            value={form.public_url}
            onChange={(public_url) => setForm((prev) => ({ ...prev, public_url }))}
            placeholder="https://promptusta.uz"
            type="url"
          />
          <SettingsTextField
            label="Qo‘llab-quvvatlash emaili"
            value={form.support_email}
            onChange={(support_email) =>
              setForm((prev) => ({ ...prev, support_email }))
            }
            placeholder="support@promptusta.uz"
            type="email"
          />
          <SettingsTextField
            label="Javob yuboruvchi nomi"
            value={form.reply_to_name}
            onChange={(reply_to_name) =>
              setForm((prev) => ({ ...prev, reply_to_name }))
            }
            placeholder="PromptUsta"
          />
          <SettingsTextField
            label="Asosiy til"
            value={form.default_lang}
            onChange={(default_lang) =>
              setForm((prev) => ({ ...prev, default_lang }))
            }
            placeholder="uz"
          />
          <SettingsTextField
            label="Vaqt mintaqasi"
            value={form.timezone}
            onChange={(timezone) => setForm((prev) => ({ ...prev, timezone }))}
            placeholder="Asia/Tashkent"
          />
        </div>
      </SettingsSection>
      <SettingsSection
        title="Logo"
        subtitle="PNG, JPG yoki WebP. Fayl object storage’ga yuklanadi va URL bazaga saqlanadi."
      >
        <div className="settings-logo-row">
          <div className="settings-logo-preview">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Platforma logosi" />
            ) : (
              <span>Logo yuklanmagan</span>
            )}
          </div>
          <div className="settings-logo-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(event) => void pickLogo(event.currentTarget.files?.[0])}
            />
            <button
              className="button button-ghost"
              disabled={logoBusy}
              onClick={() => fileRef.current?.click()}
            >
              {logoBusy ? "Yuklanmoqda…" : "Logo yuklash"}
            </button>
            <small>
              Yuklangan logo darhol saqlanadi — sahifani yangilaganda ham
              o‘zgarish qoladi.
            </small>
          </div>
        </div>
      </SettingsSection>
    </>
  );
}

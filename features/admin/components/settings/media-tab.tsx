"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchMediaSettings } from "@/features/admin/api/settings.api";
import type { MediaSettingsDTO, ProviderStatusDTO } from "@/features/admin/types";
import {
  SettingsBadge,
  SettingsInlineError,
  SettingsNumberField,
  SettingsSection,
  SettingsSwitch,
  dirtyFieldCount,
} from "./shared";

export function MediaTab({
  initial,
  providers,
  readinessPercent,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: MediaSettingsDTO;
  providers: ProviderStatusDTO;
  readinessPercent: number;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: MediaSettingsDTO) => void;
}) {
  const [form, setForm] = useState({
    max_image_size_mb: String(initial.max_image_size_mb),
    max_document_size_mb: String(initial.max_document_size_mb),
    max_video_size_mb: String(initial.max_video_size_mb),
    enable_webp: initial.enable_webp,
    keep_original_file: initial.keep_original_file,
    enable_signed_playback: initial.enable_signed_playback,
    playback_token_ttl_hours: String(initial.playback_token_ttl_hours),
  });
  const [error, setError] = useState("");

  useEffect(() => {
    onDirtyChange(dirtyFieldCount(initial, form));
  }, [form, initial, onDirtyChange]);

  useEffect(
    () =>
      registerSave(async () => {
        setError("");
        try {
          const updated = await patchMediaSettings({
            max_image_size_mb: Number(form.max_image_size_mb),
            max_document_size_mb: Number(form.max_document_size_mb),
            max_video_size_mb: Number(form.max_video_size_mb),
            enable_webp: form.enable_webp,
            keep_original_file: form.keep_original_file,
            enable_signed_playback: form.enable_signed_playback,
            playback_token_ttl_hours: Number(form.playback_token_ttl_hours),
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

  function patch(partial: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  return (
    <>
      <SettingsInlineError message={error} />
      <SettingsSection
        title="Media Readiness"
        subtitle="Faol va sozlangan provayderlar asosida hisoblanadi."
      >
        <div className="settings-readiness">
          <div
            className="settings-readiness-ring"
            style={{ "--readiness": readinessPercent } as CSSProperties}
          >
            <span>{readinessPercent}%</span>
          </div>
          <div className="settings-readiness-list">
            <div className="settings-provider-row">
              <span className="settings-provider-name">Video processing (Mux)</span>
              {providers.mux_configured ? (
                <SettingsBadge tone="success">Tayyor</SettingsBadge>
              ) : (
                <SettingsBadge tone="warning">Sozlanmagan</SettingsBadge>
              )}
            </div>
            <div className="settings-provider-row">
              <span className="settings-provider-name">Object Storage</span>
              {providers.object_storage_configured ? (
                <SettingsBadge tone="success">
                  Tayyor · {providers.object_storage_backend}
                </SettingsBadge>
              ) : (
                <SettingsBadge tone="warning">Sozlanmagan</SettingsBadge>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Yuklash limitlari"
        subtitle="Fayl turlari bo‘yicha maksimal hajm."
      >
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Rasm yuklash limiti"
            value={form.max_image_size_mb}
            min={1}
            suffix="MB"
            onChange={(max_image_size_mb) => patch({ max_image_size_mb })}
          />
          <SettingsNumberField
            label="Hujjat yuklash limiti"
            value={form.max_document_size_mb}
            min={1}
            suffix="MB"
            onChange={(max_document_size_mb) => patch({ max_document_size_mb })}
          />
          <SettingsNumberField
            label="Video yuklash limiti"
            value={form.max_video_size_mb}
            min={1}
            suffix="MB"
            onChange={(max_video_size_mb) => patch({ max_video_size_mb })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Rasm optimallashtirish"
        subtitle="Yuklangan rasmlarga qo‘llanadigan konvertatsiya."
      >
        <div className="settings-switch-list">
          <SettingsSwitch
            label="WebP optimallashtirish"
            description="Rasmlar avtomatik WebP formatiga o‘tkaziladi"
            checked={form.enable_webp}
            onChange={(enable_webp) => patch({ enable_webp })}
          />
          <SettingsSwitch
            label="Original faylni saqlash"
            description="Konvertatsiya qilingan nusxadan tashqari asl fayl ham saqlanadi"
            checked={form.keep_original_file}
            onChange={(keep_original_file) => patch({ keep_original_file })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Playback xavfsizligi"
        subtitle="Video ijro etishni imzolangan tokenlar bilan himoyalash."
      >
        <div className="settings-switch-list">
          <SettingsSwitch
            label="Signed playback"
            description="Videolar faqat imzolangan vaqtinchalik token bilan ochiladi"
            checked={form.enable_signed_playback}
            onChange={(enable_signed_playback) =>
              patch({ enable_signed_playback })
            }
          />
        </div>
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Token TTL (soat)"
            value={form.playback_token_ttl_hours}
            min={1}
            max={168}
            suffix="soat"
            onChange={(playback_token_ttl_hours) =>
              patch({ playback_token_ttl_hours })
            }
          />
        </div>
      </SettingsSection>
    </>
  );
}

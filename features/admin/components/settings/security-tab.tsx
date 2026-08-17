"use client";

import { useEffect, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchSecuritySettings } from "@/features/admin/api/settings.api";
import type { SecuritySettingsDTO } from "@/features/admin/types";
import {
  SettingsInlineError,
  SettingsNumberField,
  SettingsSection,
  SettingsSwitch,
  dirtyFieldCount,
} from "./shared";

const SESSION_OPTIONS: Array<[string, string]> = [
  ["7", "7 kun"],
  ["14", "14 kun"],
  ["30", "30 kun"],
  ["60", "60 kun"],
  ["90", "90 kun"],
];

export function SecurityTab({
  initial,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: SecuritySettingsDTO;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: SecuritySettingsDTO) => void;
}) {
  const [form, setForm] = useState({
    session_duration_days: String(initial.session_duration_days),
    session_inactivity_days: String(initial.session_inactivity_days),
    max_login_attempts: String(initial.max_login_attempts),
    block_duration_minutes: String(initial.block_duration_minutes),
    otp_rate_limit: String(initial.otp_rate_limit),
    admin_2fa_required: initial.admin_2fa_required,
    audit_log_enabled: initial.audit_log_enabled,
    audit_log_retention_days: String(initial.audit_log_retention_days),
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
          const updated = await patchSecuritySettings({
            session_duration_days: Number(form.session_duration_days),
            session_inactivity_days: Number(form.session_inactivity_days),
            max_login_attempts: Number(form.max_login_attempts),
            block_duration_minutes: Number(form.block_duration_minutes),
            otp_rate_limit: Number(form.otp_rate_limit),
            admin_2fa_required: form.admin_2fa_required,
            audit_log_enabled: form.audit_log_enabled,
            audit_log_retention_days: Number(form.audit_log_retention_days),
          });
          onSaved(updated);
          return true;
        } catch (reason) {
          setError(localizedApiError(reason, t));
          return false;
        } finally {
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
        title="Sessiya siyosati"
        subtitle="Foydalanuvchi sessiyalarining amal qilish muddati."
      >
        <div className="settings-form-grid">
          <label className="settings-field">
            <span>Sessiya davomiyligi</span>
            <select
              value={form.session_duration_days}
              onChange={(event) =>
                patch({ session_duration_days: event.currentTarget.value })
              }
            >
              {SESSION_OPTIONS.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <SettingsNumberField
            label="Harakatsizlik muddati"
            value={form.session_inactivity_days}
            min={1}
            max={365}
            suffix="kun"
            onChange={(session_inactivity_days) =>
              patch({ session_inactivity_days })
            }
          />
        </div>
        <p className="settings-hint">
          Harakatsizlik muddati tugagan sessiya yangilanganda foydalanuvchi
          qayta kirishi talab qilinadi.
        </p>
      </SettingsSection>

      <SettingsSection
        title="Kirish himoyasi"
        subtitle="Notoâ€˜gâ€˜ri urinishlar va bloklash siyosati."
      >
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Maks. kirish urinishlari"
            value={form.max_login_attempts}
            min={1}
            max={20}
            suffix="urinish"
            onChange={(max_login_attempts) => patch({ max_login_attempts })}
          />
          <SettingsNumberField
            label="Bloklash muddati"
            value={form.block_duration_minutes}
            min={1}
            max={1440}
            suffix="daqiqa"
            onChange={(block_duration_minutes) =>
              patch({ block_duration_minutes })
            }
          />
          <SettingsNumberField
            label="OTP rate limit"
            value={form.otp_rate_limit}
            min={1}
            max={20}
            suffix="urinish"
            onChange={(otp_rate_limit) => patch({ otp_rate_limit })}
          />
        </div>
        <p className="settings-hint">
          Limit oshganda hisob bloklanadi va qayta urinish bloklash muddati
          tugagach mumkin boâ€˜ladi.
        </p>
      </SettingsSection>

      <SettingsSection
        title="Admin himoyasi"
        subtitle="Administrator hisoblariga qoâ€˜shimcha himoya."
      >
        <div className="settings-switch-list">
          <SettingsSwitch
            label="2FA talab qilinadi"
            description="Admin tizimga kirishda paroldan keyin OTP kod kiritishi shart"
            checked={form.admin_2fa_required}
            onChange={(admin_2fa_required) => patch({ admin_2fa_required })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Audit va maâ€™lumot"
        subtitle="Harakatlar jurnali va saqlash muddati."
      >
        <div className="settings-switch-list">
          <SettingsSwitch
            label="Audit log saqlash"
            description="Admin harakatlari jurnalga yoziladi"
            checked={form.audit_log_enabled}
            onChange={(audit_log_enabled) => patch({ audit_log_enabled })}
          />
        </div>
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Saqlash muddati"
            value={form.audit_log_retention_days}
            min={30}
            max={3650}
            suffix="kun"
            onChange={(audit_log_retention_days) =>
              patch({ audit_log_retention_days })
            }
          />
        </div>
      </SettingsSection>
    </>
  );
}

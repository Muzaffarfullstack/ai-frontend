"use client";

import { useEffect, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchAuthSettings } from "@/features/admin/api/settings.api";
import type { AuthSettingsDTO } from "@/features/admin/types";
import {
  SettingsBadge,
  SettingsInlineError,
  SettingsNumberField,
  SettingsRadio,
  SettingsSection,
  SettingsSelect,
  SettingsSwitch,
  dirtyFieldCount,
} from "./shared";

const OTP_OPTIONS: Array<[string, string]> = [
  ["1", "1 daqiqa"],
  ["3", "3 daqiqa"],
  ["5", "5 daqiqa"],
  ["10", "10 daqiqa"],
  ["15", "15 daqiqa"],
];

export function AuthTab({
  initial,
  smsConfigured,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: AuthSettingsDTO;
  smsConfigured: boolean;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: AuthSettingsDTO) => void;
}) {
  const [form, setForm] = useState({
    login_method: initial.login_method,
    otp_duration_minutes: String(initial.otp_duration_minutes),
    otp_send_limit: String(initial.otp_send_limit),
    password_min_length: String(initial.password_min_length),
    password_require_uppercase: initial.password_require_uppercase,
    password_require_number: initial.password_require_number,
    password_breach_check: initial.password_breach_check,
    is_islamic_name_required: initial.is_islamic_name_required,
    marketing_consent_required: initial.marketing_consent_required,
    registration_first_name: Boolean(initial.registration_fields.first_name),
    registration_last_name: Boolean(initial.registration_fields.last_name),
    registration_terms: Boolean(initial.registration_fields.terms_required),
    registration_marketing: Boolean(initial.registration_fields.marketing_consent),
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const comparison = {
      login_method: initial.login_method,
      otp_duration_minutes: initial.otp_duration_minutes,
      otp_send_limit: initial.otp_send_limit,
      password_min_length: initial.password_min_length,
      password_require_uppercase: initial.password_require_uppercase,
      password_require_number: initial.password_require_number,
      password_breach_check: initial.password_breach_check,
      is_islamic_name_required: initial.is_islamic_name_required,
      marketing_consent_required: initial.marketing_consent_required,
      registration_first_name: initial.registration_fields.first_name,
      registration_last_name: initial.registration_fields.last_name,
      registration_terms: initial.registration_fields.terms_required,
      registration_marketing: initial.registration_fields.marketing_consent,
    };
    onDirtyChange(dirtyFieldCount(comparison, form));
  }, [form, initial, onDirtyChange]);

  useEffect(
    () =>
      registerSave(async () => {
        setError("");
        try {
          const updated = await patchAuthSettings({
            login_method: form.login_method as "phone" | "email",
            otp_duration_minutes: Number(form.otp_duration_minutes),
            otp_send_limit: Number(form.otp_send_limit),
            password_min_length: Number(form.password_min_length),
            password_require_uppercase: form.password_require_uppercase,
            password_require_number: form.password_require_number,
            password_breach_check: form.password_breach_check,
            is_islamic_name_required: form.is_islamic_name_required,
            marketing_consent_required: form.marketing_consent_required,
            registration_fields: {
              first_name: form.registration_first_name,
              last_name: form.registration_last_name,
              terms_required: form.registration_terms,
              marketing_consent: form.registration_marketing,
            },
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
        title="Asosiy kirish usuli"
        subtitle="Foydalanuvchilar platformaga qaysi kontakt orqali kirishi mumkin."
      >
        <div className="settings-radio-group">
          <SettingsRadio
            name="login_method"
            label="Telefon"
            value="phone"
            checked={form.login_method === "phone"}
            onChange={(value) => patch({ login_method: value as "phone" })}
          />
          <SettingsRadio
            name="login_method"
            label="Email"
            value="email"
            checked={form.login_method === "email"}
            onChange={(value) => patch({ login_method: value as "email" })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="SMS / OTP provayderi"
        subtitle="Bir martalik kodlar jo‘natish uchun provayder holati."
      >
        <div className="settings-provider-row">
          <span className="settings-provider-name">SMS provayder</span>
          {smsConfigured ? (
            <SettingsBadge tone="success">Tayyor</SettingsBadge>
          ) : (
            <SettingsBadge tone="warning">Provider sozlanmagan</SettingsBadge>
          )}
          <small>
            {smsConfigured
              ? "SMS/OTP jo‘natish tizimi ishga tayyor."
              : "SMS provayderi hali sozlanmagan — OTP kodlari jo‘natilmaydi. Integratsiyalar bo‘limida sozlang."}
          </small>
        </div>
        <div className="settings-form-grid">
          <SettingsSelect
            label="OTP muddati"
            value={form.otp_duration_minutes}
            options={OTP_OPTIONS}
            onChange={(otp_duration_minutes) => patch({ otp_duration_minutes })}
          />
          <SettingsNumberField
            label="OTP yuborish limiti (soatiga)"
            value={form.otp_send_limit}
            min={1}
            max={100}
            onChange={(otp_send_limit) => patch({ otp_send_limit })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Parol talablari"
        subtitle="Yangi parollar uchun minimal talablar."
      >
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Minimal uzunlik"
            value={form.password_min_length}
            min={6}
            max={64}
            onChange={(password_min_length) => patch({ password_min_length })}
          />
        </div>
        <div className="settings-switch-list">
          <SettingsSwitch
            label="Katta harflar"
            description="Parolda kamida bitta katta harf bo‘lishi shart"
            checked={form.password_require_uppercase}
            onChange={(password_require_uppercase) =>
              patch({ password_require_uppercase })
            }
          />
          <SettingsSwitch
            label="Raqamlar"
            description="Parolda kamida bitta raqam bo‘lishi shart"
            checked={form.password_require_number}
            onChange={(password_require_number) =>
              patch({ password_require_number })
            }
          />
          <SettingsSwitch
            label="Breached password tekshiruvi"
            description="Parol ma’lumotlar sizib chiqishida aniqlangan bo‘lsa, qabul qilinmaydi"
            checked={form.password_breach_check}
            onChange={(password_breach_check) =>
              patch({ password_breach_check })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Ro‘yxatdan o‘tish formasi"
        subtitle="Ro‘yxatdan o‘tishda qaysi maydonlar ko‘rsatilishini boshqaring."
      >
        <div className="settings-switch-list">
          <SettingsSwitch
            label="Ism"
            checked={form.registration_first_name}
            onChange={(registration_first_name) =>
              patch({ registration_first_name })
            }
          />
          <SettingsSwitch
            label="Familiya"
            checked={form.registration_last_name}
            onChange={(registration_last_name) =>
              patch({ registration_last_name })
            }
          />
          <SettingsSwitch
            label="Foydalanish shartlari"
            description="Foydalanuvchi shartlarni tasdiqlashi shart"
            checked={form.registration_terms}
            onChange={(registration_terms) => patch({ registration_terms })}
          />
          <SettingsSwitch
            label="Marketing roziligi"
            checked={form.registration_marketing}
            onChange={(registration_marketing) =>
              patch({ registration_marketing })
            }
          />
        </div>
      </SettingsSection>
    </>
  );
}

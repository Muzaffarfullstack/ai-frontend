"use client";

import { useEffect, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchNotificationSettings } from "@/features/admin/api/settings.api";
import type {
  NotificationSettingsDTO,
  ProviderStatusDTO,
} from "@/features/admin/types";
import {
  SettingsBadge,
  SettingsInlineError,
  SettingsSection,
  SettingsSwitch,
  dirtyFieldCount,
} from "./shared";

const MATRIX_ROWS: Array<{
  event: string;
  label: string;
  columns: Array<{ key: string; label: string }>;
}> = [
  {
    event: "registration",
    label: "Roâ€˜yxatdan oâ€˜tish",
    columns: [
      { key: "email", label: "Email" },
      { key: "in_app", label: "In-app" },
      { key: "admin_email", label: "Admin email" },
      { key: "admin_in_app", label: "Admin in-app" },
    ],
  },
  {
    event: "new_order",
    label: "Yangi buyurtma",
    columns: [
      { key: "email", label: "Email" },
      { key: "in_app", label: "In-app" },
      { key: "admin_email", label: "Admin email" },
      { key: "admin_in_app", label: "Admin in-app" },
    ],
  },
  {
    event: "course_part_unlocked",
    label: "Kurs qismi ochildi",
    columns: [
      { key: "email", label: "Email" },
      { key: "in_app", label: "In-app" },
      { key: "admin_email", label: "Admin email" },
      { key: "admin_in_app", label: "Admin in-app" },
    ],
  },
];

type MatrixForm = Record<string, boolean>;

type NotificationsForm = {
  email_channel_enabled: boolean;
  sms_channel_enabled: boolean;
  inapp_channel_enabled: boolean;
} & MatrixForm;

function matrixToForm(matrix: Record<string, Record<string, boolean>>): MatrixForm {
  const result: MatrixForm = {};
  for (const row of MATRIX_ROWS) {
    const channels = matrix[row.event] ?? {};
    for (const column of row.columns) {
      result[`${row.event}.${column.key}`] = Boolean(channels[column.key]);
    }
  }
  return result;
}

function formToMatrix(form: MatrixForm): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = {};
  for (const row of MATRIX_ROWS) {
    result[row.event] = {};
    for (const column of row.columns) {
      result[row.event][column.key] = Boolean(form[`${row.event}.${column.key}`]);
    }
  }
  return result;
}

export function NotificationsTab({
  initial,
  providers,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: NotificationSettingsDTO;
  providers: ProviderStatusDTO;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: NotificationSettingsDTO) => void;
}) {
  const [form, setForm] = useState<NotificationsForm>(() => ({
    email_channel_enabled: initial.email_channel_enabled,
    sms_channel_enabled: initial.sms_channel_enabled,
    inapp_channel_enabled: initial.inapp_channel_enabled,
    ...matrixToForm(initial.event_matrix),
  }));
  const [error, setError] = useState("");

  useEffect(() => {
    const comparison = {
      email_channel_enabled: initial.email_channel_enabled,
      sms_channel_enabled: initial.sms_channel_enabled,
      inapp_channel_enabled: initial.inapp_channel_enabled,
      ...matrixToForm(initial.event_matrix),
    };
    onDirtyChange(dirtyFieldCount(comparison, form));
  }, [form, initial, onDirtyChange]);

  useEffect(
    () =>
      registerSave(async () => {
        setError("");
        try {
          const updated = await patchNotificationSettings({
            email_channel_enabled: form.email_channel_enabled,
            sms_channel_enabled: form.sms_channel_enabled,
            inapp_channel_enabled: form.inapp_channel_enabled,
            event_matrix: formToMatrix(form),
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

  function patch(partial: MatrixForm) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function toggleCell(event: string, key: string, value: boolean) {
    patch({ [`${event}.${key}`]: value });
  }

  return (
    <>
      <SettingsInlineError message={error} />
      <SettingsSection
        title="Kanallar"
        subtitle="Xabarnoma yuborish kanallari va provayder holati."
      >
        <div className="settings-channel-list">
          <div className="settings-channel">
            <SettingsSwitch
              label="Email"
              description="SMTP orqali xat joâ€˜natish"
              checked={form.email_channel_enabled}
              onChange={(email_channel_enabled) =>
                patch({ email_channel_enabled })
              }
            />
            {providers.email_configured ? (
              <SettingsBadge tone="success">Tayyor</SettingsBadge>
            ) : (
              <SettingsBadge tone="warning">Sozlanmagan</SettingsBadge>
            )}
          </div>
          <div className="settings-channel">
            <SettingsSwitch
              label="SMS / OTP"
              description="OTP kodlari va SMS xabarnomalar"
              checked={form.sms_channel_enabled}
              onChange={(sms_channel_enabled) => patch({ sms_channel_enabled })}
            />
            {providers.sms_configured ? (
              <SettingsBadge tone="success">Tayyor</SettingsBadge>
            ) : (
              <SettingsBadge tone="warning">Sozlanmagan</SettingsBadge>
            )}
          </div>
          <div className="settings-channel">
            <SettingsSwitch
              label="In-app"
              description="Platforma ichidagi bildirishnomalar"
              checked={form.inapp_channel_enabled}
              onChange={(inapp_channel_enabled) =>
                patch({ inapp_channel_enabled })
              }
            />
            <SettingsBadge tone="neutral">Doim faol</SettingsBadge>
          </div>
        </div>
        {!providers.sms_configured && (
          <p className="settings-hint">
            SMS kanalini yoqishdan oldin provayderni sozlang â€” aks holda
            backend sozlashni rad etadi.
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="Hodisa matritsasi"
        subtitle="Har bir hodisa uchun qaysi kanallarga xabarnoma yuborilishini belgilang."
      >
        <div className="settings-matrix-wrap">
          <table className="settings-matrix">
            <thead>
              <tr>
                <th>Hodisa</th>
                <th>Email</th>
                <th>In-app</th>
                <th>Admin email</th>
                <th>Admin in-app</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.event}>
                  <td className="settings-matrix-event">{row.label}</td>
                  {row.columns.map((column) => (
                    <td key={column.key}>
                      <label className="settings-matrix-toggle">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={Boolean(form[`${row.event}.${column.key}`])}
                          onChange={(event) =>
                            toggleCell(
                              row.event,
                              column.key,
                              event.currentTarget.checked,
                            )
                          }
                        />
                        <span aria-hidden="true" />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>
    </>
  );
}

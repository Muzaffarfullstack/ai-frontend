"use client";

import { useCallback, useEffect, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import {
  getAdminStatus,
  putFeatureFlags,
} from "@/features/admin/api/settings.api";
import type {
  AdminStatusDTO,
  EnvironmentDTO,
  FeatureFlagDTO,
  IntegrationStatusDTO,
} from "@/features/admin/types";
import { AdminError, AdminLoading } from "@/features/admin/components/admin-kit";
import {
  SettingsBadge,
  SettingsInlineError,
  SettingsSection,
  SettingsSwitch,
} from "./shared";

const STATUS_LABELS: Record<string, string> = {
  backend: "Backend API",
  database: "PostgreSQL",
  object_storage: "Object Storage",
  video_processing: "Video processing (Mux)",
  email: "Email",
  sms: "SMS / OTP",
};

function toneFor(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "ok") return "success";
  if (status === "degraded") return "danger";
  return "warning";
}

function statusLabel(status: string): string {
  if (status === "ok") return "Tayyor";
  if (status === "degraded") return "Xato";
  return "Sozlanmagan";
}

export function IntegrationsTab({
  flags,
  environment,
  t,
  onFlagsChanged,
}: {
  flags: FeatureFlagDTO[];
  environment: EnvironmentDTO;
  t: Translate;
  onFlagsChanged: (flags: FeatureFlagDTO[]) => void;
}) {
  const [status, setStatus] = useState<AdminStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);
  const [flagError, setFlagError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setStatusError("");
    try {
      setStatus(await getAdminStatus());
    } catch (reason) {
      setStatusError(localizedApiError(reason, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => void loadStatus());
  }, [loadStatus]);

  async function toggleFlag(flag: FeatureFlagDTO, enabled: boolean) {
    setToggleBusy(flag.name);
    setFlagError("");
    try {
      const updated = await putFeatureFlags([
        { name: flag.name, is_enabled: enabled },
      ]);
      onFlagsChanged(
        flags.map((item) => updated.find((next) => next.name === item.name) ?? item),
      );
    } catch (reason) {
      setFlagError(localizedApiError(reason, t));
    } finally {
      setToggleBusy(null);
    }
  }

  const statusRows = status
    ? (Object.keys(STATUS_LABELS) as Array<keyof AdminStatusDTO>).map(
        (key) => [key, status[key]] as [string, IntegrationStatusDTO],
      )
    : [];

  return (
    <>
      <SettingsInlineError message={flagError} />
      <SettingsSection
        title="Tizim integratsiyalari"
        subtitle="Barcha tashqi xizmatlarning jonli holati."
      >
        {loading ? (
          <AdminLoading />
        ) : statusError ? (
          <AdminError message={statusError} retry={() => void loadStatus()} />
        ) : (
          <div className="settings-integration-list">
            {statusRows.map(([key, row]) => (
              <div className="settings-provider-row" key={key}>
                <span className="settings-provider-name">{STATUS_LABELS[key]}</span>
                <SettingsBadge tone={toneFor(row.status)}>
                  {statusLabel(row.status)}
                </SettingsBadge>
                <small>{row.detail}</small>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Feature Flags"
        subtitle="Xususiyatlarni butun platformada yoqish yoki o‘chirish."
      >
        <div className="settings-switch-list">
          {flags.map((flag) => (
            <SettingsSwitch
              key={flag.name}
              label={flag.name}
              description={flag.description}
              checked={flag.is_enabled}
              disabled={toggleBusy !== null}
              onChange={(enabled) => void toggleFlag(flag, enabled)}
            />
          ))}
        </div>
        <p className="settings-hint">
          O‘zgarishlar darhol saqlanadi va backend hamda frontendda kuchga
          kiradi. Masalan, ro‘yxatdan o‘tish o‘chirilsa, register API 403
          qaytaradi.
        </p>
      </SettingsSection>

      <SettingsSection
        title="Muhit"
        subtitle="Joriy ishlash muhiti va versiya."
      >
        <div className="settings-env-grid">
          <div className="settings-env-card">
            <span>Environment</span>
            <b>{environment.name === "production" ? "Production" : environment.name}</b>
          </div>
          <div className="settings-env-card">
            <span>Versiya</span>
            <b>v{environment.version}</b>
          </div>
          <div className="settings-env-card">
            <span>API prefix</span>
            <b>{environment.api_prefix}</b>
          </div>
        </div>
      </SettingsSection>
    </>
  );
}

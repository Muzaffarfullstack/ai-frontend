import { apiRequest } from "@/lib/api-client";
import type {
  AdminSettingsDTO,
  AdminStatusDTO,
  AuthSettingsDTO,
  FeatureFlagDTO,
  LearningSettingsDTO,
  MediaSettingsDTO,
  NotificationSettingsDTO,
  PaymentSettingsDTO,
  PlatformSettingsDTO,
  SecuritySettingsDTO,
} from "@/features/admin/types";

export const getAdminSettings = () =>
  apiRequest<AdminSettingsDTO>("/admin/settings");

export const getAdminStatus = () => apiRequest<AdminStatusDTO>("/admin/status");

export const patchSettingsSection = <T>(
  section: string,
  payload: Record<string, unknown>,
) =>
  apiRequest<T>(`/admin/settings/${section}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const patchPlatformSettings = (payload: Partial<PlatformSettingsDTO>) =>
  patchSettingsSection<PlatformSettingsDTO>("general", payload);

export const patchAuthSettings = (payload: Partial<AuthSettingsDTO>) =>
  patchSettingsSection<AuthSettingsDTO>("auth", payload);

export const patchLearningSettings = (
  payload: Partial<LearningSettingsDTO>,
) => patchSettingsSection<LearningSettingsDTO>("learning", payload);

export const patchPaymentSettings = (payload: Partial<PaymentSettingsDTO>) =>
  patchSettingsSection<PaymentSettingsDTO>("payment", payload);

export const patchMediaSettings = (payload: Partial<MediaSettingsDTO>) =>
  patchSettingsSection<MediaSettingsDTO>("media", payload);

export const patchNotificationSettings = (
  payload: Partial<NotificationSettingsDTO>,
) => patchSettingsSection<NotificationSettingsDTO>("notifications", payload);

export const patchSecuritySettings = (
  payload: Partial<SecuritySettingsDTO>,
) => patchSettingsSection<SecuritySettingsDTO>("security", payload);

export const putFeatureFlags = (
  flags: Array<{ name: string; is_enabled: boolean }>,
) =>
  apiRequest<FeatureFlagDTO[]>("/admin/settings/feature-flags", {
    method: "PUT",
    body: JSON.stringify({ flags }),
  });

export const uploadSettingsLogo = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ logo_url: string }>("/admin/settings/logo", {
    method: "POST",
    body: form,
  });
};

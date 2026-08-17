export type { AdminSummary, UserProfile, UserRole } from "@/lib/api-client";

export type PlatformSettingsDTO = {
  title: string;
  public_url: string;
  support_email: string;
  reply_to_name: string;
  logo_url: string | null;
  default_lang: string;
  timezone: string;
};

export type AuthSettingsDTO = {
  login_method: "phone" | "email";
  otp_duration_minutes: number;
  otp_send_limit: number;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_number: boolean;
  password_breach_check: boolean;
  is_islamic_name_required: boolean;
  marketing_consent_required: boolean;
  registration_fields: Record<string, boolean>;
};

export type LearningSettingsDTO = {
  default_language: string;
  default_status: string;
  default_level: string;
  default_catalog_order: string;
  min_lessons_per_section: number;
  drag_and_drop_enabled: boolean;
  progress_threshold_percent: number;
  lesson_points: number;
  assignment_points: number;
  curriculum_lock_rules: Record<string, unknown>;
};

export type PaymentSettingsDTO = {
  currency: string;
  payment_method: string;
  enable_installments: boolean;
  installment_count: number;
  installment_percentages: number[];
  installment_part_conditions: Record<string, boolean>;
  payment_account_number: string | null;
  payment_company_name: string | null;
};

export type MediaSettingsDTO = {
  max_image_size_mb: number;
  max_document_size_mb: number;
  max_video_size_mb: number;
  enable_webp: boolean;
  keep_original_file: boolean;
  enable_signed_playback: boolean;
  playback_token_ttl_hours: number;
};

export type NotificationSettingsDTO = {
  email_channel_enabled: boolean;
  sms_channel_enabled: boolean;
  inapp_channel_enabled: boolean;
  event_matrix: Record<string, Record<string, boolean>>;
};

export type SecuritySettingsDTO = {
  session_duration_days: number;
  session_inactivity_days: number;
  max_login_attempts: number;
  block_duration_minutes: number;
  otp_rate_limit: number;
  admin_2fa_required: boolean;
  audit_log_enabled: boolean;
  audit_log_retention_days: number;
};

export type FeatureFlagDTO = {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  environment: string;
};

export type ProviderStatusDTO = {
  sms_configured: boolean;
  email_configured: boolean;
  mux_configured: boolean;
  object_storage_backend: string;
  object_storage_configured: boolean;
};

export type EnvironmentDTO = {
  name: string;
  version: string;
  api_prefix: string;
};

export type AdminSettingsDTO = {
  platform: PlatformSettingsDTO;
  auth: AuthSettingsDTO;
  learning: LearningSettingsDTO;
  payment: PaymentSettingsDTO;
  media: MediaSettingsDTO;
  notifications: NotificationSettingsDTO;
  security: SecuritySettingsDTO;
  feature_flags: FeatureFlagDTO[];
  providers: ProviderStatusDTO;
  media_readiness_percent: number;
  environment: EnvironmentDTO;
};

export type IntegrationStatusDTO = {
  status: "ok" | "degraded" | "unconfigured";
  detail: string;
};

export type AdminStatusDTO = {
  backend: IntegrationStatusDTO;
  database: IntegrationStatusDTO;
  object_storage: IntegrationStatusDTO;
  video_processing: IntegrationStatusDTO;
  email: IntegrationStatusDTO;
  sms: IntegrationStatusDTO;
  environment: EnvironmentDTO;
};

export type SettingsSectionKey =
  | "general"
  | "auth"
  | "learning"
  | "payment"
  | "media"
  | "notifications"
  | "security";

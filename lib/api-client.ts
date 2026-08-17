export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000/api/v1";

export type UserRole = "user" | "admin" | "mentor";
export type CourseStatus = "draft" | "published" | "archived";
export type LessonStatus = CourseStatus;
export type LessonType = "video" | "text" | "quiz" | "assignment";
export type OrderStatus = "pending" | "paid" | "cancelled" | "expired" | "refunded";
export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";
export type PaymentMode = "full" | "installment_3";
export type PaymentPlanStatus = "unassigned" | "assigned";
export type InstallmentStatus = "waiting" | "paid" | "overdue";
export type EnrollmentStatus = "active" | "expired" | "cancelled";
export type VideoStatus = "waiting_upload" | "processing" | "ready" | "failed";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUserDetail extends UserProfile {
  last_login_at: string | null;
  active_session_count: number;
  session_device: string | null;
  session_user_agent: string | null;
  session_ip_address: string | null;
}

export interface AdminUserPage {
  items: Array<UserProfile & { last_login_at?: string | null }>;
  total: number;
  offset: number;
  limit: number;
}

export interface AdminUserStats {
  total_users: number;
  active_users: number;
  unverified_users: number;
  blocked_users: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description?: string;
  category?: string | null;
  level?: string | null;
  language?: string;
  translations?: Record<string, Record<string, string>>;
  thumbnail_url: string | null;
  cover_alt_text?: string | null;
  promo_video_url?: string | null;
  price: string;
  currency: string;
  is_catalog_visible?: boolean;
  is_price_visible?: boolean;
  allow_full_payment?: boolean;
  allow_installments?: boolean;
  installment_amounts?: number[];
  is_enrollment_open?: boolean;
  access_duration_days?: number | null;
  status: CourseStatus;
  published_at?: string | null;
  updated_at?: string;
  section_count?: number;
  lesson_count?: number;
  published_lesson_count?: number;
  total_duration_seconds?: number;
  unlock_stages?: number[];
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  translations: Record<string, Record<string, string>>;
  position: number;
  unlock_stage: number;
  is_published: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  description: string | null;
  translations: Record<string, Record<string, string>>;
  lesson_type: LessonType;
  position: number;
  is_preview: boolean;
  status: LessonStatus;
  duration_seconds: number | null;
  content_payload: Record<string, unknown>;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  expires_at: string | null;
  created_at: string;
  access_stage?: number;
}

export interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: string;
  currency: string;
  status: OrderStatus;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  plan_status: PaymentPlanStatus;
  payment_mode: PaymentMode | null;
  agreed_total_amount: string | null;
  paid_amount: string;
  assigned_payment_account_id: string | null;
  assigned_at: string | null;
  agreement_note: string | null;
}

export interface AdminOrderPage {
  items: Order[];
  total: number;
  offset: number;
  limit: number;
}

export interface AdminOrderStats {
  total_orders: number;
  awaiting_plan: number;
  in_payment: number;
  completed: number;
}

export interface OrderInstallment {
  id: string;
  sequence: number;
  amount: string;
  due_date: string | null;
  status: InstallmentStatus;
  paid_at: string | null;
}

export interface OrderPaymentStatus {
  order: Order;
  payment_account: PaymentAccount | null;
  installments: OrderInstallment[];
  remaining_amount: string;
  access_stage: number;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_account_id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  installment_id?: string | null;
  reviewed_by_user_id?: string | null;
  receipt_file_key?: string;
  user_note?: string | null;
  created_at: string;
}

export interface AdminPaymentPage {
  items: Payment[];
  total: number;
  offset: number;
  limit: number;
}

export interface AdminPaymentStats {
  pending: number;
  confirmed_today: number;
  rejected: number;
  confirmed_month_amount: string;
  currency: string;
}

export interface PaymentAccount {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: "uzcard" | "humo" | "bank";
  card_holder_name: string;
  card_number: string;
  last4: string | null;
  currency: string;
  instructions: string | null;
  is_active: boolean;
  is_default: boolean;
  position: number;
}

export interface CourseReadinessIssue { code: string; message: string; entity_type: string; entity_id: string | null; route: string; }
export interface CourseReadiness { ready: boolean; score: number; issues: CourseReadinessIssue[]; }
export interface PromptModelAdmin { id:string; key:string; public_name:string; provider:string; media_type:"image"|"video"; description:string; is_active:boolean; is_public:boolean; display_order:number; supported_aspect_ratios:string[]; supported_durations:number[]; detail_levels:string[]; supports_reference_images:boolean; supports_start_end_frames:boolean; supports_multi_shot:boolean; supports_native_audio:boolean; supports_negative_prompt:boolean; system_instructions:string; instruction_version:string; updated_by_id:string|null; created_at:string; updated_at:string; }

export interface PaymentInstructions {
  order_id: string;
  amount: string;
  currency: string;
  payment_accounts: PaymentAccount[];
}

export interface VideoAsset {
  id: string;
  lesson_id: string;
  provider: string;
  upload_id: string | null;
  asset_id: string | null;
  playback_id: string | null;
  status: VideoStatus;
  duration_seconds: number | null;
  error_message: string | null;
}

export interface CourseWorkspaceStats {
  section_count: number;
  lesson_count: number;
  published_lesson_count: number;
  draft_lesson_count: number;
  total_duration_seconds: number;
}

export interface CourseWorkspace {
  course: Course;
  sections: Array<CourseSection & { lessons: Array<Lesson & { video_asset: VideoAsset | null }> }>;
  stats: CourseWorkspaceStats;
}

export interface VideoUpload {
  video_asset_id: string;
  upload_url: string;
  upload_id: string;
}

export interface VideoPlayback {
  playback_id: string;
  playback_token: string | null;
  expires_in: number | null;
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  last_position_seconds: number;
  furthest_position_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CourseProgress {
  course_id: string;
  completion_ratio: number;
  lessons: LessonProgress[];
}

export interface PromptResult {
  prompt: string;
  negative_prompt?: string | null;
  provider?: string;
  model?: string;
}

export type PromptMediaType = "image" | "video";

export interface PromptTargetCapability {
  key: string;
  label: string;
  mediaType: PromptMediaType;
  description: string;
  enabled: boolean;
  profileVersion: string;
  aspectRatios: string[];
  durationSeconds: number[];
  supportsReferenceImages: boolean;
  supportsStartEndFrames: boolean;
  supportsMultiShot: boolean;
  supportsNativeAudio: boolean;
  supportsNegativePrompt: boolean;
}

export interface PromptSections {
  subject: string;
  environment: string;
  composition: string;
  camera: string;
  lighting: string;
  atmosphere: string;
  actionOrMotion: string;
  visualStyle: string;
  technicalQuality: string;
  continuity: string | null;
  audio: string | null;
  constraints: string[];
}

export interface PromptShot {
  index: number;
  startSeconds: number | null;
  endSeconds: number | null;
  framing: string;
  subjectAction: string;
  camera: string;
  environment: string;
  lighting: string;
  audio: string | null;
  transition: string | null;
}

export interface PromptBuildInput {
  mediaType: PromptMediaType;
  targetKey: string;
  idea: string;
  outputLanguage: "uz" | "ru" | "en";
  aspectRatio?: string;
  style?: string;
  detailLevel: "standard" | "high";
  referenceDescription?: string;
  advanced: Record<string, unknown>;
  idempotencyKey: string;
}

export interface PromptBuildResult {
  id: string;
  mediaType: PromptMediaType;
  targetKey: string;
  targetLabel: string;
  profileVersion: string;
  title: string;
  finalPrompt: string;
  negativePrompt: string | null;
  sections: PromptSections;
  shotPlan: PromptShot[];
  assumptions: string[];
  warnings: string[];
  createdAt: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  points: number;
  completed_lessons?: number;
  watched_minutes?: number;
  completion_ratio: number;
  rank: number;
}

export interface LeaderboardResponse { entries: LeaderboardEntry[]; }

export interface GalleryPost {
  id: string;
  author_name: string;
  title: string;
  description: string | null;
  translations: Record<string, Record<string, string>>;
  media_url: string;
  media_type: "image" | "video";
  tool_name: string | null;
  is_featured: boolean;
  is_published: boolean;
  consent_confirmed: boolean;
  consent_confirmed_at: string | null;
  seo_alt_text: string | null;
}

export interface AdminSummary {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_courses: number;
  published_courses: number;
  active_enrollments: number;
  pending_orders: number;
  paid_orders: number;
  total_revenue: string;
  currency: string;
  processing_videos: number;
  failed_videos: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly fields: Record<string, string> = {},
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export type Translate = (key: string) => string;

export function localizedApiError(
  reason: unknown,
  t: Translate,
  fallbackKey = "errors.request_failed",
): string {
  if (reason instanceof ApiError) {
    const candidates = reason.code
      ? [`errors.${reason.code}`, `errors.${reason.code.toLowerCase()}`]
      : [];
    for (const key of candidates) {
      const message = t(key);
      if (message !== key) return message;
    }
    const statusKey = reason.status === 401
      ? "errors.unauthorized"
      : reason.status === 403
        ? "errors.forbidden"
        : reason.status === 404
          ? "errors.not_found"
          : reason.status === 409
            ? "errors.conflict"
            : reason.status === 429
              ? "errors.rate_limited"
              : reason.status >= 500
                ? "errors.service_unavailable"
                : fallbackKey;
    return t(statusKey);
  }
  return t(fallbackKey);
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("access_token");
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem("access_token", token);
  else window.sessionStorage.removeItem("access_token");
}

function errorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "So‘rov bajarilmadi";
  const value = body as { detail?: unknown; message?: unknown; error?: { message?: unknown } };
  if (typeof value.error?.message === "string") return value.error.message;
  if (typeof value.detail === "string") return value.detail;
  if (Array.isArray(value.detail)) {
    return value.detail
      .map((item) => typeof item === "object" && item && "msg" in item ? String(item.msg) : "")
      .filter(Boolean)
      .join("; ") || "Ma’lumotlar noto‘g‘ri kiritildi";
  }
  if (typeof value.message === "string") return value.message;
  return "So‘rov bajarilmadi";
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (
    response.status === 401 &&
    retry &&
    path !== "/auth/refresh" &&
    path !== "/auth/login"
  ) {
    const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-Device-ID": getDeviceId() },
    });
    if (refreshed.ok) {
      const data = (await refreshed.json()) as { access_token: string };
      setAccessToken(data.access_token);
      return apiRequest<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error =
      body && typeof body === "object" && "error" in body && body.error &&
      typeof body.error === "object"
        ? body.error as Record<string, unknown>
        : null;
    const code =
      error && typeof error.code === "string"
        ? error.code
        : undefined;
    const fields = error && error.fields && typeof error.fields === "object"
      ? Object.fromEntries(Object.entries(error.fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    const retryAfter = error && typeof error.retry_after_seconds === "number"
      ? error.retry_after_seconds
      : undefined;
    throw new ApiError(response.status, errorMessage(body), code, fields, retryAfter);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

type PromptTargetApi = {
  key: string;
  label: string;
  media_type: PromptMediaType;
  description: string;
  enabled: boolean;
  profile_version: string;
  aspect_ratios: string[];
  duration_seconds: number[];
  supports_reference_images: boolean;
  supports_start_end_frames: boolean;
  supports_multi_shot: boolean;
  supports_native_audio: boolean;
  supports_negative_prompt: boolean;
};

type PromptBuildApi = {
  id: string;
  media_type: PromptMediaType;
  target_key: string;
  target_label: string;
  profile_version: string;
  title: string;
  final_prompt: string;
  negative_prompt: string | null;
  sections: {
    subject: string;
    environment: string;
    composition: string;
    camera: string;
    lighting: string;
    atmosphere: string;
    action_or_motion: string;
    visual_style: string;
    technical_quality: string;
    continuity: string | null;
    audio: string | null;
    constraints: string[];
  };
  shot_plan: Array<{
    index: number;
    start_seconds: number | null;
    end_seconds: number | null;
    framing: string;
    subject_action: string;
    camera: string;
    environment: string;
    lighting: string;
    audio: string | null;
    transition: string | null;
  }>;
  assumptions: string[];
  warnings: string[];
  created_at: string;
};

export async function getPromptTargets(): Promise<PromptTargetCapability[]> {
  const response = await apiRequest<{ items: PromptTargetApi[] }>("/prompt-builder/targets");
  return response.items.map((item) => ({
    key: item.key,
    label: item.label,
    mediaType: item.media_type,
    description: item.description,
    enabled: item.enabled,
    profileVersion: item.profile_version,
    aspectRatios: item.aspect_ratios,
    durationSeconds: item.duration_seconds,
    supportsReferenceImages: item.supports_reference_images,
    supportsStartEndFrames: item.supports_start_end_frames,
    supportsMultiShot: item.supports_multi_shot,
    supportsNativeAudio: item.supports_native_audio,
    supportsNegativePrompt: item.supports_negative_prompt,
  }));
}

export async function buildPrompt(input: PromptBuildInput): Promise<PromptBuildResult> {
  const result = await apiRequest<PromptBuildApi>("/prompt-builder/build", {
    method: "POST",
    body: JSON.stringify({
      media_type: input.mediaType,
      target_key: input.targetKey,
      idea: input.idea,
      output_language: input.outputLanguage,
      aspect_ratio: input.aspectRatio,
      style: input.style,
      detail_level: input.detailLevel,
      reference_description: input.referenceDescription || null,
      reference_ids: [],
      advanced: input.advanced,
      idempotency_key: input.idempotencyKey,
    }),
  });
  return {
    id: result.id,
    mediaType: result.media_type,
    targetKey: result.target_key,
    targetLabel: result.target_label,
    profileVersion: result.profile_version,
    title: result.title,
    finalPrompt: result.final_prompt,
    negativePrompt: result.negative_prompt,
    sections: {
      subject: result.sections.subject,
      environment: result.sections.environment,
      composition: result.sections.composition,
      camera: result.sections.camera,
      lighting: result.sections.lighting,
      atmosphere: result.sections.atmosphere,
      actionOrMotion: result.sections.action_or_motion,
      visualStyle: result.sections.visual_style,
      technicalQuality: result.sections.technical_quality,
      continuity: result.sections.continuity,
      audio: result.sections.audio,
      constraints: result.sections.constraints,
    },
    shotPlan: result.shot_plan.map((shot) => ({
      index: shot.index,
      startSeconds: shot.start_seconds,
      endSeconds: shot.end_seconds,
      framing: shot.framing,
      subjectAction: shot.subject_action,
      camera: shot.camera,
      environment: shot.environment,
      lighting: shot.lighting,
      audio: shot.audio,
      transition: shot.transition,
    })),
    assumptions: result.assumptions,
    warnings: result.warnings,
    createdAt: result.created_at,
  };
}

export async function apiBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { headers, credentials: "include" });
  if (!response.ok) throw new ApiError(response.status, "Faylni yuklab bo‘lmadi");
  return response.blob();
}

export function getDeviceId() {
  if (typeof window === "undefined") return "web";
  const existing = window.localStorage.getItem("device_id");
  if (existing) return existing;
  const id = window.crypto?.randomUUID?.() ?? `web-${Date.now()}`;
  window.localStorage.setItem("device_id", id);
  return id;
}

export function parseContact(value: string) {
  const normalized = value.trim();
  return normalized.includes("@")
    ? { email: normalized.toLowerCase() }
    : { phone_number: normalized.replace(/[\s()-]/g, "") };
}

export function formatMoney(value: string | number, currency = "UZS") {
  return `${Number(value).toLocaleString("uz-UZ")} ${currency}`;
}

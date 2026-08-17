import {
  apiRequest,
  getDeviceId,
  parseContact,
  type UserProfile,
} from "@/lib/api-client";

export const getCurrentUser = () => apiRequest<UserProfile>("/users/me");
export async function loginUser(contact: string, password: string) {
  return apiRequest<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      ...parseContact(contact),
      password,
      device_id: getDeviceId(),
    }),
  });
}
export const registerUser = (input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
}) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      phone_number: input.phone.trim(),
      email: input.email?.trim().toLowerCase() || null,
      first_name: input.firstName,
      last_name: input.lastName || null,
      password: input.password,
    }),
  });
export const verifyContact = (contact: string, code: string) =>
  apiRequest("/auth/verify", {
    method: "POST",
    body: JSON.stringify({
      ...parseContact(contact),
      code,
      purpose: "register",
    }),
  });
export const resendCode = (
  contact: string,
  purpose: "register" | "reset_password" = "register",
) =>
  apiRequest("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ ...parseContact(contact), purpose }),
  });
export const requestPasswordReset = (contact: string) =>
  apiRequest("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify(parseContact(contact)),
  });
export const resetPasswordLegacy = (
  contact: string,
  code: string,
  password: string,
) =>
  apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      ...parseContact(contact),
      code,
      new_password: password,
    }),
  });
export async function verifyPasswordReset(contact: string, code: string) {
  const value = await apiRequest<{ reset_token: string; expires_in: number }>(
    "/auth/password-reset/verify",
    {
      method: "POST",
      body: JSON.stringify({ ...parseContact(contact), code }),
    },
  );
  return { resetToken: value.reset_token, expiresIn: value.expires_in };
}
export const completePasswordResetRequest = (
  resetToken: string,
  password: string,
  confirmation: string,
) =>
  apiRequest("/auth/password-reset/complete", {
    method: "POST",
    body: JSON.stringify({
      reset_token: resetToken,
      new_password: password,
      confirm_password: confirmation,
    }),
  });
export const logoutUser = () => apiRequest("/auth/logout", { method: "POST" });

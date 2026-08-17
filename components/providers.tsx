"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  setAccessToken,
  type UserProfile,
} from "@/lib/api-client";
import {
  completePasswordResetRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resendCode,
  resetPasswordLegacy,
  verifyContact,
  verifyPasswordReset,
} from "@/features/auth/api/auth.api";
import {
  dictionaries,
  type Locale,
} from "@/lib/i18n";

interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside AppProviders");
  return value;
}

interface AuthValue {
  user: UserProfile | null;
  loading: boolean;
  login: (contact: string, password: string) => Promise<UserProfile>;
  register: (input: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  verify: (contact: string, code: string) => Promise<void>;
  resend: (contact: string, purpose?: "register" | "reset_password") => Promise<void>;
  forgotPassword: (contact: string) => Promise<void>;
  resetPassword: (contact: string, code: string, password: string) => Promise<void>;
  verifyPasswordResetCode: (contact: string, code: string) => Promise<{ resetToken: string; expiresIn: number }>;
  completePasswordReset: (resetToken: string, password: string, confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AppProviders");
  return value;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = window.localStorage.getItem("locale");
    if (saved === "uz" || saved === "ru" || saved === "en") {
      queueMicrotask(() => setLocaleState(saved));
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("locale", next);
    document.documentElement.lang = next;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refreshUser().finally(() => setLoading(false)));
  }, [refreshUser]);

  const login = useCallback(async (contact: string, password: string) => {
    setAccessToken(null);
    const result = await loginUser(contact, password);
    setAccessToken(result.access_token);
    const profile = await getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      password: string;
    }) => {
      await registerUser(input);
    },
    [],
  );

  const verify = useCallback(async (contact: string, code: string) => {
    await verifyContact(contact, code);
  }, []);

  const resend = useCallback(async (contact: string, purpose: "register" | "reset_password" = "register") => {
    await resendCode(contact, purpose);
  }, []);

  const forgotPassword = useCallback(async (contact: string) => {
    await requestPasswordReset(contact);
  }, []);

  const resetPassword = useCallback(async (contact: string, code: string, password: string) => {
    await resetPasswordLegacy(contact, code, password);
  }, []);

  const verifyPasswordResetCode = useCallback(async (contact: string, code: string) => {
    return verifyPasswordReset(contact, code);
  }, []);

  const completePasswordReset = useCallback(async (resetToken: string, password: string, confirmation: string) => {
    await completePasswordResetRequest(resetToken, password, confirmation);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Logging out locally must still succeed if the API is restarting or offline.
    } finally {
      setAccessToken(null);
      setUser(null);
      router.replace("/");
    }
  }, [router]);

  const localeValue = useMemo<LocaleValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dictionaries[locale][key] ?? dictionaries.uz[key] ?? key,
    }),
    [locale, setLocale],
  );

  const authValue = useMemo<AuthValue>(
    () => ({ user, loading, login, register, verify, resend, forgotPassword, resetPassword, verifyPasswordResetCode, completePasswordReset, logout, refreshUser }),
    [user, loading, login, register, verify, resend, forgotPassword, resetPassword, verifyPasswordResetCode, completePasswordReset, logout, refreshUser],
  );

  return (
    <LocaleContext.Provider value={localeValue}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </LocaleContext.Provider>
  );
}

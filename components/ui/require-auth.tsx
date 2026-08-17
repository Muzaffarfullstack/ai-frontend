"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/providers";

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth(); const router = useRouter();
  useEffect(() => { if (!loading && (!user || (admin && user.role !== "admin"))) router.replace(user ? "/app" : "/auth"); }, [admin, loading, router, user]);
  if (loading) return <div className="center-screen"><span className="loader" /></div>;
  if (!user || (admin && user.role !== "admin")) return null;
  return children;
}

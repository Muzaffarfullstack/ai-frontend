"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/providers";
import { localizedApiError } from "@/lib/api-client";
import { getAdminResource } from "@/features/admin/api/admin.api";

export function useAdminResource<T>(path: string) {
  const { t } = useLocale(); const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const reload = useCallback(async () => { setLoading(true); setError(""); try { setData(await getAdminResource<T>(path)); } catch (reason) { setError(localizedApiError(reason, t)); } finally { setLoading(false); } }, [path, t]);
  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);
  return { data, loading, error, reload };
}

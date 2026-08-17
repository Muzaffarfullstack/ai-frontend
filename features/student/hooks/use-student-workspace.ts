"use client";

import { useCallback, useEffect, useState } from "react";
import { localizedApiError } from "@/lib/api-client";
import { useLocale } from "@/components/providers";
import { loadStudentWorkspace, type StudentWorkspace } from "@/features/student/api/student-workspace.api";

export function useStudentWorkspace() {
  const { t } = useLocale();
  const [data, setData] = useState<StudentWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loadStudentWorkspace());
    } catch (reason) {
      setError(localizedApiError(reason, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    loadStudentWorkspace().then((result) => { if (active) setData(result); }).catch((reason) => { if (active) setError(localizedApiError(reason, t)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  return { data, loading, error, reload };
}

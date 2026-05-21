"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuditTimelineEvent } from "@/types/admin";

export function useAdminAudit() {
  const { t } = useLocalizedScreen();
  const [events, setEvents] = useState<AuditTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/audit", {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message ||
            errorBody?.detail ||
            t("Unable to load audit data ({{response.status}})", {
              "response.status": response.status,
            }),
        );
      }

      const data = (await response.json()) as AuditTimelineEvent[];
      setEvents(data);
      setErrorMessage("");
    } catch (error) {
      setEvents([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("Unable to load audit data right now."),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchAudit();
  }, [fetchAudit]);

  return {
    events,
    loading,
    errorMessage,
    refreshAudit: fetchAudit,
  };
}

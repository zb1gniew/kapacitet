"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AccessRequest } from "@/types/admin";

export function useAdminAccessRequests() {
  const { t } = useLocalizedScreen();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/access-requests", {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message ||
            errorBody?.detail ||
            t("Unable to load admin data ({{response.status}})", {
              "response.status": response.status,
            }),
        );
      }

      const data = (await response.json()) as AccessRequest[];
      setRequests(data);
      setErrorMessage("");
    } catch (error) {
      setRequests([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("Unable to load admin data right now."),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    errorMessage,
    refreshRequests: fetchRequests,
  };
}

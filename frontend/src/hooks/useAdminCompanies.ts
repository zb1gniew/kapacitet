"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { CompanyRegistryRecord } from "@/types/admin";

export function useAdminCompanies() {
  const { t } = useLocalizedScreen();
  const [records, setRecords] = useState<CompanyRegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies", {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message ||
            errorBody?.detail ||
            t("Unable to load company registry ({{response.status}})", {
              "response.status": response.status,
            }),
        );
      }

      const data = (await response.json()) as CompanyRegistryRecord[];
      setRecords(data);
      setErrorMessage("");
    } catch (error) {
      setRecords([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("Unable to load company registry right now."),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  return {
    records,
    loading,
    errorMessage,
    refreshCompanies: fetchCompanies,
  };
}

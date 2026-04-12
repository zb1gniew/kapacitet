"use client";

import { useCallback, useEffect, useState } from "react";
import type { NetworkEscalationResponse } from "@/types/api-network-escalations";

type NetworkEscalationsDataState = {
  escalations: NetworkEscalationResponse[];
  loading: boolean;
  error: string | null;
  refreshEscalations: () => Promise<void>;
};

async function readErrorMessage(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null);

  return (
    errorBody?.message ||
    errorBody?.detail ||
    errorBody?.title ||
    `${fallback} (${response.status})`
  );
}

export function useNetworkEscalationsData(): NetworkEscalationsDataState {
  const [escalations, setEscalations] = useState<NetworkEscalationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshEscalations = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/network-escalations", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Unable to load network requests"),
        );
      }

      const data = (await response.json()) as NetworkEscalationResponse[];
      setEscalations(data);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load network requests right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshEscalations();
  }, [refreshEscalations]);

  return {
    escalations,
    loading,
    error,
    refreshEscalations,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AgreementResponse,
  MatchOfferResponse,
} from "@/types/api-matches";

type MatchesDataState = {
  matches: MatchOfferResponse[];
  agreements: AgreementResponse[];
  loading: boolean;
  error: string | null;
  refreshMatches: () => Promise<void>;
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

async function fetchMatchesEndpoint<T>(url: string, fallback: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }

  return (await response.json()) as T;
}

export function useMatchesData(): MatchesDataState {
  const [matches, setMatches] = useState<MatchOfferResponse[]>([]);
  const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMatches = useCallback(async () => {
    try {
      setLoading(true);

      const [matchesData, agreementsData] = await Promise.all([
        fetchMatchesEndpoint<MatchOfferResponse[]>(
          "/api/matches",
          "Unable to load matches",
        ),
        fetchMatchesEndpoint<AgreementResponse[]>(
          "/api/agreements",
          "Unable to load agreements",
        ),
      ]);

      setMatches(matchesData);
      setAgreements(agreementsData);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load matches right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMatches();
  }, [refreshMatches]);

  return {
    matches,
    agreements,
    loading,
    error,
    refreshMatches,
  };
}

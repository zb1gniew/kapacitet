"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AgreementResponse,
  AvailabilityDeclarationResponse,
  CapacityRequestResponse,
  MatchOfferResponse,
} from "@/types/api";

type DashboardDataState = {
  loading: boolean;
  error: string | null;
  availability: AvailabilityDeclarationResponse[];
  requests: CapacityRequestResponse[];
  matches: MatchOfferResponse[];
  agreements: AgreementResponse[];
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

async function fetchDashboardEndpoint<T>(url: string, fallback: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }

  return (await response.json()) as T;
}

export function useDashboardData(): DashboardDataState {
  const [availability, setAvailability] = useState<
    AvailabilityDeclarationResponse[]
  >([]);
  const [requests, setRequests] = useState<CapacityRequestResponse[]>([]);
  const [matches, setMatches] = useState<MatchOfferResponse[]>([]);
  const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [availabilityData, requestData, matchData, agreementData] =
        await Promise.all([
          fetchDashboardEndpoint<AvailabilityDeclarationResponse[]>(
            "/api/dashboard/availability",
            "Unable to load availability",
          ),
          fetchDashboardEndpoint<CapacityRequestResponse[]>(
            "/api/dashboard/requests",
            "Unable to load capacity requests",
          ),
          fetchDashboardEndpoint<MatchOfferResponse[]>(
            "/api/dashboard/matches",
            "Unable to load match offers",
          ),
          fetchDashboardEndpoint<AgreementResponse[]>(
            "/api/dashboard/agreements",
            "Unable to load agreements",
          ),
        ]);

      setAvailability(availabilityData);
      setRequests(requestData);
      setMatches(matchData);
      setAgreements(agreementData);
      setError(null);
    } catch (fetchError) {
      setAvailability([]);
      setRequests([]);
      setMatches([]);
      setAgreements([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load dashboard data right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  return {
    loading,
    error,
    availability,
    requests,
    matches,
    agreements,
  };
}

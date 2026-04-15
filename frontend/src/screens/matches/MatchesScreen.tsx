"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MatchesContent } from "@/components/matches/MatchesContent";
import { useMatchAction } from "@/hooks/useMatchAction";
import { useMatchesData } from "@/hooks/useMatchesData";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { deriveMatchesSummary } from "@/lib/matches/derive";
import type { AuthenticatedUser } from "@/types/auth";

type MatchesScreenProps = {
  user: AuthenticatedUser;
};

export function MatchesScreen({ user }: MatchesScreenProps) {
  const searchParams = useSearchParams();
  const { t } = useLocalizedScreen();
  const showAdminTab = isPlatformAdmin(user);
  const { matches, agreements, loading, error, refreshMatches } =
    useMatchesData();
  const { performAction, actionInProgress } = useMatchAction();
  const [toastError, setToastError] = useState("");
  const highlightedMatchId = Number(searchParams.get("matchId")) || null;
  const highlightedAgreementId =
    Number(searchParams.get("agreementId")) || null;

  useEffect(() => {
    if (!toastError) {
      return;
    }

    const timer = window.setTimeout(() => setToastError(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toastError]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const targetId = highlightedAgreementId
      ? `agreement-${highlightedAgreementId}`
      : highlightedMatchId
        ? `match-offer-${highlightedMatchId}`
        : null;

    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedAgreementId, highlightedMatchId, loading]);

  const summaryCards = useMemo(
    () => deriveMatchesSummary(t, matches, agreements),
    [agreements, matches, t],
  );

  const handleMatchAction = useCallback(
    async (
      matchId: number,
      action: "accept" | "decline" | "supplier-confirm" | "supplier-decline",
    ) => {
      const result = await performAction(matchId, action);

      if (result.ok) {
        await refreshMatches();
        return;
      }

      setToastError(result.error);
    },
    [performAction, refreshMatches],
  );

  const handleAccept = useCallback(
    async (matchId: number) => {
      await handleMatchAction(matchId, "accept");
    },
    [handleMatchAction],
  );

  const handleDecline = useCallback(
    async (matchId: number) => {
      await handleMatchAction(matchId, "decline");
    },
    [handleMatchAction],
  );

  const handleSupplierConfirm = useCallback(
    async (matchId: number) => {
      await handleMatchAction(matchId, "supplier-confirm");
    },
    [handleMatchAction],
  );

  const handleSupplierDecline = useCallback(
    async (matchId: number) => {
      await handleMatchAction(matchId, "supplier-decline");
    },
    [handleMatchAction],
  );

  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name="Matches"
      data-node-id="1:4605"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar
          t={t}
          activeItemKey="Matches"
          workspace={showAdminTab ? "platform" : "company"}
        />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} showSignOut={false} />
          <MatchesContent
            actionInProgress={actionInProgress}
            agreements={agreements}
            error={error}
            highlightedAgreementId={highlightedAgreementId}
            highlightedMatchId={highlightedMatchId}
            loading={loading}
            matches={matches}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onRetry={refreshMatches}
            onSupplierConfirm={handleSupplierConfirm}
            onSupplierDecline={handleSupplierDecline}
            summaryCards={summaryCards}
            t={t}
            toastError={toastError}
          />
        </div>
      </div>
    </main>
  );
}

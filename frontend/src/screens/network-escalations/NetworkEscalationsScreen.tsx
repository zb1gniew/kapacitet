"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { NetworkEscalationsContent } from "@/components/network-escalations/NetworkEscalationsContent";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { isCompanyManager } from "@/lib/auth/roles";
import { useNetworkEscalationAction } from "@/hooks/useNetworkEscalationAction";
import { useNetworkEscalationsData } from "@/hooks/useNetworkEscalationsData";
import type { NetworkResponseType } from "@/types/api-network-escalations";
import type { AuthenticatedUser } from "@/types/auth";

type NetworkEscalationsScreenProps = {
  user: AuthenticatedUser;
};

export function NetworkEscalationsScreen({
  user,
}: NetworkEscalationsScreenProps) {
  const searchParams = useSearchParams();
  const { t } = useLocalizedScreen();
  const { escalations, loading, error, refreshEscalations } =
    useNetworkEscalationsData();
  const { submitResponse, actionInProgress } = useNetworkEscalationAction();
  const [toastError, setToastError] = useState("");
  const highlightedRequestId = Number(searchParams.get("requestId")) || null;

  useEffect(() => {
    if (!toastError) {
      return;
    }

    const timer = window.setTimeout(() => setToastError(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toastError]);

  useEffect(() => {
    if (loading || !highlightedRequestId) {
      return;
    }

    const target = document.getElementById(
      `network-request-${highlightedRequestId}`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedRequestId, loading]);

  const handleRespond = useCallback(
    async (escalationId: number, responseType: NetworkResponseType) => {
      const result = await submitResponse(escalationId, responseType);

      if (result.ok) {
        await refreshEscalations();
        return;
      }

      setToastError(result.error);
    },
    [refreshEscalations, submitResponse],
  );

  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name="Network Requests"
      data-node-id="network-requests-screen"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} user={user} activeItemKey="Network requests" />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} showSignOut={false} />
          <NetworkEscalationsContent
            actionInProgress={actionInProgress}
            error={error}
            escalations={escalations}
            highlightedRequestId={highlightedRequestId}
            loading={loading}
            canManageCompany={isCompanyManager(user)}
            onRespond={handleRespond}
            onRetry={refreshEscalations}
            t={t}
            toastError={toastError}
          />
        </div>
      </div>
    </main>
  );
}

"use client";

import { useMemo } from "react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  deriveActionBanner,
  deriveActiveProcesses,
  deriveMetrics,
  deriveReminders,
} from "@/lib/dashboard/derive";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";

type DashboardScreenProps = {
  user: AuthenticatedUser;
};

export function DashboardScreen({ user }: DashboardScreenProps) {
  const { t } = useLocalizedScreen();
  const { loading, error, availability, requests, matches, agreements } =
    useDashboardData();

  const dashboard = useMemo<DashboardData>(
    () => ({
      metrics: deriveMetrics(availability, requests, matches),
      processes: deriveActiveProcesses(availability, requests, matches),
      reminders: deriveReminders(availability, requests, matches, agreements),
      banner: deriveActionBanner(availability, requests, matches),
    }),
    [agreements, availability, matches, requests],
  );

  const hasLoadedData =
    availability.length > 0 ||
    requests.length > 0 ||
    matches.length > 0 ||
    agreements.length > 0;

  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name="Dashboard"
      data-node-id="1:321"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} activeItemKey="Home" />
        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} />
          {loading && !hasLoadedData ? (
            <div className="px-4 pt-4 sm:px-6 lg:px-8">
              <div className="inline-flex items-center gap-3 rounded-[10px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <span>{t("Loading dashboard...")}</span>
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="px-4 pt-4 sm:px-6 lg:px-8">
              <div className="rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
                {error}
              </div>
            </div>
          ) : null}
          <DashboardContent t={t} dashboard={dashboard} loading={loading} />
        </div>
      </div>
    </main>
  );
}

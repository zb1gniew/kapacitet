"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MatchesContent } from "@/components/matches/MatchesContent";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type MatchesScreenProps = {
  user: AuthenticatedUser;
};

export function MatchesScreen({ user }: MatchesScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <main className="min-h-screen bg-[#f5f5f5]" data-name="Matches" data-node-id="1:4605">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} activeItemKey="Matches" />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} showSignOut={false} />
          <MatchesContent t={t} />
        </div>
      </div>
    </main>
  );
}

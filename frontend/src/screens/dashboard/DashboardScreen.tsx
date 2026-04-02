"use client";

import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { isPlatformAdmin } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/types/auth";

type DashboardScreenProps = {
  user: AuthenticatedUser;
};

export function DashboardScreen({ user }: DashboardScreenProps) {
  const { t } = useLocalizedScreen();
  const showAdminTab = isPlatformAdmin(user);

  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name="Dashboard"
      data-node-id="1:321"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar
          t={t}
          activeItemKey="Home"
          showAdminTab={showAdminTab}
        />
        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} />
          <DashboardContent t={t} />
        </div>
      </div>
    </main>
  );
}

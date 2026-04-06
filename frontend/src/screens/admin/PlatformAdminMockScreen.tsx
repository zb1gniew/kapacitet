"use client";

import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { PlatformMockPanel } from "@/components/admin/platform/PlatformMockPanel";
import { PlatformSummaryCard } from "@/components/admin/platform/PlatformSummaryCard";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type { DashboardNavItemKey } from "@/types/dashboard";

type PlatformAdminMockMetric = {
  label: string;
  value: string;
  helper: string;
  tone?: "blue" | "green" | "amber" | "slate";
};

type PlatformAdminMockPanel = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  actionLabel?: string;
};

type PlatformAdminMockScreenProps = {
  user: AuthenticatedUser;
  activeItemKey: DashboardNavItemKey;
  title: string;
  description: string;
  sidebarNote: string;
  metrics: PlatformAdminMockMetric[];
  panels: PlatformAdminMockPanel[];
  dataName: string;
  dataNodeId: string;
};

export function PlatformAdminMockScreen({
  user,
  activeItemKey,
  title,
  description,
  sidebarNote,
  metrics,
  panels,
  dataName,
  dataNodeId,
}: PlatformAdminMockScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <PlatformAdminLayout
      user={user}
      t={t}
      activeItemKey={activeItemKey}
      title={title}
      description={description}
      sidebarNote={sidebarNote}
      dataName={dataName}
      dataNodeId={dataNodeId}
    >
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <PlatformSummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {panels.map((panel) => (
          <PlatformMockPanel key={panel.title} {...panel} />
        ))}
      </section>
    </PlatformAdminLayout>
  );
}

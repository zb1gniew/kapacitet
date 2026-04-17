import type { DashboardData } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { ActionRequiredBanner } from "./sections/ActionRequiredBanner";
import { ActiveProcessesSection } from "./sections/ActiveProcessesSection";
import { DraftResumptionSection } from "./sections/DraftResumptionSection";
import { MetricsSection } from "./sections/MetricsSection";
import { PlatformOverviewPanel } from "./sections/PlatformOverviewPanel";
import { PrivacyPanel } from "./sections/PrivacyPanel";
import { QuickActionsSection } from "./sections/QuickActionsSection";
import { RemindersSection } from "./sections/RemindersSection";

type DashboardContentProps = {
  t: TranslateFn;
  dashboard: DashboardData;
  loading: boolean;
  userId: string;
};

export function DashboardContent({
  t,
  dashboard,
  loading,
  userId,
}: DashboardContentProps) {
  return (
    <div className="mx-auto w-full max-w-[1248px] space-y-4 p-4 sm:p-6 lg:p-8">
      <ActionRequiredBanner banner={dashboard.banner} />
      <MetricsSection metrics={dashboard.metrics} loading={loading} />
      <QuickActionsSection t={t} />
      <DraftResumptionSection t={t} userId={userId} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ActiveProcessesSection
          t={t}
          processes={dashboard.processes}
          loading={loading}
        />

        <div className="space-y-4">
          <RemindersSection
            t={t}
            reminders={dashboard.reminders}
            loading={loading}
          />
          <PrivacyPanel t={t} />
        </div>
      </section>
      <PlatformOverviewPanel t={t} dashboard={dashboard} loading={loading} />
    </div>
  );
}

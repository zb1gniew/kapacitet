import type { TranslateFn } from "@/types/i18n";
import { ActionRequiredBanner } from "./sections/ActionRequiredBanner";
import { ActiveProcessesSection } from "./sections/ActiveProcessesSection";
import { MetricsSection } from "./sections/MetricsSection";
import { PrivacyPanel } from "./sections/PrivacyPanel";
import { QuickActionsSection } from "./sections/QuickActionsSection";
import { RemindersSection } from "./sections/RemindersSection";

type DashboardContentProps = {
  t: TranslateFn;
};

export function DashboardContent({ t }: DashboardContentProps) {
  return (
    <div className="mx-auto w-full max-w-[1248px] space-y-4 p-4 sm:p-6 lg:p-8">
      <ActionRequiredBanner t={t} />
      <MetricsSection t={t} />
      <QuickActionsSection t={t} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ActiveProcessesSection t={t} />

        <div className="space-y-4">
          <RemindersSection t={t} />
          <PrivacyPanel t={t} />
        </div>
      </section>
    </div>
  );
}

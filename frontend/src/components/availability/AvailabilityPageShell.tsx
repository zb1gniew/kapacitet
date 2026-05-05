import type { ReactNode } from "react";
import { AVAILABILITY_STEPS } from "@/constants/availability";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { AuthenticatedUser } from "@/types/auth";
import type { DashboardNavItemKey } from "@/types/dashboard";
import type {
  AvailabilityStepDefinition,
  AvailabilityStepId,
} from "@/types/availability";
import type { TranslateFn } from "@/types/i18n";
import { AvailabilityStepProgress } from "./AvailabilityStepProgress";

type AvailabilityPageShellProps = {
  user: AuthenticatedUser;
  t: TranslateFn;
  currentStep: AvailabilityStepId;
  children: ReactNode;
  dataName: string;
  dataNodeId: string;
  activeItemKey?: DashboardNavItemKey;
  titleKey?: string;
  descriptionKey?: string;
  steps?: AvailabilityStepDefinition[];
};

export function AvailabilityPageShell({
  user,
  t,
  currentStep,
  children,
  dataName,
  dataNodeId,
  activeItemKey = "Declare availability",
  titleKey = "Declare availability",
  descriptionKey = "Share temporary capacity with your trusted network. Your declaration will be matched anonymously with companies requesting similar resources.",
  steps = AVAILABILITY_STEPS,
}: AvailabilityPageShellProps) {
  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name={dataName}
      data-node-id={dataNodeId}
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} user={user} activeItemKey={activeItemKey} />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} showSignOut={false} />

          <div className="mx-auto w-full max-w-[1024px] p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
              <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
                {t(titleKey)}
              </h1>
              <p className="mt-2 max-w-[901px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
                {t(descriptionKey)}
              </p>
            </header>

            <AvailabilityStepProgress
              currentStep={currentStep}
              t={t}
              steps={steps}
            />

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

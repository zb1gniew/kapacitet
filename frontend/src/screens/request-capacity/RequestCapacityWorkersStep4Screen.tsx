"use client";

import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySummaryCard } from "@/components/availability/AvailabilitySummaryCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { ShieldIcon } from "@/components/availability/icons";
import {
  REQUEST_CAPACITY_STEPS,
  REQUEST_CAPACITY_SUMMARY_SECTIONS,
} from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type RequestCapacityWorkersStep4ScreenProps = {
  user: AuthenticatedUser;
};

export function RequestCapacityWorkersStep4Screen({
  user,
}: RequestCapacityWorkersStep4ScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={4}
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers or equipment from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Step 4"
      dataNodeId="1:6374"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Review your capacity request")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Please review all details before publishing your request. You can edit any section by going back to the relevant step.",
          )}
        </p>

        <div className="mt-6 space-y-4">
          {REQUEST_CAPACITY_SUMMARY_SECTIONS.map((section) => (
            <AvailabilitySummaryCard key={section.id} section={section} t={t} />
          ))}

          <article className="rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-3 text-[#1c398e]">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm leading-[22.75px] tracking-[-0.1504px]">
                {t(
                  "By publishing this request, you confirm that the information is accurate and that you understand matching remains anonymized until cooperation is mutually approved.",
                )}
              </p>
            </div>
          </article>
        </div>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.requestCapacityWorkersStep3}
        nextHref={APP_ROUTES.dashboard}
        nextLabelKey="Publish request"
        nextVariant="success"
      />
    </AvailabilityPageShell>
  );
}

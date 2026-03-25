"use client";

import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilityResourceCard } from "@/components/availability/AvailabilityResourceCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { WorkersIcon } from "@/components/availability/icons";
import {
  REQUEST_CAPACITY_RESOURCE_OPTIONS,
  REQUEST_CAPACITY_STEPS,
} from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type RequestCapacityWorkersStep1ScreenProps = {
  user: AuthenticatedUser;
};

export function RequestCapacityWorkersStep1Screen({
  user,
}: RequestCapacityWorkersStep1ScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={1}
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Step 1"
      dataNodeId="1:2177"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("What workers do you need?")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Request temporary workers from other companies in your trusted network for a defined period.",
          )}
        </p>

        <div className="mt-6 flex justify-center">
          {REQUEST_CAPACITY_RESOURCE_OPTIONS.map((option) => {
            return (
              <AvailabilityResourceCard
                key={option.id}
                title={t(option.titleKey)}
                description={t(option.descriptionKey)}
                selected
                onSelect={() => undefined}
                icon={<WorkersIcon className="h-8 w-8" />}
                className="w-full max-w-[1116px]"
              />
            );
          })}
        </div>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backDisabled
        nextHref={APP_ROUTES.requestCapacityWorkersStep2}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}

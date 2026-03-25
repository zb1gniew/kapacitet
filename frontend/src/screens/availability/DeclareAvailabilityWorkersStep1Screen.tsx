"use client";

import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilityResourceCard } from "@/components/availability/AvailabilityResourceCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { WorkersIcon } from "@/components/availability/icons";
import { AVAILABILITY_RESOURCE_OPTIONS } from "@/constants/availability";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type DeclareAvailabilityWorkersStep1ScreenProps = {
  user: AuthenticatedUser;
};

export function DeclareAvailabilityWorkersStep1Screen({
  user,
}: DeclareAvailabilityWorkersStep1ScreenProps) {
  const { t } = useLocalizedScreen();

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={1}
      dataName="Declare Availability"
      dataNodeId="1:632"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("What workers do you want to share?")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Share available workers from your company with other trusted companies in the network for a defined period.",
          )}
        </p>

        <div className="mt-6 flex justify-center">
          {AVAILABILITY_RESOURCE_OPTIONS.map((option) => {
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
        nextHref={APP_ROUTES.declareAvailabilityWorkersStep2}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}

"use client";

import { useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilityResourceCard } from "@/components/availability/AvailabilityResourceCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { EquipmentIcon, WorkersIcon } from "@/components/availability/icons";
import { AVAILABILITY_RESOURCE_OPTIONS } from "@/constants/availability";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type { AvailabilityResourceType } from "@/types/availability";

type DeclareAvailabilityWorkersStep1ScreenProps = {
  user: AuthenticatedUser;
};

function getResourceIcon(resourceType: AvailabilityResourceType) {
  switch (resourceType) {
    case "equipment":
      return EquipmentIcon;
    default:
      return WorkersIcon;
  }
}

function getStep2Href(resourceType: AvailabilityResourceType) {
  switch (resourceType) {
    case "equipment":
      return APP_ROUTES.declareAvailabilityEquipmentStep2;
    default:
      return APP_ROUTES.declareAvailabilityWorkersStep2;
  }
}

export function DeclareAvailabilityWorkersStep1Screen({
  user,
}: DeclareAvailabilityWorkersStep1ScreenProps) {
  const { t } = useLocalizedScreen();
  const [selectedResource, setSelectedResource] =
    useState<AvailabilityResourceType | null>(null);

  const nextHref = selectedResource
    ? getStep2Href(selectedResource)
    : undefined;

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
          {t("What type of capacity do you want to share?")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Select the type of resource you can temporarily provide to other companies in your network.",
          )}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {AVAILABILITY_RESOURCE_OPTIONS.map((option) => {
            const Icon = getResourceIcon(option.id);

            return (
              <AvailabilityResourceCard
                key={option.id}
                title={t(option.titleKey)}
                description={t(option.descriptionKey)}
                selected={selectedResource === option.id}
                onSelect={() => setSelectedResource(option.id)}
                icon={<Icon className="h-8 w-8" />}
              />
            );
          })}
        </div>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backDisabled
        nextHref={nextHref}
        nextLabelKey="Continue"
        nextVariant={nextHref ? "primary" : "muted"}
      />
    </AvailabilityPageShell>
  );
}

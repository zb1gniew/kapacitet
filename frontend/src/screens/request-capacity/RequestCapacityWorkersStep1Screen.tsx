"use client";

import { useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilityResourceCard } from "@/components/availability/AvailabilityResourceCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { EquipmentIcon, WorkersIcon } from "@/components/availability/icons";
import {
  REQUEST_CAPACITY_RESOURCE_OPTIONS,
  REQUEST_CAPACITY_STEPS,
} from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type { AvailabilityResourceType } from "@/types/availability";

type RequestCapacityWorkersStep1ScreenProps = {
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
      return APP_ROUTES.requestCapacityEquipmentStep2;
    default:
      return APP_ROUTES.requestCapacityWorkersStep2;
  }
}

export function RequestCapacityWorkersStep1Screen({
  user,
}: RequestCapacityWorkersStep1ScreenProps) {
  const { t } = useLocalizedScreen();
  const [selectedResource, setSelectedResource] =
    useState<AvailabilityResourceType | null>(null);

  const nextHref = selectedResource ? getStep2Href(selectedResource) : undefined;

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={1}
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers or equipment from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Step 1"
      dataNodeId="1:2177"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("What type of capacity do you need?")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Select the type of resource you need temporarily from other companies in your network.",
          )}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {REQUEST_CAPACITY_RESOURCE_OPTIONS.map((option) => {
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

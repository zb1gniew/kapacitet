"use client";

import { useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type DeclareAvailabilityEquipmentStep2ScreenProps = {
  user: AuthenticatedUser;
};

type EquipmentConditionId = "good" | "very-good" | "excellent";

const EQUIPMENT_CONDITION_OPTIONS: ReadonlyArray<{
  id: EquipmentConditionId;
  labelKey: string;
}> = [
  { id: "good", labelKey: "Good" },
  { id: "very-good", labelKey: "Very good" },
  { id: "excellent", labelKey: "Excellent" },
];

function Label({
  label,
  required = true,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
      {label}
      {required ? <span className="text-red-600">*</span> : null}
    </label>
  );
}

export function DeclareAvailabilityEquipmentStep2Screen({
  user,
}: DeclareAvailabilityEquipmentStep2ScreenProps) {
  const { t } = useLocalizedScreen();
  const [selectedCondition, setSelectedCondition] =
    useState<EquipmentConditionId | null>(null);

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={2}
      dataName="Declare Availability Equipment Step 2"
      dataNodeId="28:2"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Equipment details")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Provide details about the capacity you're sharing. This information will be used for anonymous matching.",
          )}
        </p>

        <form className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label label={t("Number of equipment units")} />
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("e.g., 2")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label label={t("Equipment type")} />
            <input
              type="text"
              placeholder={t("e.g., Mobile crane, Excavator, Scaffolding")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label label={t("Equipment condition")} />
            <div className="grid gap-3 md:grid-cols-3">
              {EQUIPMENT_CONDITION_OPTIONS.map((option) => {
                const isSelected = selectedCondition === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedCondition(option.id)}
                    className={`h-[46px] rounded-[10px] border px-4 text-center text-sm font-medium tracking-[-0.1504px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-blue-300"
                    }`}
                  >
                    {t(option.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              label={`${t("Additional notes")} ${t("(Optional)")}`}
              required={false}
            />
            <textarea
              placeholder={t(
                "Add any additional information that might be relevant for matching...",
              )}
              className="h-[122px] w-full resize-none rounded-[10px] border border-neutral-300 px-4 py-3 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </form>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.declareAvailabilityWorkersStep1}
        nextHref={APP_ROUTES.declareAvailabilityEquipmentStep3}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}

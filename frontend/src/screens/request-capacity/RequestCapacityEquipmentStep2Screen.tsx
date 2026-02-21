"use client";

import { useState } from "react";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { AlertIcon } from "@/components/availability/icons";
import { REQUEST_CAPACITY_STEPS } from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";

type RequestCapacityEquipmentStep2ScreenProps = {
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

export function RequestCapacityEquipmentStep2Screen({
  user,
}: RequestCapacityEquipmentStep2ScreenProps) {
  const { t } = useLocalizedScreen();
  const [selectedCondition, setSelectedCondition] =
    useState<EquipmentConditionId | null>(null);

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={2}
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers or equipment from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Equipment Step 2"
      dataNodeId="1:3481"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Equipment requirements")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Specify your requirements. The platform will match your request with available capacity declarations.",
          )}
        </p>

        <form className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label label={t("Number of equipment units needed")} />
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("e.g., 2")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label label={t("Equipment type needed")} />
            <input
              type="text"
              placeholder={t("e.g., Mobile crane, Excavator, Scaffolding")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label
              label={`${t("Preferred equipment condition")} ${t("(Optional - improves match quality)")}`}
              required={false}
            />

            <div className="flex items-start gap-2 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-3 py-3 text-[#193cb8]">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-[19.5px] tracking-[-0.1172px]">
                {t(
                  "Setting preferences helps find better matches but may reduce the number of available options.",
                )}
              </p>
            </div>

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
              label={`${t("Additional requirements or notes")} ${t("(Optional)")}`}
              required={false}
            />
            <textarea
              placeholder={t(
                "Add any specific requirements or details that will help with matching...",
              )}
              className="h-[122px] w-full resize-none rounded-[10px] border border-neutral-300 px-4 py-3 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </form>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.requestCapacityWorkersStep1}
        nextHref={APP_ROUTES.requestCapacityEquipmentStep3}
        nextLabelKey="Continue"
        nextVariant="primary"
      />
    </AvailabilityPageShell>
  );
}

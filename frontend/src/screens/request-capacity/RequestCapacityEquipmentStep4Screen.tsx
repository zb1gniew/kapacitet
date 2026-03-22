"use client";

import Link from "next/link";
import { useState } from "react";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySummaryCard } from "@/components/availability/AvailabilitySummaryCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import {
  ArrowLeftIcon,
  PublishIcon,
  ResourceSummaryIcon,
} from "@/components/availability/icons";
import {
  REQUEST_CAPACITY_EQUIPMENT_SUMMARY_SECTIONS,
  REQUEST_CAPACITY_NEXT_STEPS,
  REQUEST_CAPACITY_STEPS,
} from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";

type RequestCapacityEquipmentStep4ScreenProps = {
  user: AuthenticatedUser;
};

type RequestCapacityReviewActionProps = {
  t: TranslateFn;
  canSubmit: boolean;
};

type RequestCapacityNextStepProps = {
  title: string;
  description: string;
  order: number;
};

function RequestCapacityNextStep({
  title,
  description,
  order,
}: RequestCapacityNextStepProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-blue-600 text-xs font-bold text-white">
        {order}
      </div>
      <div>
        <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-[#1c398e]">
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-[19.5px] tracking-[-0.1172px] text-[#193cb8]">
          {description}
        </p>
      </div>
    </div>
  );
}

function RequestCapacityReviewActions({
  t,
  canSubmit,
}: RequestCapacityReviewActionProps) {
  const submitHref = canSubmit ? APP_ROUTES.dashboard : undefined;

  return (
    <div className="mt-8 flex items-center justify-between">
      <Link
        href={APP_ROUTES.requestCapacityEquipmentStep3}
        className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-neutral-200 px-6 text-base font-semibold tracking-[-0.3125px] text-neutral-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-neutral-300"
      >
        <ArrowLeftIcon className="h-[18px] w-[18px]" />
        {t("Back")}
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href={APP_ROUTES.dashboard}
          className="inline-flex h-12 items-center rounded-[10px] bg-neutral-200 px-6 text-base font-semibold tracking-[-0.3125px] text-neutral-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-neutral-300"
        >
          {t("Save draft")}
        </Link>

        {submitHref ? (
          <Link
            href={submitHref}
            className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#00a63e] px-8 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition hover:bg-[#009137]"
          >
            <PublishIcon className="h-[18px] w-[18px]" />
            {t("Submit request")}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#f5f5f5] px-8 text-base font-semibold tracking-[-0.3125px] text-neutral-400 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]"
          >
            <PublishIcon className="h-[18px] w-[18px]" />
            {t("Submit request")}
          </button>
        )}
      </div>
    </div>
  );
}

export function RequestCapacityEquipmentStep4Screen({
  user,
}: RequestCapacityEquipmentStep4ScreenProps) {
  const { t } = useLocalizedScreen();
  const [confirmedTemporaryCooperation, setConfirmedTemporaryCooperation] =
    useState(false);

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={4}
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers or equipment from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Equipment Step 4"
      dataNodeId="1:3672"
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
          {REQUEST_CAPACITY_EQUIPMENT_SUMMARY_SECTIONS.map((section) => (
            <AvailabilitySummaryCard key={section.id} section={section} t={t} />
          ))}

          <article className="rounded-[14px] border border-[#bedbff] bg-[#eff6ff] p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe] text-blue-600 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
                <ResourceSummaryIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-6 tracking-[-0.3125px] text-[#1c398e]">
                  {t("What happens next")}
                </h3>
                <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px] text-[#193cb8]">
                  {t(
                    "After submitting, the platform will automatically process your request through these steps:",
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {REQUEST_CAPACITY_NEXT_STEPS.map((step) => (
                <RequestCapacityNextStep
                  key={step.id}
                  order={step.id}
                  title={t(step.titleKey)}
                  description={t(step.descriptionKey)}
                />
              ))}
            </div>
          </article>

          <article className="rounded-[10px] border border-neutral-300 bg-white p-5 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmedTemporaryCooperation}
                onChange={(event) =>
                  setConfirmedTemporaryCooperation(event.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
              />
              <span>
                <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
                  {t("I confirm this is temporary cooperation only")}
                </p>
                <p className="mt-1 text-xs leading-[19.5px] tracking-[-0.1172px] text-neutral-600">
                  {t(
                    "This request is for temporary capacity sharing between companies, not for hiring, recruitment, or employment transfer. All matches require explicit approval from both parties before any cooperation begins.",
                  )}
                </p>
              </span>
            </label>
          </article>
        </div>
      </AvailabilitySurfaceCard>

      <RequestCapacityReviewActions
        t={t}
        canSubmit={confirmedTemporaryCooperation}
      />
    </AvailabilityPageShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityFieldLabel } from "@/components/availability/AvailabilityFieldLabel";
import { AvailabilityMultiSelectMenu } from "@/components/availability/AvailabilityMultiSelectMenu";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { AlertIcon } from "@/components/availability/icons";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { useStoredWorkflowDraft } from "@/hooks/useStoredWorkflowDraft";
import { useWorkflowCatalog } from "@/hooks/useWorkflowCatalog";
import {
  DEFAULT_AVAILABILITY_DRAFT,
  EXPERIENCE_LEVEL_OPTIONS,
  getAvailabilityDraftStorageKey,
  isWorkerDetailsStepComplete,
} from "@/lib/workflows/payloads";
import type { AuthenticatedUser } from "@/types/auth";

type DeclareAvailabilityWorkersStep2ScreenProps = { user: AuthenticatedUser };

export function DeclareAvailabilityWorkersStep2Screen({
  user,
}: DeclareAvailabilityWorkersStep2ScreenProps) {
  const router = useRouter();
  const { t } = useLocalizedScreen();
  const {
    catalog,
    errorMessage: catalogError,
    isLoading,
  } = useWorkflowCatalog();
  const { draft, setField, toggleListValue } = useStoredWorkflowDraft(
    getAvailabilityDraftStorageKey(user.sub),
    DEFAULT_AVAILABILITY_DRAFT,
  );
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const canContinue = isWorkerDetailsStepComplete(draft);

  function handleContinue() {
    if (!canContinue) {
      setShowValidationMessage(true);
      return;
    }

    setShowValidationMessage(false);
    router.push(APP_ROUTES.declareAvailabilityWorkersStep3);
  }

  const experienceLevelLabels: Record<
    (typeof EXPERIENCE_LEVEL_OPTIONS)[number],
    string
  > = {
    junior: "Junior (0-3 years)",
    mid: "Mid-level (3-7 years)",
    senior: "Senior (7+ years)",
  };

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={2}
      dataName="Declare Availability Step 2"
      dataNodeId="1:810"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Worker details")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Provide details about the capacity you're sharing. This information will be used for anonymous matching.",
          )}
        </p>

        <form className="mt-6 space-y-6">
          <div className="space-y-2">
            <AvailabilityFieldLabel label={t("Number of workers available")} />
            <input
              type="number"
              inputMode="numeric"
              value={draft.quantity}
              onChange={(event) => setField("quantity", event.target.value)}
              placeholder={t("e.g., 3")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <AvailabilityFieldLabel label={t("Skill or trade")} />
            <AvailabilityMultiSelectMenu
              items={catalog?.skills ?? []}
              selectedIds={draft.skillIds}
              onToggle={(id) => toggleListValue("skillIds", id)}
              onClearAll={() => setField("skillIds", [])}
              buttonPlaceholder={t("Choose from list")}
              searchPlaceholder={t("Search skills or certificates")}
              emptyMessage={t("No options match your search.")}
              selectedLabel={t("selected")}
              selectedItemsLabel={t("Selected items")}
              clearAllLabel={t("Clear all")}
            />
          </div>

          <div className="space-y-2">
            <AvailabilityFieldLabel
              label={t("Experience level")}
              required={false}
            />
            <div className="grid gap-3 md:grid-cols-3">
              {EXPERIENCE_LEVEL_OPTIONS.map((option) => {
                const selected = draft.experienceLevel === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setField("experienceLevel", selected ? "" : option)
                    }
                    className={`rounded-[10px] border p-4 text-left shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition ${
                      selected
                        ? "border-blue-600 bg-[#eff6ff]"
                        : "border-neutral-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
                      {t(experienceLevelLabels[option])}
                    </p>
                  </button>
                );
              })}
            </div>
            {draft.experienceLevel ? (
              <button
                type="button"
                onClick={() => setField("experienceLevel", "")}
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                {t("Clear selection")}
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            <AvailabilityFieldLabel label={t("Required certificates")} />

            <div className="flex items-start gap-2 rounded-[10px] border border-[#fee685] bg-[#fffbeb] px-4 py-4 text-[#973c00]">
              <AlertIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
              <p className="text-xs leading-[19.5px] tracking-[-0.1172px]">
                {t(
                  "Certificates are mandatory for matching. Only select certificates that workers currently hold.",
                )}
              </p>
            </div>

            <AvailabilityMultiSelectMenu
              items={catalog?.certificates ?? []}
              selectedIds={draft.certificateIds}
              onToggle={(id) => toggleListValue("certificateIds", id)}
              onClearAll={() => setField("certificateIds", [])}
              buttonPlaceholder={t("Choose from list")}
              searchPlaceholder={t("Search skills or certificates")}
              emptyMessage={t("No options match your search.")}
              selectedLabel={t("selected")}
              selectedItemsLabel={t("Selected items")}
              clearAllLabel={t("Clear all")}
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-600">
              {t("Loading skills and certificates...")}
            </p>
          ) : null}

          {catalogError ? (
            <p className="rounded-[10px] border border-[#fca5a5] bg-[#fff5f5] p-3 text-sm text-[#b91c1c]">
              {t(catalogError)}
            </p>
          ) : null}

          {!canContinue && showValidationMessage ? (
            <p className="rounded-[10px] border border-[#fca5a5] bg-[#fff5f5] p-3 text-sm text-[#b91c1c]">
              {t(
                "Add a worker quantity, at least one skill, and at least one certificate to continue.",
              )}
            </p>
          ) : null}
        </form>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.declareAvailabilityWorkersStep1}
        nextLabelKey="Continue"
        nextVariant="primary"
        onNextClick={handleContinue}
      />
    </AvailabilityPageShell>
  );
}

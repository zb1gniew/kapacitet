"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityFieldLabel } from "@/components/availability/AvailabilityFieldLabel";
import { AvailabilityMultiSelectMenu } from "@/components/availability/AvailabilityMultiSelectMenu";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { WorkflowHintsPanel } from "@/components/availability/WorkflowHintsPanel";
import { AlertIcon } from "@/components/availability/icons";
import { useWorkflowHints } from "@/hooks/useWorkflowHints";
import { REQUEST_CAPACITY_STEPS } from "@/constants/request-capacity";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { useStoredWorkflowDraft } from "@/hooks/useStoredWorkflowDraft";
import { useWorkflowCatalog } from "@/hooks/useWorkflowCatalog";
import {
  DEFAULT_CAPACITY_REQUEST_DRAFT,
  EXPERIENCE_LEVEL_OPTIONS,
  MAX_WORKER_QUANTITY,
  getCapacityRequestDraftStorageKey,
  isWorkerDetailsStepComplete,
} from "@/lib/workflows/payloads";
import type { AuthenticatedUser } from "@/types/auth";

type RequestCapacityWorkersStep2ScreenProps = { user: AuthenticatedUser };

export function RequestCapacityWorkersStep2Screen({
  user,
}: RequestCapacityWorkersStep2ScreenProps) {
  const router = useRouter();
  const { t } = useLocalizedScreen();
  const {
    catalog,
    errorMessage: catalogError,
    isLoading,
  } = useWorkflowCatalog();
  const { draft, setField, toggleListValue } = useStoredWorkflowDraft(
    getCapacityRequestDraftStorageKey(user.sub),
    DEFAULT_CAPACITY_REQUEST_DRAFT,
  );
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const canContinue = isWorkerDetailsStepComplete(draft);
  const { hints, isLoading: hintsLoading } = useWorkflowHints(
    "request",
    draft,
    2,
  );

  function handleContinue() {
    if (!canContinue) {
      setShowValidationMessage(true);
      return;
    }

    setShowValidationMessage(false);
    router.push(APP_ROUTES.requestCapacityWorkersStep3);
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
      activeItemKey="Request capacity"
      titleKey="Request capacity"
      descriptionKey="Request temporary workers from your trusted network. The platform will match your needs with declared availability anonymously."
      steps={REQUEST_CAPACITY_STEPS}
      dataName="Request Capacity Step 2"
      dataNodeId="1:2356"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Worker requirements")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Specify your requirements. The platform will match your request with available capacity declarations.",
          )}
        </p>

        <form className="mt-6 space-y-6">
          <div className="space-y-2">
            <AvailabilityFieldLabel label={t("Number of workers needed")} />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_WORKER_QUANTITY}
              value={draft.quantity}
              onChange={(event) => setField("quantity", event.target.value)}
              placeholder={t("e.g., 3")}
              className="h-[50px] w-full rounded-[10px] border border-neutral-300 px-4 text-base tracking-[-0.3125px] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] placeholder:text-neutral-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <AvailabilityFieldLabel label={t("Trade or skill required")} />
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
              label={t("Preferred experience level")}
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

            {draft.certificateIds.length === 0 && (
              <div className="rounded-[10px] border border-[#ffa2a2] bg-[#fef2f2] p-4 text-[#9f0712] shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
                <div className="flex items-start gap-2">
                  <AlertIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#e7000b]" />
                  <div>
                    <p className="text-sm font-bold leading-5 tracking-[-0.1504px] text-[#82181a]">
                      {t("Mandatory for compliance and matching")}
                    </p>
                    <p className="mt-1 text-xs leading-[19.5px] tracking-[-0.1172px]">
                      {t(
                        "Select all certificates that workers must hold. Only capacity with these exact certificates will be matched. This ensures safety and legal compliance.",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

          <WorkflowHintsPanel
            hints={hints}
            isLoading={hintsLoading}
            flow="request"
          />

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
        backHref={APP_ROUTES.requestCapacityWorkersStep1}
        nextLabelKey="Continue"
        nextVariant="primary"
        onNextClick={handleContinue}
      />
    </AvailabilityPageShell>
  );
}

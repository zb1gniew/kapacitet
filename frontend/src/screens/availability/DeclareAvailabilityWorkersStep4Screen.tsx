"use client";

import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySummaryCard } from "@/components/availability/AvailabilitySummaryCard";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { ShieldIcon } from "@/components/availability/icons";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { useStoredWorkflowDraft } from "@/hooks/useStoredWorkflowDraft";
import { useWorkflowCatalog } from "@/hooks/useWorkflowCatalog";
import { useWorkflowPublish } from "@/hooks/useWorkflowPublish";
import {
  buildAvailabilityCreatePayload,
  DEFAULT_AVAILABILITY_DRAFT,
  getAvailabilityDraftStorageKey,
} from "@/lib/workflows/payloads";
import { buildAvailabilitySummarySections } from "@/lib/workflows/summary";
import type { AuthenticatedUser } from "@/types/auth";

type DeclareAvailabilityWorkersStep4ScreenProps = {
  user: AuthenticatedUser;
};

export function DeclareAvailabilityWorkersStep4Screen({
  user,
}: DeclareAvailabilityWorkersStep4ScreenProps) {
  const { t } = useLocalizedScreen();
  const { catalog, errorMessage: catalogError } = useWorkflowCatalog();
  const { draft, clientKey, clearDraft } = useStoredWorkflowDraft(
    getAvailabilityDraftStorageKey(user.sub),
    DEFAULT_AVAILABILITY_DRAFT,
  );
  const payloadResult = catalog
    ? buildAvailabilityCreatePayload(draft, catalog, clientKey)
    : {
        ok: false as const,
        errors: [
          catalogError || "Loading the worker catalog before publishing.",
        ],
      };
  const { errorMessage, fieldErrors, isSubmitting, publish } =
    useWorkflowPublish({
      clearDraft,
      getPayload: () =>
        catalog
          ? buildAvailabilityCreatePayload(draft, catalog, clientKey)
          : {
              ok: false as const,
              errors: [
                catalogError || "Loading the worker catalog before publishing.",
              ],
            },
      endpoint: "/api/availability/publish",
      successRoute: APP_ROUTES.dashboard,
      submitErrorMessage:
        "We couldn't publish the availability. Please check the entered data and try again.",
      networkErrorMessage:
        "We couldn't reach the backend to publish the availability.",
    });
  const summarySections = buildAvailabilitySummarySections(
    payloadResult.ok ? payloadResult.value : null,
    catalog,
  );
  const publishErrors = [
    ...Object.values(fieldErrors).flat(),
    ...(errorMessage ? [errorMessage] : []),
  ];

  return (
    <AvailabilityPageShell
      user={user}
      t={t}
      currentStep={4}
      dataName="Declare Availability Step 4"
      dataNodeId="1:1244"
    >
      <AvailabilitySurfaceCard>
        <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
          {t("Review your availability declaration")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Please review all details before publishing. You can edit any section by going back to the relevant step.",
          )}
        </p>

        <div className="mt-6 space-y-4">
          {summarySections.map((section) => (
            <AvailabilitySummaryCard key={section.id} section={section} t={t} />
          ))}

          {publishErrors.length > 0 ? (
            <div className="rounded-[10px] border border-[#fca5a5] bg-[#fff5f5] p-3 text-sm text-[#b91c1c]">
              {publishErrors.map((message) => (
                <p key={message}>{t(message)}</p>
              ))}
            </div>
          ) : null}

          <article className="rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-3 text-[#1c398e]">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm leading-[22.75px] tracking-[-0.1504px]">
                {t(
                  "By publishing this availability, you confirm that the information is accurate and that you understand this is for temporary capacity sharing within your trusted network. Worker identities remain anonymous until you approve specific matches.",
                )}
              </p>
            </div>
          </article>
        </div>
      </AvailabilitySurfaceCard>

      <AvailabilityActionBar
        t={t}
        backHref={APP_ROUTES.declareAvailabilityWorkersStep3}
        nextLabelKey={isSubmitting ? "Publishing..." : "Publish availability"}
        nextVariant="success"
        nextDisabled={isSubmitting}
        onNextClick={publish}
      />
    </AvailabilityPageShell>
  );
}

"use client";

import { AvailabilityActionBar } from "@/components/availability/AvailabilityActionBar";
import { AvailabilityPageShell } from "@/components/availability/AvailabilityPageShell";
import { AvailabilitySurfaceCard } from "@/components/availability/AvailabilitySurfaceCard";
import { WorkersIcon } from "@/components/availability/icons";
import { REQUEST_CAPACITY_STEPS } from "@/constants/request-capacity";
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
          {t("Request capacity")}
        </h2>
        <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
          {t(
            "Use this flow to request temporary worker capacity from trusted companies in your network for a defined assignment or time period.",
          )}
        </p>

        <div className="mt-6 rounded-[14px] border border-blue-200 bg-[#eff6ff] p-5 shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-white text-blue-700 shadow-[0_4px_6px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)]">
              <WorkersIcon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                {t("What you request")}
              </h3>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                {t(
                  "You request the trade, quantity, certificates, timing, and location for the temporary workforce support your company needs.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <article className="rounded-[12px] border border-blue-100 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                {t("Step 2")}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {t("Requirements")}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {t(
                  "Add worker quantity, trade, and the certificates you require.",
                )}
              </p>
            </article>
            <article className="rounded-[12px] border border-blue-100 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                {t("Step 3")}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {t("Time and location")}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {t("Set dates, location, radius, and urgency for the request.")}
              </p>
            </article>
            <article className="rounded-[12px] border border-blue-100 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                {t("Step 4")}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {t("Result")}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {t(
                  "Review the request and publish it for matching across the network.",
                )}
              </p>
            </article>
          </div>

          <div className="mt-4 rounded-[12px] border border-blue-100 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
              {t("How it works")}
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">
              {t(
                "Once published, your request is matched against active worker availability in the trusted network. If relevant capacity is found, the platform opens a match process that can move to review, confirmation, and agreement.",
              )}
            </p>
          </div>
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

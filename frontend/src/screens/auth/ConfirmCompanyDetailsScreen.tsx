"use client";

import Link from "next/link";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProgressDots } from "@/components/auth/OnboardingProgressDots";
import { ArrowRightIcon } from "@/components/auth/icons";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";

export function ConfirmCompanyDetailsScreen() {
  const { t } = useLocalizedScreen();

  return (
    <AuthShell
      maxWidthClassName="max-w-[672px]"
      dataName="Welcome Screen 2"
      dataNodeId="1:234"
    >
      <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
        <header>
          <h1 className="text-[24px] font-bold leading-8 tracking-[0.0703px] text-neutral-900">
            {t("Confirm company details")}
          </h1>
          <p className="mt-3 max-w-[570px] text-base leading-[26px] tracking-[-0.3125px] text-neutral-600">
            {t(
              "Review and confirm the information associated with your company account. This information will be visible to cooperation partners after mutual confirmation.",
            )}
          </p>
        </header>

        <div className="mt-8 space-y-5">
          <AuthField
            id="readonlyCompanyName"
            label={t("Company name")}
            value={t("Dansk Byggefirma A/S")}
            readOnly
            helperText={t("Contact platform support to change company name")}
          />
          <AuthField
            id="readonlyIndustry"
            label={t("Industry")}
            value={t("Bygge & Anlæg")}
            readOnly
          />
          <AuthField
            id="readonlyLocation"
            label={t("Primary location")}
            value={t("Sønderborg, Danmark")}
            readOnly
          />
          <AuthField
            id="readonlyEmail"
            label={t("Contact email")}
            value={t("admin@danskbyggefirma.dk")}
            readOnly
          />
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={APP_ROUTES.onboardingFirstAction}
              className="inline-flex h-[54px] w-full items-center justify-center rounded-[10px] border border-neutral-300 text-base font-semibold tracking-[-0.3125px] text-neutral-700 transition hover:bg-neutral-50 sm:flex-1"
            >
              {t("Skip for now")}
            </Link>
            <Link
              href={APP_ROUTES.onboardingFirstAction}
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700 sm:flex-1"
            >
              <span>{t("Confirm and continue")}</span>
              <ArrowRightIcon className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </section>

      <OnboardingProgressDots activeStep={2} />
    </AuthShell>
  );
}

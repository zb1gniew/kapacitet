"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingActionCard } from "@/components/auth/OnboardingActionCard";
import { OnboardingProgressDots } from "@/components/auth/OnboardingProgressDots";
import { EyeIcon, UsersIcon } from "@/components/auth/icons";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";

export function FirstActionScreen() {
  const { t } = useLocalizedScreen();

  return (
    <AuthShell dataName="Welcome Screen 3" dataNodeId="1:277">
      <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
        <header>
          <h1 className="text-[24px] font-bold leading-8 tracking-[0.0703px] text-neutral-900">
            {t("Choose your first action")}
          </h1>
          <p className="mt-3 max-w-[639px] text-base leading-[26px] tracking-[-0.3125px] text-neutral-600">
            {t(
              "Get started by either sharing available capacity or requesting capacity your company needs. You can always do both later.",
            )}
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <OnboardingActionCard
            title={t("Declare availability")}
            description={t(
              "Share workers or equipment that your company can temporarily provide to network partners during specific time periods.",
            )}
            ctaLabel={t("Start declaring")}
            href={APP_ROUTES.declareAvailabilityWorkersStep1}
            icon={<UsersIcon className="h-8 w-8" />}
            highlighted
          />
          <OnboardingActionCard
            title={t("Request capacity")}
            description={t(
              "Request temporary workers or equipment when your company needs additional capacity for a project or time period.",
            )}
            ctaLabel={t("Start requesting")}
            href={APP_ROUTES.requestCapacityWorkersStep1}
            icon={<EyeIcon className="h-8 w-8" />}
          />
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <Link
            href={APP_ROUTES.dashboard}
            className="inline-flex h-[54px] w-full items-center justify-center rounded-[10px] border border-neutral-300 text-base font-semibold tracking-[-0.3125px] text-neutral-700 transition hover:bg-neutral-50"
          >
            {t("Skip and explore the platform")}
          </Link>
        </div>
      </section>

      <OnboardingProgressDots activeStep={3} />
    </AuthShell>
  );
}

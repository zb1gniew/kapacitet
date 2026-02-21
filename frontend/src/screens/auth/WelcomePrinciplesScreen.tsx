"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProgressDots } from "@/components/auth/OnboardingProgressDots";
import { OnboardingPrincipleCard } from "@/components/auth/OnboardingPrincipleCard";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  CircleCheckIcon,
  ClockIcon,
  ShieldIcon,
} from "@/components/auth/icons";

export function WelcomePrinciplesScreen() {
  const { t } = useLocalizedScreen();

  return (
    <AuthShell dataName="Welcome Screen 1" dataNodeId="1:178">
      <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
        <header className="mx-auto max-w-[576px] text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
            <CircleCheckIcon className="h-10 w-10" />
          </div>
          <h1 className="mt-5 text-[30px] font-bold leading-9 tracking-[0.3955px] text-neutral-900">
            {t("Welcome to KapacitetNet")}
          </h1>
          <p className="mt-3 text-base leading-[26px] tracking-[-0.3125px] text-neutral-600">
            {t(
              "Your company account has been approved. Let's review the key principles that guide how this platform operates.",
            )}
          </p>
        </header>

        <div className="mt-8 space-y-5">
          <OnboardingPrincipleCard
            title={t("Temporary cooperation only")}
            description={t(
              "This platform is designed exclusively for time-bounded capacity sharing. All declarations and requests must have defined start and end dates. KapacitetNet is not a recruitment or employment transfer platform.",
            )}
            icon={<ClockIcon className="h-6 w-6" />}
            iconToneClassName="text-blue-600"
          />
          <OnboardingPrincipleCard
            title={t("Anonymized sharing with privacy protection")}
            description={t(
              "Worker identities are never shared between companies. During matching, company identities remain anonymous until both parties confirm cooperation intent. You control what capacity you share.",
            )}
            icon={<ShieldIcon className="h-6 w-6" />}
            iconToneClassName="text-green-600"
          />
          <OnboardingPrincipleCard
            title={t("You approve every match")}
            description={t(
              "The platform suggests matches based on availability, skills, and location, but you review and approve every cooperation opportunity. Nothing happens without your explicit confirmation.",
            )}
            icon={<CheckBadgeIcon className="h-6 w-6" />}
            iconToneClassName="text-amber-500"
          />
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <Link
            href={APP_ROUTES.onboardingCompanyDetails}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 text-base font-semibold tracking-[-0.3125px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.10),0_4px_6px_rgba(0,0,0,0.10)] transition hover:bg-blue-700"
          >
            <span>{t("Continue to setup")}</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <OnboardingProgressDots activeStep={1} />
    </AuthShell>
  );
}

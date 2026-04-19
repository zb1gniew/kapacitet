import { isSupportedCity } from "@/constants/cities";
import type { TranslateFn } from "@/types/i18n";

export const ONBOARDING_LIMITS = {
  industry: 100,
  location: 100,
} as const;

export type OnboardingFieldErrors = Partial<
  Record<"industry" | "location", string>
>;

export function validateOnboardingDetails(
  t: TranslateFn,
  data: {
    industry?: string;
    location?: string;
  },
): OnboardingFieldErrors {
  const errors: OnboardingFieldErrors = {};

  if (data.industry && data.industry.length > ONBOARDING_LIMITS.industry)
    errors.industry = t("Must be {{count}} characters or fewer.", {
      count: ONBOARDING_LIMITS.industry,
    });

  if (data.location && !isSupportedCity(data.location))
    errors.location = t("Please select a city from the suggestions.");
  else if (data.location && data.location.length > ONBOARDING_LIMITS.location)
    errors.location = t("Must be {{count}} characters or fewer.", {
      count: ONBOARDING_LIMITS.location,
    });

  return errors;
}

export function hasErrors(errors: OnboardingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

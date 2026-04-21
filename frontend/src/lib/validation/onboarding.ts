import { isSupportedCity } from "@/constants/cities";
import { isValidCategory, MAX_CATEGORIES } from "@/constants/categories";
import type { TranslateFn } from "@/types/i18n";

export const ONBOARDING_LIMITS = {
  categories: MAX_CATEGORIES,
  location: 100,
} as const;

export type OnboardingFieldErrors = Partial<
  Record<"categories" | "location", string>
>;

export function validateOnboardingDetails(
  t: TranslateFn,
  data: {
    categories?: string[];
    location?: string;
  },
): OnboardingFieldErrors {
  const errors: OnboardingFieldErrors = {};

  if (data.categories && data.categories.length > 0) {
    if (data.categories.length > ONBOARDING_LIMITS.categories)
      errors.categories = t("Maximum 3 categories allowed.");
    else if (!data.categories.every(isValidCategory))
      errors.categories = t("Please select from the available categories.");
  }

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

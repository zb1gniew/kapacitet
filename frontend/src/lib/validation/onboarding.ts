export const ONBOARDING_LIMITS = {
  industry: 100,
  location: 100,
} as const;

export type OnboardingFieldErrors = Partial<
  Record<"industry" | "location", string>
>;

export function validateOnboardingDetails(data: {
  industry?: string;
  location?: string;
}): OnboardingFieldErrors {
  const errors: OnboardingFieldErrors = {};

  if (data.industry && data.industry.length > ONBOARDING_LIMITS.industry)
    errors.industry = `Must be ${ONBOARDING_LIMITS.industry} characters or fewer.`;

  if (data.location && data.location.length > ONBOARDING_LIMITS.location)
    errors.location = `Must be ${ONBOARDING_LIMITS.location} characters or fewer.`;

  return errors;
}

export function hasErrors(errors: OnboardingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

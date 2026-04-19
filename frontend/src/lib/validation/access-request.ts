import { isSupportedCity } from "@/constants/cities";
import type { TranslateFn } from "@/types/i18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ACCESS_REQUEST_LIMITS = {
  name: 150,
  industry: 100,
  location: 100,
  email: 254,
  message: 2000,
} as const;

export type AccessRequestFieldErrors = Partial<
  Record<
    "companyName" | "industry" | "location" | "contactEmail" | "message",
    string
  >
>;

export type AccessRequestPayload = {
  name: string;
  industry: string;
  location: string;
  contactEmail: string;
  message?: string;
};

export function validateAccessRequest(
  t: TranslateFn,
  payload: AccessRequestPayload,
): AccessRequestFieldErrors {
  const errors: AccessRequestFieldErrors = {};

  if (!payload.name) errors.companyName = t("Company name is required.");
  else if (payload.name.length > ACCESS_REQUEST_LIMITS.name)
    errors.companyName = t("Must be {{count}} characters or fewer.", {
      count: ACCESS_REQUEST_LIMITS.name,
    });

  if (!payload.industry) errors.industry = t("Industry is required.");
  else if (payload.industry.length > ACCESS_REQUEST_LIMITS.industry)
    errors.industry = t("Must be {{count}} characters or fewer.", {
      count: ACCESS_REQUEST_LIMITS.industry,
    });

  if (!payload.location) errors.location = t("Location is required.");
  else if (!isSupportedCity(payload.location))
    errors.location = t("Please select a city from the suggestions.");
  else if (payload.location.length > ACCESS_REQUEST_LIMITS.location)
    errors.location = t("Must be {{count}} characters or fewer.", {
      count: ACCESS_REQUEST_LIMITS.location,
    });

  if (!payload.contactEmail) errors.contactEmail = t("Email is required.");
  else if (!EMAIL_RE.test(payload.contactEmail))
    errors.contactEmail = t("Enter a valid email address.");
  else if (payload.contactEmail.length > ACCESS_REQUEST_LIMITS.email)
    errors.contactEmail = t("Must be {{count}} characters or fewer.", {
      count: ACCESS_REQUEST_LIMITS.email,
    });

  if (payload.message && payload.message.length > ACCESS_REQUEST_LIMITS.message)
    errors.message = t("Must be {{count}} characters or fewer.", {
      count: ACCESS_REQUEST_LIMITS.message,
    });

  return errors;
}

export function hasErrors(errors: AccessRequestFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

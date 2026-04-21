import { isSupportedCity } from "@/constants/cities";
import { isValidCategory, MAX_CATEGORIES } from "@/constants/categories";
import type { TranslateFn } from "@/types/i18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ACCESS_REQUEST_LIMITS = {
  categories: MAX_CATEGORIES,
  location: 100,
  email: 254,
  message: 2000,
} as const;

export type AccessRequestFieldErrors = Partial<
  Record<
    "categories" | "location" | "contactEmail" | "message" | "companyName",
    string
  >
>;

export type AccessRequestPayload = {
  name: string;
  categories: string[];
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
  else if (payload.name.length > 150)
    errors.companyName = t("Must be {{count}} characters or fewer.", {
      count: 150,
    });

  if (!payload.categories || payload.categories.length === 0)
    errors.categories = t("Categories are required.");
  else if (payload.categories.length > ACCESS_REQUEST_LIMITS.categories)
    errors.categories = t("Maximum 3 categories allowed.");
  else if (!payload.categories.every(isValidCategory))
    errors.categories = t("Please select from the available categories.");

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

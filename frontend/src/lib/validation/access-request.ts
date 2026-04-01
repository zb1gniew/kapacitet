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
  payload: AccessRequestPayload,
): AccessRequestFieldErrors {
  const errors: AccessRequestFieldErrors = {};

  if (!payload.name) errors.companyName = "Company name is required.";
  else if (payload.name.length > ACCESS_REQUEST_LIMITS.name)
    errors.companyName = `Must be ${ACCESS_REQUEST_LIMITS.name} characters or fewer.`;

  if (!payload.industry) errors.industry = "Industry is required.";
  else if (payload.industry.length > ACCESS_REQUEST_LIMITS.industry)
    errors.industry = `Must be ${ACCESS_REQUEST_LIMITS.industry} characters or fewer.`;

  if (!payload.location) errors.location = "Location is required.";
  else if (payload.location.length > ACCESS_REQUEST_LIMITS.location)
    errors.location = `Must be ${ACCESS_REQUEST_LIMITS.location} characters or fewer.`;

  if (!payload.contactEmail) errors.contactEmail = "Email is required.";
  else if (!EMAIL_RE.test(payload.contactEmail))
    errors.contactEmail = "Enter a valid email address.";
  else if (payload.contactEmail.length > ACCESS_REQUEST_LIMITS.email)
    errors.contactEmail = `Must be ${ACCESS_REQUEST_LIMITS.email} characters or fewer.`;

  if (payload.message && payload.message.length > ACCESS_REQUEST_LIMITS.message)
    errors.message = `Must be ${ACCESS_REQUEST_LIMITS.message} characters or fewer.`;

  return errors;
}

export function hasErrors(errors: AccessRequestFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

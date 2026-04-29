import { describe, expect, it } from "vitest";
import {
  hasErrors,
  ONBOARDING_LIMITS,
  validateOnboardingDetails,
} from "./onboarding";

function t(key: string, params?: Record<string, unknown>) {
  if (!params) {
    return key;
  }

  return Object.entries(params).reduce(
    (message, [name, value]) =>
      message.replace(`{{${name}}}`, String(value)),
    key,
  );
}

describe("validateOnboardingDetails", () => {
  it("allows optional empty onboarding details", () => {
    const errors = validateOnboardingDetails(t, {});

    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  it("rejects invalid categories", () => {
    const errors = validateOnboardingDetails(t, {
      categories: ["construction", "invalid-category"],
    });

    expect(errors).toEqual({
      categories: "Please select from the available categories.",
    });
  });

  it("enforces the category limit", () => {
    const errors = validateOnboardingDetails(t, {
      categories: ["construction", "roofing", "painting", "plumbing"],
    });

    expect(errors).toEqual({
      categories: "Maximum 3 categories allowed.",
    });
  });

  it("rejects unsupported locations", () => {
    const errors = validateOnboardingDetails(t, {
      location: "Unknown City",
    });

    expect(errors).toEqual({
      location: "Please select a city from the suggestions.",
    });
  });
});

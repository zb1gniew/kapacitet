import { describe, expect, it } from "vitest";
import {
  ACCESS_REQUEST_LIMITS,
  hasErrors,
  validateAccessRequest,
} from "./access-request";

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

describe("validateAccessRequest", () => {
  it("returns no errors for a valid payload", () => {
    const errors = validateAccessRequest(t, {
      name: "Nordic Builders",
      cvr: "12345678",
      categories: ["construction", "roofing"],
      location: "Copenhagen",
      contactPhone: "+4512345678",
      contactEmail: "contact@nordic.test",
      message: "Looking to join the network.",
    });

    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  it("flags missing required fields", () => {
    const errors = validateAccessRequest(t, {
      name: "",
      cvr: "",
      categories: [],
      location: "",
      contactPhone: "",
      contactEmail: "",
      message: "",
    });

    expect(errors).toMatchObject({
      companyName: "Company name is required.",
      cvr: "CVR is required.",
      categories: "Categories are required.",
      location: "Location is required.",
      contactPhone: "Phone number is required.",
      contactEmail: "Email is required.",
    });
    expect(hasErrors(errors)).toBe(true);
  });

  it("rejects malformed field values", () => {
    const errors = validateAccessRequest(t, {
      name: "Nordic Builders",
      cvr: "12A",
      categories: ["construction", "invalid-category"],
      location: "Nowhere",
      contactPhone: "+45123",
      contactEmail: "not-an-email",
      message: "ok",
    });

    expect(errors).toMatchObject({
      cvr: "CVR must be exactly 8 digits.",
      categories: "Please select from the available categories.",
      location: "Please select a city from the suggestions.",
      contactPhone: "Enter a valid phone number for the selected country.",
      contactEmail: "Enter a valid email address.",
    });
  });

  it("enforces category, email, and message limits", () => {
    const errors = validateAccessRequest(t, {
      name: "Nordic Builders",
      cvr: "12345678",
      categories: ["construction", "roofing", "painting", "plumbing"],
      location: "Copenhagen",
      contactPhone: "+4512345678",
      contactEmail: `${"a".repeat(246)}@test.com`,
      message: "m".repeat(ACCESS_REQUEST_LIMITS.message + 1),
    });

    expect(errors).toMatchObject({
      categories: "Maximum 3 categories allowed.",
      contactEmail: "Must be 254 characters or fewer.",
      message: "Must be 2000 characters or fewer.",
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import type {
  AgreementResponse,
  AvailabilityDeclarationResponse,
  CapacityRequestResponse,
  MatchOfferResponse,
} from "@/types/api";
import {
  deriveActionBanner,
  deriveActiveProcesses,
  deriveMetrics,
  deriveReminders,
} from "./derive";

function t(key: string, params?: Record<string, unknown>) {
  if (!params) {
    return key;
  }

  return Object.entries(params).reduce(
    (message, [name, value]) => message.replace(`{{${name}}}`, String(value)),
    key,
  );
}

function availability(
  overrides: Partial<AvailabilityDeclarationResponse> = {},
): AvailabilityDeclarationResponse {
  return {
    id: 1,
    companyId: 10,
    resourceType: "Workers",
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2026-05-20T00:00:00.000Z",
    locationCity: "Copenhagen",
    locationRadiusKm: 50,
    quantity: 4,
    experienceLevel: "mid",
    status: "Active",
    createdAt: "2026-04-20T00:00:00.000Z",
    publishedAt: "2026-04-21T00:00:00.000Z",
    skills: ["roofing"],
    certificates: [],
    ...overrides,
  };
}

function request(
  overrides: Partial<CapacityRequestResponse> = {},
): CapacityRequestResponse {
  return {
    id: 2,
    companyId: 20,
    resourceType: "Workers",
    startDate: "2026-05-05T00:00:00.000Z",
    endDate: "2026-05-30T00:00:00.000Z",
    locationCity: "Odense",
    locationRadiusKm: 25,
    quantity: 6,
    experienceLevel: "senior",
    urgency: "High",
    status: "Active",
    createdAt: "2026-04-18T00:00:00.000Z",
    publishedAt: "2026-04-24T00:00:00.000Z",
    skills: ["construction"],
    certificates: [],
    ...overrides,
  };
}

function match(
  overrides: Partial<MatchOfferResponse> = {},
): MatchOfferResponse {
  return {
    id: 100,
    requestId: 2,
    availabilityId: 1,
    perspective: "Requester",
    status: "PendingRequesterReview",
    offeredQuantity: 3,
    requestQuantity: 6,
    availabilityQuantity: 4,
    matchScore: 0.9,
    skillScore: 1,
    certificateScore: 1,
    dateScore: 1,
    locationScore: 1,
    quantityScore: 0.5,
    coversFullPeriod: true,
    isPartial: true,
    locationCity: "Copenhagen",
    requestLocationCity: "Odense",
    requestLocationRadiusKm: 25,
    availabilityLocationCity: "Copenhagen",
    availabilityLocationRadiusKm: 50,
    requestUrgency: "High",
    requestStartDate: "2026-05-05T00:00:00.000Z",
    requestEndDate: "2026-05-30T00:00:00.000Z",
    availabilityStartDate: "2026-05-01T00:00:00.000Z",
    availabilityEndDate: "2026-05-20T00:00:00.000Z",
    createdAt: "2026-04-26T00:00:00.000Z",
    expiresAt: "2026-04-29T00:00:00.000Z",
    explanation: "Strong fit",
    partnerCompanyName: "Partner Co",
    partnerCompanyId: 77,
    skills: ["construction"],
    certificates: [],
    ...overrides,
  };
}

function agreement(
  overrides: Partial<AgreementResponse> = {},
): AgreementResponse {
  return {
    id: 500,
    matchOfferId: 100,
    requestId: 2,
    availabilityId: 1,
    partnerCompanyId: 77,
    partnerCompanyName: "Partner Co",
    partnerCvr: "12345678",
    partnerContactPhone: "+4512345678",
    partnerContactEmail: "partner@example.com",
    supplierCompanyId: 10,
    supplierCompanyName: "Supplier",
    requesterCompanyId: 20,
    requesterCompanyName: "Requester",
    startDate: "2026-05-05T00:00:00.000Z",
    endDate: "2026-05-30T00:00:00.000Z",
    quantity: 3,
    status: "Active",
    createdAt: "2026-04-26T00:00:00.000Z",
    confirmedAt: "2026-04-26T12:00:00.000Z",
    ...overrides,
  };
}

describe("dashboard derivation", () => {
  it("derives dashboard metrics from active listings and pending actions", () => {
    const metrics = deriveMetrics(
      t,
      [availability(), availability({ id: 3, status: "Expired" })],
      [request(), request({ id: 4, status: "Cancelled" })],
      [match(), match({ id: 101, status: "AgreementCreated" })],
    );

    expect(metrics).toEqual([
      {
        label: "Declared availability",
        value: "1 Active",
        icon: "users",
        tone: "success",
      },
      {
        label: "Declared needs",
        value: "1 Searching",
        icon: "search",
        tone: "primary",
      },
      {
        label: "Actions needed",
        value: "1 Requires response",
        icon: "warning",
        tone: "danger",
        highlighted: true,
      },
    ]);
  });

  it("builds and sorts active processes using the most recent related activity", () => {
    const processes = deriveActiveProcesses(
      t,
      [
        availability(),
        availability({
          id: 3,
          skills: ["painting"],
          publishedAt: "2026-04-10T00:00:00.000Z",
        }),
      ],
      [request()],
      [
        match(),
        match({
          id: 102,
          availabilityId: 3,
          requestId: 99,
          status: "PendingSupplierConfirmation",
          createdAt: "2026-04-28T01:00:00.000Z",
        }),
      ],
    );

    expect(processes[0]).toMatchObject({
      id: 3,
      kind: "availability",
      status: "Confirmation needed",
      cta: "Review match",
    });
    expect(processes[1]).toMatchObject({
      id: 2,
      kind: "request",
      status: "Direct match found",
      cta: "View matches",
    });
  });

  it("prefers urgent reminders and sorts them by closest deadline", () => {
    vi.setSystemTime(new Date("2026-04-28T00:00:00.000Z"));

    const reminders = deriveReminders(
      t,
      [availability({ endDate: "2026-05-02T00:00:00.000Z" })],
      [request({ startDate: "2026-05-04T00:00:00.000Z" })],
      [match({ expiresAt: "2026-04-29T00:00:00.000Z" })],
      [],
    );

    expect(reminders.map((entry) => entry.title)).toEqual([
      "Response deadline",
      "Availability expiring",
      "Request start date",
    ]);
  });

  it("falls back to live reminders when nothing urgent exists", () => {
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));

    const reminders = deriveReminders(
      t,
      [availability({ endDate: "2026-06-20T00:00:00.000Z" })],
      [request({ startDate: "2026-06-25T00:00:00.000Z" })],
      [],
      [agreement()],
    );

    expect(reminders).toHaveLength(2);
    expect(reminders[0]?.title).toBe("Availability live");
    expect(reminders[1]?.title).toBe("Request live");
  });

  it("returns an action banner for the most urgent unmatched request", () => {
    vi.setSystemTime(new Date("2026-04-28T00:00:00.000Z"));

    const banner = deriveActionBanner(
      t,
      [availability()],
      [request({ startDate: "2026-05-02T00:00:00.000Z" })],
      [],
    );

    expect(banner).toMatchObject({
      kind: "request",
      tone: "warning",
      badge: "Action required",
      cta: "View and take action",
    });
  });

  it("falls back to the most recent live availability when no urgent request exists", () => {
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));

    const banner = deriveActionBanner(
      t,
      [
        availability({
          id: 7,
          publishedAt: "2026-04-05T00:00:00.000Z",
          skills: ["painting"],
        }),
      ],
      [],
      [],
    );

    expect(banner).toMatchObject({
      id: 7,
      kind: "availability",
      tone: "success",
      badge: "Availability live",
      cta: "Review availability",
    });
  });
});

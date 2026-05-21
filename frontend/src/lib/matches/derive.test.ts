import { describe, expect, it, vi } from "vitest";
import type {
  AgreementResponse,
  MatchOfferResponse,
} from "@/types/api-matches";
import {
  deriveAwaitingOffers,
  deriveCompletedOffers,
  deriveMatchesSummary,
  deriveRequesterPendingOffers,
  deriveSupplierPendingOffers,
  formatDateRange,
  formatExpiresAt,
  formatMatchTitle,
  formatRelativeTime,
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

function match(
  overrides: Partial<MatchOfferResponse> = {},
): MatchOfferResponse {
  return {
    id: 1,
    requestId: 10,
    availabilityId: 20,
    perspective: "Requester",
    status: "PendingRequesterReview",
    offeredQuantity: 2,
    requestQuantity: 4,
    availabilityQuantity: 3,
    matchScore: 0.8,
    skillScore: 1,
    certificateScore: 1,
    dateScore: 1,
    locationScore: 1,
    quantityScore: 0.5,
    coversFullPeriod: true,
    isPartial: false,
    locationCity: "Copenhagen",
    requestLocationCity: "Odense",
    requestLocationRadiusKm: 30,
    availabilityLocationCity: "Copenhagen",
    availabilityLocationRadiusKm: 40,
    requestUrgency: "High",
    requestStartDate: "2026-05-01T00:00:00.000Z",
    requestEndDate: "2026-05-10T00:00:00.000Z",
    availabilityStartDate: "2026-04-30T00:00:00.000Z",
    availabilityEndDate: "2026-05-10T00:00:00.000Z",
    createdAt: "2026-04-28T00:00:00.000Z",
    expiresAt: "2026-04-30T00:00:00.000Z",
    explanation: "Good fit",
    partnerCompanyName: "Partner",
    partnerCompanyId: 99,
    skills: ["Roofer"],
    certificates: [],
    ...overrides,
  };
}

function agreement(
  overrides: Partial<AgreementResponse> = {},
): AgreementResponse {
  return {
    id: 9,
    matchOfferId: 1,
    requestId: 10,
    availabilityId: 20,
    partnerCompanyId: 99,
    partnerCompanyName: "Partner",
    partnerCvr: "12345678",
    partnerContactPhone: "+4512345678",
    partnerContactEmail: "partner@example.com",
    supplierCompanyId: 1,
    supplierCompanyName: "Supplier",
    requesterCompanyId: 2,
    requesterCompanyName: "Requester",
    startDate: "2026-05-01T00:00:00.000Z",
    endDate: "2026-05-10T00:00:00.000Z",
    quantity: 2,
    status: "Active",
    createdAt: "2026-04-28T00:00:00.000Z",
    confirmedAt: "2026-04-28T01:00:00.000Z",
    ...overrides,
  };
}

describe("matches derive helpers", () => {
  it("builds match summary counts by perspective and status", () => {
    const summary = deriveMatchesSummary(
      t,
      [
        match(),
        match({
          id: 2,
          perspective: "Supplier",
          status: "PendingSupplierConfirmation",
        }),
        match({
          id: 3,
          perspective: "Requester",
          status: "PendingSupplierConfirmation",
        }),
      ],
      [agreement()],
    );

    expect(summary.map((item) => item.value)).toEqual([2, 1, 1]);
  });

  it("derives pending, awaiting, and completed offer lists in the right order", () => {
    const requesterPending = deriveRequesterPendingOffers([
      match({ id: 1, matchScore: 0.3 }),
      match({ id: 2, matchScore: 0.9 }),
    ]);
    const supplierPending = deriveSupplierPendingOffers([
      match({
        id: 3,
        perspective: "Supplier",
        status: "PendingSupplierConfirmation",
        matchScore: 0.5,
      }),
    ]);
    const awaiting = deriveAwaitingOffers([
      match({ id: 4, status: "PendingSupplierConfirmation" }),
      match({
        id: 5,
        perspective: "Supplier",
        status: "PendingRequesterReview",
        createdAt: "2026-04-29T00:00:00.000Z",
      }),
    ]);
    const completed = deriveCompletedOffers([
      match({ id: 6, status: "AgreementCreated" }),
      match({
        id: 7,
        status: "AgreementCreated",
        createdAt: "2026-04-30T00:00:00.000Z",
      }),
    ]);

    expect(requesterPending.map((offer) => offer.id)).toEqual([2, 1]);
    expect(supplierPending.map((offer) => offer.id)).toEqual([3]);
    expect(awaiting.map((offer) => offer.id)).toEqual([5, 4]);
    expect(completed.map((offer) => offer.id)).toEqual([7, 6]);
  });

  it("formats date ranges, match titles, relative times, and expiration labels", () => {
    vi.setSystemTime(new Date("2026-04-28T12:00:00.000Z"));

    expect(
      formatDateRange(
        t,
        "2026-05-01T00:00:00.000Z",
        "2026-05-10T00:00:00.000Z",
      ),
    ).toContain("May");
    expect(formatDateRange(t, "invalid", "2026-05-10T00:00:00.000Z")).toBe(
      "Dates pending",
    );
    expect(
      formatMatchTitle(t, match({ offeredQuantity: 2, skills: ["Company"] })),
    ).toBe("2 Company");
    expect(formatRelativeTime(t, "2026-04-28T11:59:30.000Z")).toBe("Just now");
    expect(formatRelativeTime(t, "2026-04-28T10:00:00.000Z")).toBe(
      "2 hours ago",
    );
    expect(formatExpiresAt(t, "2026-05-01T00:00:00.000Z")).toContain(
      "Valid until",
    );
  });
});

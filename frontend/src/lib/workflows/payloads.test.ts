import { describe, expect, it, vi } from "vitest";
import type { WorkflowCatalog } from "@/lib/backend/catalog";
import {
  buildAvailabilityCreatePayload,
  buildCapacityRequestCreatePayload,
  createStoredDraft,
  getAvailabilityDraftStorageKey,
  getCapacityRequestDraftStorageKey,
  getWorkerPeriodStepErrors,
  isWorkerDetailsStepComplete,
  normalizeStoredDraft,
} from "./payloads";

const catalog: WorkflowCatalog = {
  skills: [
    { id: 1, name: "Roofing" },
    { id: 2, name: "Painting" },
  ],
  certificates: [{ id: 10, name: "Lift license" }],
};

describe("workflow payload helpers", () => {
  it("builds storage keys and detects completed worker details", () => {
    expect(getAvailabilityDraftStorageKey("u1")).toBe(
      "kapacitet.availability.draft.u1",
    );
    expect(getCapacityRequestDraftStorageKey("u1")).toBe(
      "kapacitet.request-capacity.draft.u1",
    );
    expect(
      isWorkerDetailsStepComplete({
        quantity: "3",
        skillIds: [1],
        certificateIds: [10],
      }),
    ).toBe(true);
    expect(
      isWorkerDetailsStepComplete({
        quantity: "0",
        skillIds: [1],
        certificateIds: [10],
      }),
    ).toBe(false);
  });

  it("returns worker period errors for invalid dates and locations", () => {
    expect(
      getWorkerPeriodStepErrors({
        startDate: "",
        endDate: "",
        locationCity: "Unknown",
      }),
    ).toEqual([
      "Select a start date.",
      "Select an end date.",
      "Please select a city from the suggestions.",
    ]);
  });

  it("builds an availability payload for a valid draft", () => {
    const result = buildAvailabilityCreatePayload(
      {
        quantity: "4",
        experienceLevel: "mid",
        skillIds: [1],
        certificateIds: [10],
        startDate: "2026-05-01",
        endDate: "2026-05-10",
        locationCity: "Copenhagen",
        locationRadiusKm: 75,
      },
      catalog,
      "draft-1",
    );

    expect(result).toEqual({
      ok: true,
      value: {
        clientDraftKey: "draft-1",
        startDate: "2026-05-01",
        endDate: "2026-05-10",
        locationCity: "Copenhagen",
        locationRadiusKm: 75,
        quantity: 4,
        experienceLevel: "mid",
        skillIds: [1],
        certificateIds: [10],
      },
    });
  });

  it("builds a capacity request payload and maps urgency to backend values", () => {
    const result = buildCapacityRequestCreatePayload(
      {
        quantity: "2",
        experienceLevel: "",
        skillIds: [2],
        certificateIds: [10],
        startDate: "2026-05-01",
        endDate: "2026-05-10",
        locationCity: "Odense",
        locationRadiusKm: 50,
        urgency: "urgent",
      },
      catalog,
      "draft-2",
    );

    expect(result).toEqual({
      ok: true,
      value: {
        clientDraftKey: "draft-2",
        startDate: "2026-05-01",
        endDate: "2026-05-10",
        locationCity: "Odense",
        locationRadiusKm: 50,
        quantity: 2,
        skillIds: [2],
        certificateIds: [10],
        urgency: "High",
      },
    });
  });

  it("returns structured errors for invalid drafts and normalizes stored drafts", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("client-key");

    const invalid = buildAvailabilityCreatePayload(
      {
        quantity: "0",
        experienceLevel: "invalid" as never,
        skillIds: [999],
        certificateIds: [],
        startDate: "2026-05-10",
        endDate: "2026-05-01",
        locationCity: "Unknown",
        locationRadiusKm: 10,
      },
      catalog,
      "draft-3",
    );

    expect(invalid.ok).toBe(false);
    if (invalid.ok) {
      throw new Error("Expected invalid result");
    }
    expect(invalid.errors).toContain(
      "Enter a valid worker quantity greater than zero.",
    );
    expect(invalid.fieldErrors?.experienceLevel).toEqual([
      "Select a valid experience level.",
    ]);

    const stored = createStoredDraft({ hello: "world" });
    expect(stored._clientKey).toBe("client-key");
    expect(
      normalizeStoredDraft(
        { _v: 2, _createdAt: "now", _clientKey: "existing", data: { a: 1 } },
        { a: 0 },
      )._clientKey,
    ).toBe("existing");
    expect(
      normalizeStoredDraft({ _v: 1, _clientKey: "", data: { a: 1 } } as never, {
        a: 0,
      })._clientKey,
    ).toBe("client-key");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { WorkflowCatalog } from "@/lib/backend/catalog";
import {
  MAX_WORKFLOW_DATE_OFFSET_YEARS,
  MAX_WORKER_QUANTITY,
  buildAvailabilityCreatePayload,
  buildCapacityRequestCreatePayload,
  createStoredDraft,
  getMaxWorkflowDateString,
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

const futureDate = (daysFromNow: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
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
    expect(
      isWorkerDetailsStepComplete({
        quantity: String(MAX_WORKER_QUANTITY + 1),
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

  it("rejects dates more than 100 years from now", () => {
    const today = new Date();
    const tooFar = new Date(today);
    tooFar.setUTCFullYear(
      tooFar.getUTCFullYear() + MAX_WORKFLOW_DATE_OFFSET_YEARS + 1,
    );
    const tooFarString = tooFar.toISOString().slice(0, 10);

    expect(
      getWorkerPeriodStepErrors({
        startDate: tooFarString,
        endDate: tooFarString,
        locationCity: "Aarhus",
      }),
    ).toEqual([
      `Start date cannot be more than ${MAX_WORKFLOW_DATE_OFFSET_YEARS} years from now.`,
      `End date cannot be more than ${MAX_WORKFLOW_DATE_OFFSET_YEARS} years from now.`,
      "End date must be after the start date.",
    ]);
    expect(getMaxWorkflowDateString(today)).not.toBe("");
  });

  it("builds an availability payload for a valid draft", () => {
    const startDate = futureDate(10);
    const endDate = futureDate(19);

    const result = buildAvailabilityCreatePayload(
      {
        quantity: "4",
        experienceLevel: "mid",
        skillIds: [1],
        certificateIds: [10],
        startDate,
        endDate,
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
        startDate,
        endDate,
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
    const startDate = futureDate(10);
    const endDate = futureDate(19);

    const result = buildCapacityRequestCreatePayload(
      {
        quantity: "2",
        experienceLevel: "",
        skillIds: [2],
        certificateIds: [10],
        startDate,
        endDate,
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
        startDate,
        endDate,
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
    const startDate = futureDate(19);
    const endDate = futureDate(10);

    const invalid = buildAvailabilityCreatePayload(
      {
        quantity: "0",
        experienceLevel: "invalid" as never,
        skillIds: [999],
        certificateIds: [],
        startDate,
        endDate,
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

  it("rejects worker quantities above the supported maximum", () => {
    const startDate = futureDate(10);
    const endDate = futureDate(19);

    const invalid = buildCapacityRequestCreatePayload(
      {
        quantity: String(MAX_WORKER_QUANTITY + 1),
        experienceLevel: "",
        skillIds: [2],
        certificateIds: [10],
        startDate,
        endDate,
        locationCity: "Odense",
        locationRadiusKm: 50,
        urgency: "normal",
      },
      catalog,
      "draft-4",
    );

    expect(invalid).toEqual({
      ok: false,
      errors: [`Worker quantity cannot exceed ${MAX_WORKER_QUANTITY}.`],
      fieldErrors: {
        quantity: [`Worker quantity cannot exceed ${MAX_WORKER_QUANTITY}.`],
      },
    });
  });

  it("returns structured field errors for dates beyond the maximum horizon", () => {
    const tooFar = new Date();
    tooFar.setUTCFullYear(
      tooFar.getUTCFullYear() + MAX_WORKFLOW_DATE_OFFSET_YEARS + 1,
    );
    const tooFarString = tooFar.toISOString().slice(0, 10);

    const invalid = buildAvailabilityCreatePayload(
      {
        quantity: "4",
        experienceLevel: "mid",
        skillIds: [1],
        certificateIds: [10],
        startDate: tooFarString,
        endDate: tooFarString,
        locationCity: "Copenhagen",
        locationRadiusKm: 75,
      },
      catalog,
      "draft-5",
    );

    expect(invalid).toEqual({
      ok: false,
      errors: [
        `Start date cannot be more than ${MAX_WORKFLOW_DATE_OFFSET_YEARS} years from now.`,
        `End date cannot be more than ${MAX_WORKFLOW_DATE_OFFSET_YEARS} years from now.`,
        "End date must be after the start date.",
      ],
      fieldErrors: {
        startDate: [
          `Start date cannot be more than ${MAX_WORKFLOW_DATE_OFFSET_YEARS} years from now.`,
        ],
        endDate: ["End date must be after the start date."],
      },
    });
  });
});

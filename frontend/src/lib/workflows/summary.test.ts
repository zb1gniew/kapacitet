import { describe, expect, it } from "vitest";
import {
  buildAvailabilitySummarySections,
  buildCapacityRequestSummarySections,
} from "./summary";

const catalog = {
  skills: [{ id: 1, name: "Roofing" }],
  certificates: [{ id: 10, name: "Lift license" }],
};

describe("workflow summary helpers", () => {
  it("builds an availability summary using catalog labels", () => {
    const sections = buildAvailabilitySummarySections(
      {
        clientDraftKey: "draft-1",
        quantity: 4,
        experienceLevel: "mid",
        skillIds: [1],
        certificateIds: [10],
        startDate: "2026-05-01",
        endDate: "2026-05-10",
        locationCity: "Copenhagen",
        locationRadiusKm: 75,
      },
      catalog,
    );

    expect(sections[0]?.rows[1]?.valueKey).toBe("Mid-level (3-7 years)");
    expect(sections[0]?.rows[2]?.valueKey).toBe("Roofing");
    expect(sections[1]?.rows[3]?.valueKey).toBe("75 km");
  });

  it("builds a request summary and falls back to not specified defaults", () => {
    const sections = buildCapacityRequestSummarySections(
      {
        clientDraftKey: "draft-2",
        quantity: 2,
        skillIds: [],
        certificateIds: [],
        startDate: "",
        endDate: "",
        locationCity: "",
        locationRadiusKm: 50,
        urgency: "Medium",
      },
      null,
    );

    expect(sections[0]?.rows[2]?.valueKey).toBe("Not specified");
    expect(sections[1]?.rows[4]?.valueKey).toBe("Normal");
  });
});

import type { WorkflowCatalog } from "@/lib/backend/catalog";
import type { AvailabilitySummarySection } from "@/types/availability";
import type {
  AvailabilityCreatePayload,
  CapacityRequestCreatePayload,
} from "./payloads";

export function buildAvailabilitySummarySections(
  payload: AvailabilityCreatePayload | null,
  catalog: WorkflowCatalog | null,
): AvailabilitySummarySection[] {
  const skillLabels = resolveCatalogLabels(
    payload?.skillIds ?? [],
    catalog?.skills,
  );
  const certificateLabels = resolveCatalogLabels(
    payload?.certificateIds ?? [],
    catalog?.certificates,
  );

  return [
    {
      id: "resource",
      titleKey: "Workers",
      icon: "resource",
      rows: [{ labelKey: "", valueKey: "Workers" }],
    },
    {
      id: "details",
      titleKey: "Details",
      icon: "details",
      rows: [
        {
          labelKey: "Quantity:",
          valueKey: payload ? String(payload.quantity) : "Not specified",
        },
        {
          labelKey: "Experience level:",
          valueKey: resolveExperienceLevelLabel(payload?.experienceLevel),
        },
        {
          labelKey: "Skill/Trade:",
          valueKey:
            skillLabels.length > 0 ? skillLabels.join(", ") : "Not specified",
        },
        {
          labelKey: "Certificates:",
          valueKey:
            certificateLabels.length > 0
              ? certificateLabels.join(", ")
              : "Not specified",
        },
      ],
    },
    {
      id: "period",
      titleKey: "Period and location",
      icon: "period",
      rows: [
        {
          labelKey: "Start date:",
          valueKey: payload?.startDate || "Not specified",
        },
        {
          labelKey: "End date:",
          valueKey: payload?.endDate || "Not specified",
        },
        {
          labelKey: "Location:",
          valueKey: payload?.locationCity || "Not specified",
        },
        {
          labelKey: "Radius:",
          valueKey: payload
            ? `${payload.locationRadiusKm} km`
            : "Not specified",
        },
      ],
    },
  ];
}

export function buildCapacityRequestSummarySections(
  payload: CapacityRequestCreatePayload | null,
  catalog: WorkflowCatalog | null,
): AvailabilitySummarySection[] {
  const skillLabels = resolveCatalogLabels(
    payload?.skillIds ?? [],
    catalog?.skills,
  );
  const certificateLabels = resolveCatalogLabels(
    payload?.certificateIds ?? [],
    catalog?.certificates,
  );

  return [
    {
      id: "resource",
      titleKey: "Workers",
      icon: "resource",
      rows: [{ labelKey: "", valueKey: "Workers" }],
    },
    {
      id: "details",
      titleKey: "Requirements",
      icon: "details",
      rows: [
        {
          labelKey: "Number of workers:",
          valueKey: payload ? String(payload.quantity) : "Not specified",
        },
        {
          labelKey: "Preferred experience level:",
          valueKey: resolveExperienceLevelLabel(payload?.experienceLevel),
        },
        {
          labelKey: "Trade/Skill:",
          valueKey:
            skillLabels.length > 0 ? skillLabels.join(", ") : "Not specified",
        },
        {
          labelKey: "Certificates:",
          valueKey:
            certificateLabels.length > 0
              ? certificateLabels.join(", ")
              : "Not specified",
        },
      ],
    },
    {
      id: "period",
      titleKey: "Period and location",
      icon: "period",
      rows: [
        {
          labelKey: "Start date:",
          valueKey: payload?.startDate || "Not specified",
        },
        {
          labelKey: "End date:",
          valueKey: payload?.endDate || "Not specified",
        },
        {
          labelKey: "Location:",
          valueKey: payload?.locationCity || "Not specified",
        },
        {
          labelKey: "Radius:",
          valueKey: payload
            ? `${payload.locationRadiusKm} km`
            : "Not specified",
        },
        {
          labelKey: "Urgency:",
          valueKey:
            payload?.urgency === "High"
              ? "Urgent"
              : payload?.urgency === "Medium"
                ? "Normal"
                : "Not specified",
        },
      ],
    },
  ];
}

function resolveCatalogLabels(
  selectedIds: number[],
  options?: { id: number; name: string }[],
) {
  if (!options) {
    return [];
  }

  const labelById = new Map(options.map((option) => [option.id, option.name]));

  return selectedIds
    .map((id) => labelById.get(id))
    .filter((label): label is string => Boolean(label));
}

function resolveExperienceLevelLabel(
  experienceLevel?: "junior" | "mid" | "senior",
) {
  switch (experienceLevel) {
    case "junior":
      return "Junior (0-3 years)";
    case "mid":
      return "Mid-level (3-7 years)";
    case "senior":
      return "Senior (7+ years)";
    default:
      return "Not specified";
  }
}

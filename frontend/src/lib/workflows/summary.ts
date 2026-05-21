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
      id: "details",
      titleKey: "Details",
      icon: "details",
      rows: [
        {
          labelKey: "Quantity:",
          valueText: payload ? String(payload.quantity) : undefined,
          valueKey: payload ? undefined : "Not specified",
        },
        {
          labelKey: "Experience level:",
          valueKey: resolveExperienceLevelLabel(payload?.experienceLevel),
        },
        {
          labelKey: "Skill/Trade:",
          valueKeys: skillLabels.length > 0 ? skillLabels : undefined,
          valueKey: skillLabels.length > 0 ? undefined : "Not specified",
        },
        {
          labelKey: "Certificates:",
          valueKeys:
            certificateLabels.length > 0 ? certificateLabels : undefined,
          valueKey: certificateLabels.length > 0 ? undefined : "Not specified",
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
          valueText: payload?.startDate || undefined,
          valueKey: payload?.startDate ? undefined : "Not specified",
        },
        {
          labelKey: "End date:",
          valueText: payload?.endDate || undefined,
          valueKey: payload?.endDate ? undefined : "Not specified",
        },
        {
          labelKey: "Location:",
          valueText: payload?.locationCity || undefined,
          valueKey: payload?.locationCity ? undefined : "Not specified",
        },
        {
          labelKey: "Radius:",
          valueText: payload ? `${payload.locationRadiusKm} km` : undefined,
          valueKey: payload ? undefined : "Not specified",
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
      id: "details",
      titleKey: "Requirements",
      icon: "details",
      rows: [
        {
          labelKey: "Number of workers:",
          valueText: payload ? String(payload.quantity) : undefined,
          valueKey: payload ? undefined : "Not specified",
        },
        {
          labelKey: "Preferred experience level:",
          valueKey: resolveExperienceLevelLabel(payload?.experienceLevel),
        },
        {
          labelKey: "Trade/Skill:",
          valueKeys: skillLabels.length > 0 ? skillLabels : undefined,
          valueKey: skillLabels.length > 0 ? undefined : "Not specified",
        },
        {
          labelKey: "Certificates:",
          valueKeys:
            certificateLabels.length > 0 ? certificateLabels : undefined,
          valueKey: certificateLabels.length > 0 ? undefined : "Not specified",
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
          valueText: payload?.startDate || undefined,
          valueKey: payload?.startDate ? undefined : "Not specified",
        },
        {
          labelKey: "End date:",
          valueText: payload?.endDate || undefined,
          valueKey: payload?.endDate ? undefined : "Not specified",
        },
        {
          labelKey: "Location:",
          valueText: payload?.locationCity || undefined,
          valueKey: payload?.locationCity ? undefined : "Not specified",
        },
        {
          labelKey: "Radius:",
          valueText: payload ? `${payload.locationRadiusKm} km` : undefined,
          valueKey: payload ? undefined : "Not specified",
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

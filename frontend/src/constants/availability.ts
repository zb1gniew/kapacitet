import type {
  AvailabilityResourceOption,
  AvailabilityStepDefinition,
  AvailabilityStepId,
  AvailabilitySummarySection,
} from "@/types/availability";

export const AVAILABILITY_STEPS: AvailabilityStepDefinition[] = [
  { id: 1, labelKey: "Step 1", titleKey: "Workers" },
  { id: 2, labelKey: "Step 2", titleKey: "Details" },
  { id: 3, labelKey: "Step 3", titleKey: "Period & control" },
  { id: 4, labelKey: "Step 4", titleKey: "Review" },
];

export const AVAILABILITY_RESOURCE_OPTIONS: AvailabilityResourceOption[] = [
  {
    id: "workers",
    icon: "workers",
    titleKey: "Workers",
    descriptionKey:
      "Temporarily share skilled workers or craftsmen who have available capacity during specific periods.",
  },
];

export const AVAILABILITY_DEFAULT_RADIUS_KM = 50;
export const AVAILABILITY_RADIUS_MIN_KM = 10;
export const AVAILABILITY_RADIUS_MAX_KM = 200;

export const AVAILABILITY_WORKERS_SUMMARY_SECTIONS: AvailabilitySummarySection[] =
  [
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
        { labelKey: "Quantity:", valueKey: "Not specified" },
        { labelKey: "Skill/Trade:", valueKey: "Not specified" },
        { labelKey: "Certificates:", valueKey: "Not specified" },
      ],
    },
    {
      id: "period",
      titleKey: "Period and location",
      icon: "period",
      rows: [
        { labelKey: "Start date:", valueKey: "Not specified" },
        { labelKey: "End date:", valueKey: "Not specified" },
        { labelKey: "Location:", valueKey: "Not specified" },
        { labelKey: "Radius:", valueKey: "50 km" },
      ],
    },
  ];

export const AVAILABILITY_SUMMARY_SECTIONS =
  AVAILABILITY_WORKERS_SUMMARY_SECTIONS;

export function getAvailabilityStepState(
  currentStep: AvailabilityStepId,
  stepId: AvailabilityStepId,
) {
  if (stepId < currentStep) {
    return "completed" as const;
  }

  if (stepId === currentStep) {
    return "active" as const;
  }

  return "upcoming" as const;
}

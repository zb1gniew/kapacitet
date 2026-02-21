import type {
  AvailabilityCertificateOption,
  AvailabilityExperienceOption,
  AvailabilityResourceOption,
  AvailabilityStepDefinition,
  AvailabilityStepId,
  AvailabilitySummarySection,
} from "@/types/availability";

export const AVAILABILITY_STEPS: AvailabilityStepDefinition[] = [
  { id: 1, labelKey: "Step 1", titleKey: "Resource type" },
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
  {
    id: "equipment",
    icon: "equipment",
    titleKey: "Equipment",
    descriptionKey:
      "Share machinery, tools, or equipment that's available for temporary use by network companies.",
  },
];

export const AVAILABILITY_CERTIFICATE_OPTIONS: AvailabilityCertificateOption[] = [
  { id: "hot-work", labelKey: "Hot work certification" },
  { id: "bas-u", labelKey: "Safety training (BAS-U)" },
  { id: "forklift", labelKey: "Forklift license" },
  { id: "crane", labelKey: "Crane operator license" },
  { id: "electrical", labelKey: "Electrical certification" },
  { id: "heights", labelKey: "Working at heights" },
];

export const AVAILABILITY_EXPERIENCE_OPTIONS: AvailabilityExperienceOption[] = [
  { id: "junior", labelKey: "Junior (0-3 years)" },
  { id: "mid", labelKey: "Mid-level (3-7 years)" },
  { id: "senior", labelKey: "Senior (7+ years)" },
];

export const AVAILABILITY_DEFAULT_RADIUS_KM = 50;
export const AVAILABILITY_RADIUS_MIN_KM = 10;
export const AVAILABILITY_RADIUS_MAX_KM = 200;

export const AVAILABILITY_WORKERS_SUMMARY_SECTIONS: AvailabilitySummarySection[] = [
  {
    id: "resource",
    titleKey: "Resource type",
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
      { labelKey: "Experience:", valueKey: "Not specified" },
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

export const AVAILABILITY_SUMMARY_SECTIONS = AVAILABILITY_WORKERS_SUMMARY_SECTIONS;

export const AVAILABILITY_EQUIPMENT_SUMMARY_SECTIONS: AvailabilitySummarySection[] = [
  {
    id: "resource",
    titleKey: "Resource type",
    icon: "resource",
    rows: [{ labelKey: "", valueKey: "Equipment" }],
  },
  {
    id: "details",
    titleKey: "Details",
    icon: "details",
    rows: [
      { labelKey: "Quantity:", valueKey: "Not specified" },
      { labelKey: "Type:", valueKey: "Not specified" },
      { labelKey: "Condition:", valueKey: "Not specified" },
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

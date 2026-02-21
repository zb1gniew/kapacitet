import type {
  AvailabilityResourceOption,
  AvailabilityStepDefinition,
  AvailabilitySummarySection,
} from "@/types/availability";

export const REQUEST_CAPACITY_STEPS: AvailabilityStepDefinition[] = [
  { id: 1, labelKey: "Step 1", titleKey: "Resource type" },
  { id: 2, labelKey: "Step 2", titleKey: "Requirements" },
  { id: 3, labelKey: "Step 3", titleKey: "Period & location" },
  { id: 4, labelKey: "Step 4", titleKey: "Review & submit" },
];

export const REQUEST_CAPACITY_RESOURCE_OPTIONS: AvailabilityResourceOption[] = [
  {
    id: "workers",
    icon: "workers",
    titleKey: "Workers",
    descriptionKey:
      "Request temporary skilled workers or craftsmen for a specific period when you have additional capacity needs.",
  },
  {
    id: "equipment",
    icon: "equipment",
    titleKey: "Equipment",
    descriptionKey:
      "Request machinery, tools, or equipment temporarily from network companies when you need additional resources.",
  },
];

export const REQUEST_CAPACITY_WORKERS_SUMMARY_SECTIONS: AvailabilitySummarySection[] = [
  {
    id: "resource",
    titleKey: "Resource type",
    icon: "resource",
    rows: [{ labelKey: "", valueKey: "Workers" }],
  },
  {
    id: "details",
    titleKey: "Requirements",
    icon: "details",
    rows: [
      { labelKey: "Number of workers:", valueKey: "Not specified" },
      { labelKey: "Trade/Skill:", valueKey: "Not specified" },
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
      { labelKey: "Urgency:", valueKey: "Normal" },
    ],
  },
];

export const REQUEST_CAPACITY_SUMMARY_SECTIONS =
  REQUEST_CAPACITY_WORKERS_SUMMARY_SECTIONS;

export const REQUEST_CAPACITY_EQUIPMENT_SUMMARY_SECTIONS: AvailabilitySummarySection[] = [
  {
    id: "resource",
    titleKey: "Resource type",
    icon: "resource",
    rows: [{ labelKey: "", valueKey: "Equipment" }],
  },
  {
    id: "details",
    titleKey: "Requirements",
    icon: "details",
    rows: [
      { labelKey: "Number of units:", valueKey: "Not specified" },
      { labelKey: "Type:", valueKey: "Not specified" },
      { labelKey: "Preference:", valueKey: "Very good" },
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
      { labelKey: "Urgency:", valueKey: "Urgent" },
    ],
  },
];

export const REQUEST_CAPACITY_NEXT_STEPS = [
  {
    id: 1,
    titleKey: "Search declared availability",
    descriptionKey:
      "The platform first searches for matching capacity that has been declared by network companies.",
  },
  {
    id: 2,
    titleKey: "Send targeted requests",
    descriptionKey:
      "If no direct match is found, targeted requests are sent to companies likely to have the capacity.",
  },
  {
    id: 3,
    titleKey: "Network escalation (if urgent)",
    descriptionKey:
      "For urgent requests without matches, the system can escalate to a wider network request.",
  },
] as const;

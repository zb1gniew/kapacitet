export type AvailabilityStepId = 1 | 2 | 3 | 4;

export type AvailabilityStepState = "upcoming" | "active" | "completed";

export type AvailabilityStepDefinition = {
  id: AvailabilityStepId;
  labelKey: string;
  titleKey: string;
};

export type AvailabilityResourceType = "workers";

export type AvailabilityResourceOption = {
  id: AvailabilityResourceType;
  icon: "workers";
  titleKey: string;
  descriptionKey: string;
};

export type AvailabilityCertificateOption = {
  id: string;
  labelKey: string;
};

export type AvailabilityExperienceOption = {
  id: string;
  labelKey: string;
};

export type AvailabilitySummaryRow = {
  labelKey: string;
  valueKey: string;
};

export type AvailabilitySummarySection = {
  id: "resource" | "details" | "period";
  titleKey: string;
  icon: "resource" | "details" | "period";
  rows: AvailabilitySummaryRow[];
};

export type AvailabilityStepId = 1 | 2 | 3 | 4;

export type AvailabilityStepState = "upcoming" | "active" | "completed";

export type AvailabilityStepDefinition = {
  id: AvailabilityStepId;
  labelKey: string;
  titleKey: string;
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

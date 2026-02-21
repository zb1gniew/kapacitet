export type MatchesSummaryCardTone = "success" | "warning" | "primary";

export type MatchesSummaryCard = {
  id: "available" | "awaiting" | "ready";
  titleKey: string;
  valueKey: string;
  helperKey: string;
  tone: MatchesSummaryCardTone;
};

export type DirectMatchOffer = {
  id: string;
  titleKey: string;
  statusKey: string;
  updatedAtKey: string;
  validUntilKey: string;
  availabilityValueKey: string;
  locationValueKey: string;
  certificatesValueKey: string;
  certificateKeys: ReadonlyArray<string>;
  scoreKey: string;
};

export type AwaitingConfirmationOffer = {
  id: string;
  titleKey: string;
  statusKey: string;
  descriptionKey: string;
  periodValueKey: string;
  locationValueKey: string;
  certificatesValueKey: string;
};

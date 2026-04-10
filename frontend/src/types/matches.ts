export type MatchesSummaryCardTone = "success" | "warning" | "primary";

export type MatchesSummaryCardData = {
  id: "available" | "awaiting" | "ready";
  title: string;
  value: number;
  helper: string;
  tone: MatchesSummaryCardTone;
};

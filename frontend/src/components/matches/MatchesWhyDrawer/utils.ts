import type { MatchOfferResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";

export const SCORE_LIMITS = {
  date: 30,
  location: 10,
  skills: 15,
  certificates: 15,
  quantity: 30,
} as const;

export function normalizeCity(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function getFitLabel(t: TranslateFn, score: number, maxScore: number) {
  const ratio = maxScore <= 0 ? 1 : score / maxScore;
  if (ratio >= 0.95) return t("Full match");
  if (ratio >= 0.75) return t("Strong");
  if (ratio >= 0.5) return t("Moderate");
  return t("Limited");
}

export function getUrgencyTone(urgency: MatchOfferResponse["requestUrgency"]) {
  switch (urgency) {
    case "Critical":
      return {
        badgeClassName: "border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]",
        noteKey:
          "Critical requests should be reviewed immediately and can justify wider network outreach faster.",
      };
    case "High":
      return {
        badgeClassName: "border-[#fdba74] bg-[#fff7ed] text-[#c2410c]",
        noteKey:
          "High-priority requests are surfaced faster and can justify wider network outreach when needed.",
      };
    case "Low":
      return {
        badgeClassName: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
        noteKey: "Low-priority requests stay in the normal review flow.",
      };
    default:
      return {
        badgeClassName: "border-[#d1fae5] bg-[#ecfdf5] text-[#047857]",
        noteKey: "Standard-priority requests stay in the normal review flow.",
      };
  }
}

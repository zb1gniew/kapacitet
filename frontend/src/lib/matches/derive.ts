import type {
  AgreementResponse,
  MatchOfferResponse,
} from "@/types/api-matches";
import { AGREEMENT_STATUS, MATCH_STATUS } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";
import type { MatchesSummaryCardData } from "@/types/matches";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function parseTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getPrimarySkill(skills: string[], t: TranslateFn) {
  return skills.find((skill) => skill.trim().length > 0) ?? t("Workers");
}

function pluralizeSkill(skill: string, quantity: number) {
  if (quantity === 1 || !skill) {
    return skill;
  }

  if (/[^aeiou]y$/i.test(skill)) {
    return `${skill.slice(0, -1)}ies`;
  }

  if (/(s|x|z|ch|sh)$/i.test(skill)) {
    return `${skill}es`;
  }

  return `${skill}s`;
}

export function deriveMatchesSummary(
  t: TranslateFn,
  matches: MatchOfferResponse[],
  agreements: AgreementResponse[],
): MatchesSummaryCardData[] {
  const availableToReview = matches.filter(
    (offer) =>
      (offer.status === MATCH_STATUS.PendingRequesterReview &&
        offer.perspective === "Requester") ||
      (offer.status === MATCH_STATUS.PendingSupplierConfirmation &&
        offer.perspective === "Supplier"),
  ).length;

  const awaitingConfirmation = matches.filter(
    (offer) =>
      (offer.status === MATCH_STATUS.PendingSupplierConfirmation &&
        offer.perspective === "Requester") ||
      (offer.status === MATCH_STATUS.PendingRequesterReview &&
        offer.perspective === "Supplier"),
  ).length;

  const readyToCoordinate = agreements.filter(
    (agreement) => agreement.status === AGREEMENT_STATUS.Active,
  ).length;

  return [
    {
      id: "available",
      title: t("Available to review"),
      value: availableToReview,
      helper: t("Ready for your decision"),
      tone: "success",
    },
    {
      id: "awaiting",
      title: t("Awaiting confirmation"),
      value: awaitingConfirmation,
      helper: t("Waiting on the other company"),
      tone: "warning",
    },
    {
      id: "ready",
      title: t("Ready to coordinate"),
      value: readyToCoordinate,
      helper: t("Mutual confirmation complete"),
      tone: "primary",
    },
  ];
}

export function deriveRequesterPendingOffers(matches: MatchOfferResponse[]) {
  return matches
    .filter(
      (offer) =>
        offer.perspective === "Requester" &&
        offer.status === MATCH_STATUS.PendingRequesterReview,
    )
    .sort((left, right) => right.matchScore - left.matchScore);
}

export function deriveSupplierPendingOffers(matches: MatchOfferResponse[]) {
  return matches
    .filter(
      (offer) =>
        offer.perspective === "Supplier" &&
        offer.status === MATCH_STATUS.PendingSupplierConfirmation,
    )
    .sort((left, right) => right.matchScore - left.matchScore);
}

export function deriveAwaitingOffers(matches: MatchOfferResponse[]) {
  return matches
    .filter(
      (offer) =>
        (offer.perspective === "Requester" &&
          offer.status === MATCH_STATUS.PendingSupplierConfirmation) ||
        (offer.perspective === "Supplier" &&
          offer.status === MATCH_STATUS.PendingRequesterReview),
    )
    .sort((left, right) => {
      const leftTimestamp = parseTimestamp(left.createdAt) ?? 0;
      const rightTimestamp = parseTimestamp(right.createdAt) ?? 0;
      return rightTimestamp - leftTimestamp;
    });
}

export function deriveCompletedOffers(matches: MatchOfferResponse[]) {
  return matches
    .filter((offer) => offer.status === MATCH_STATUS.AgreementCreated)
    .sort((left, right) => {
      const leftTimestamp = parseTimestamp(left.createdAt) ?? 0;
      const rightTimestamp = parseTimestamp(right.createdAt) ?? 0;
      return rightTimestamp - leftTimestamp;
    });
}

export function formatDateRange(
  t: TranslateFn,
  startDate: string,
  endDate: string,
) {
  const start = parseTimestamp(startDate);
  const end = parseTimestamp(endDate);

  if (start === null || end === null) {
    return t("Dates pending");
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function formatMatchTitle(t: TranslateFn, offer: MatchOfferResponse) {
  const skill = getPrimarySkill(offer.skills, t);
  return `${offer.offeredQuantity} ${pluralizeSkill(skill, offer.offeredQuantity)}`;
}

export function formatRelativeTime(t: TranslateFn, isoDate: string) {
  const timestamp = parseTimestamp(isoDate);

  if (timestamp === null) {
    return t("Recently");
  }

  const diffInMs = Date.now() - timestamp;

  if (diffInMs < MINUTE_IN_MS) {
    return t("Just now");
  }

  if (diffInMs < HOUR_IN_MS) {
    const minutes = Math.max(1, Math.floor(diffInMs / MINUTE_IN_MS));
    return minutes === 1
      ? t("{{count}} minute ago", { count: minutes })
      : t("{{count}} minutes ago", { count: minutes });
  }

  if (diffInMs < DAY_IN_MS) {
    const hours = Math.max(1, Math.floor(diffInMs / HOUR_IN_MS));
    return hours === 1
      ? t("{{count}} hour ago", { count: hours })
      : t("{{count}} hours ago", { count: hours });
  }

  if (diffInMs < DAY_IN_MS * 2) {
    return t("Yesterday");
  }

  const days = Math.max(1, Math.floor(diffInMs / DAY_IN_MS));
  return days === 1
    ? t("{{count}} day ago", { count: days })
    : t("{{count}} days ago", { count: days });
}

export function formatExpiresAt(t: TranslateFn, isoDate: string) {
  const timestamp = parseTimestamp(isoDate);

  if (timestamp === null) {
    return t("Expiration pending");
  }

  return t("Valid until {{date}}", {
    date: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp)),
  });
}

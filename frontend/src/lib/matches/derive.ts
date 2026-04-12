import type {
  AgreementResponse,
  MatchOfferResponse,
} from "@/types/api-matches";
import { AGREEMENT_STATUS, MATCH_STATUS } from "@/types/api-matches";
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

function getPrimarySkill(skills: string[]) {
  return skills.find((skill) => skill.trim().length > 0) ?? "Workers";
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
      title: "Available to review",
      value: availableToReview,
      helper: "Ready for your decision",
      tone: "success",
    },
    {
      id: "awaiting",
      title: "Awaiting confirmation",
      value: awaitingConfirmation,
      helper: "Waiting on the other company",
      tone: "warning",
    },
    {
      id: "ready",
      title: "Ready to coordinate",
      value: readyToCoordinate,
      helper: "Mutual confirmation complete",
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

export function formatDateRange(startDate: string, endDate: string) {
  const start = parseTimestamp(startDate);
  const end = parseTimestamp(endDate);

  if (start === null || end === null) {
    return "Dates pending";
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function formatMatchTitle(offer: MatchOfferResponse) {
  const skill = getPrimarySkill(offer.skills);
  return `${offer.offeredQuantity} ${pluralizeSkill(skill, offer.offeredQuantity)}`;
}

export function formatRelativeTime(isoDate: string) {
  const timestamp = parseTimestamp(isoDate);

  if (timestamp === null) {
    return "Recently";
  }

  const diffInMs = Date.now() - timestamp;

  if (diffInMs < MINUTE_IN_MS) {
    return "Just now";
  }

  if (diffInMs < HOUR_IN_MS) {
    const minutes = Math.max(1, Math.floor(diffInMs / MINUTE_IN_MS));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffInMs < DAY_IN_MS) {
    const hours = Math.max(1, Math.floor(diffInMs / HOUR_IN_MS));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (diffInMs < DAY_IN_MS * 2) {
    return "Yesterday";
  }

  const days = Math.max(1, Math.floor(diffInMs / DAY_IN_MS));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatExpiresAt(isoDate: string) {
  const timestamp = parseTimestamp(isoDate);

  if (timestamp === null) {
    return "Expiration pending";
  }

  return `Valid until ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp))}`;
}

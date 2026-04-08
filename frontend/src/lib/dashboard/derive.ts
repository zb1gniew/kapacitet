import type {
  AgreementResponse,
  AvailabilityDeclarationResponse,
  CapacityRequestResponse,
  MatchOfferResponse,
} from "@/types/api";
import type {
  DashboardActionBanner,
  DashboardBannerTone,
  DashboardMetric,
  DashboardProcess,
  DashboardReminder,
} from "@/types/dashboard";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatUntilDate(value?: string | null) {
  if (!value) {
    return "Live now";
  }

  return `Until ${formatShortDate(value)}`;
}

function formatRelativePublishedAt(value?: string | null, now = Date.now()) {
  const publishedAt = parseDate(value);

  if (!publishedAt) {
    return "Published recently";
  }

  const diffInMs = now - publishedAt;

  if (diffInMs < 60 * 1000) {
    return "Published just now";
  }

  if (diffInMs < HOUR_IN_MS) {
    const minutes = Math.max(1, Math.floor(diffInMs / (60 * 1000)));
    return `Published ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffInMs < DAY_IN_MS) {
    const hours = Math.max(1, Math.floor(diffInMs / HOUR_IN_MS));
    return `Published ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diffInMs / DAY_IN_MS));
  return `Published ${days} day${days === 1 ? "" : "s"} ago`;
}

function buildLocationSubtitle(locationCity?: string | null) {
  return locationCity?.trim()
    ? `Visible in ${locationCity} for trusted network companies`
    : "Visible in your trusted network";
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

function getPrimarySkill(skills: string[], fallback: string) {
  const firstSkill = skills.find((skill) => skill.trim().length > 0);
  return firstSkill ?? fallback;
}

function buildQuantityTitle(
  quantity: number,
  skills: string[],
  fallback: string,
) {
  const primarySkill = getPrimarySkill(skills, fallback);
  return `${quantity} ${pluralizeSkill(primarySkill, quantity)}`;
}

function isWithinWindow(
  targetTime: number | null,
  now: number,
  windowInMs: number,
) {
  return (
    targetTime !== null && targetTime >= now && targetTime <= now + windowInMs
  );
}

function formatDaysUntilStart(startDate: string, now = Date.now()) {
  const startTime = parseDate(startDate);

  if (startTime === null) {
    return "Starts soon";
  }

  const daysUntilStart = Math.max(0, Math.ceil((startTime - now) / DAY_IN_MS));

  if (daysUntilStart === 0) {
    return "Starts today";
  }

  return `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? "" : "s"}`;
}

function getLatestRequestActivityTimestamp(
  request: CapacityRequestResponse,
  matches: MatchOfferResponse[],
) {
  const requestTimestamp =
    parseDate(request.publishedAt) ?? parseDate(request.createdAt) ?? 0;
  const latestMatchTimestamp = matches.reduce((latest, match) => {
    const matchTimestamp = parseDate(match.createdAt) ?? 0;
    return Math.max(latest, matchTimestamp);
  }, 0);

  return Math.max(requestTimestamp, latestMatchTimestamp);
}

function getLatestAvailabilityActivityTimestamp(
  availability: AvailabilityDeclarationResponse,
  matches: MatchOfferResponse[],
) {
  const availabilityTimestamp =
    parseDate(availability.publishedAt) ??
    parseDate(availability.createdAt) ??
    0;
  const latestMatchTimestamp = matches.reduce((latest, match) => {
    const matchTimestamp = parseDate(match.createdAt) ?? 0;
    return Math.max(latest, matchTimestamp);
  }, 0);

  return Math.max(availabilityTimestamp, latestMatchTimestamp);
}

function buildAvailabilityProcess(
  availability: AvailabilityDeclarationResponse,
  matches: MatchOfferResponse[],
): DashboardProcess {
  const relatedMatches = matches.filter(
    (match) => match.availabilityId === availability.id,
  );
  const pendingSupplierConfirmationMatches = relatedMatches.filter(
    (match) => match.status === "PendingSupplierConfirmation",
  );
  const pendingRequesterReviewMatches = relatedMatches.filter(
    (match) => match.status === "PendingRequesterReview",
  );
  const agreementCreatedMatches = relatedMatches.filter(
    (match) => match.status === "AgreementCreated",
  );

  let subtitle = buildLocationSubtitle(availability.locationCity);
  let status = "Availability published";
  let statusTone: DashboardProcess["statusTone"] = "success";
  let cta = "Review availability";

  if (pendingSupplierConfirmationMatches.length > 0) {
    subtitle = `${pendingSupplierConfirmationMatches.length} match${
      pendingSupplierConfirmationMatches.length === 1 ? "" : "es"
    } waiting for supplier confirmation`;
    status = "Confirmation needed";
    statusTone = "primary";
    cta = "Review match";
  } else if (pendingRequesterReviewMatches.length > 0) {
    subtitle = `${pendingRequesterReviewMatches.length} potential match${
      pendingRequesterReviewMatches.length === 1 ? "" : "es"
    } currently under requester review`;
    status = "Match under review";
    statusTone = "primary";
    cta = "Track matches";
  } else if (agreementCreatedMatches.length > 0) {
    subtitle = "Agreement confirmed";
    status = "Agreement confirmed";
    statusTone = "success";
    cta = "View agreement";
  }

  return {
    id: availability.id,
    kind: "availability",
    title: buildQuantityTitle(
      availability.quantity,
      availability.skills,
      "Availability",
    ),
    subtitle,
    meta: formatUntilDate(availability.endDate),
    status,
    statusTone,
    cta,
  };
}

function buildRequestProcess(
  request: CapacityRequestResponse,
  matches: MatchOfferResponse[],
): DashboardProcess {
  const relatedMatches = matches.filter(
    (match) => match.requestId === request.id,
  );
  const pendingRequesterReviewMatches = relatedMatches.filter(
    (match) => match.status === "PendingRequesterReview",
  );
  const pendingSupplierConfirmationMatches = relatedMatches.filter(
    (match) => match.status === "PendingSupplierConfirmation",
  );
  const agreementCreatedMatches = relatedMatches.filter(
    (match) => match.status === "AgreementCreated",
  );

  let subtitle = "System analyzing network capacity";
  let status = "Matching in progress";
  let statusTone: DashboardProcess["statusTone"] = "neutral";
  let cta = "View details";

  if (pendingRequesterReviewMatches.length > 0) {
    subtitle = `${pendingRequesterReviewMatches.length} potential match${
      pendingRequesterReviewMatches.length === 1 ? "" : "es"
    } from network companies`;
    status = "Direct match found";
    statusTone = "success";
    cta = "View matches";
  } else if (pendingSupplierConfirmationMatches.length > 0) {
    subtitle = "Awaiting supplier confirmation";
    status = "Awaiting confirmation";
    statusTone = "primary";
  } else if (agreementCreatedMatches.length > 0) {
    subtitle = "Agreement confirmed";
    status = "Agreement confirmed";
    statusTone = "success";
    cta = "View agreement";
  }

  return {
    id: request.id,
    kind: "request",
    title: buildQuantityTitle(request.quantity, request.skills, "Capacity"),
    subtitle,
    meta: formatRelativePublishedAt(request.publishedAt ?? request.createdAt),
    status,
    statusTone,
    cta,
  };
}

export function deriveMetrics(
  availability: AvailabilityDeclarationResponse[],
  requests: CapacityRequestResponse[],
  matches: MatchOfferResponse[],
): DashboardMetric[] {
  const activeAvailabilityCount = availability.filter(
    (entry) => entry.status === "Active",
  ).length;
  const activeRequestCount = requests.filter(
    (entry) => entry.status === "Active",
  ).length;
  const actionsNeededCount = matches.filter(
    (entry) => entry.status === "PendingRequesterReview",
  ).length;

  return [
    {
      label: "Declared availability",
      value: `${activeAvailabilityCount} Active`,
      icon: "users",
      tone: "success",
    },
    {
      label: "Declared needs",
      value: `${activeRequestCount} Searching`,
      icon: "search",
      tone: "primary",
    },
    {
      label: "Actions needed",
      value: `${actionsNeededCount} Requires response`,
      icon: "warning",
      tone: "danger",
      highlighted: actionsNeededCount > 0,
    },
  ];
}

export function deriveActiveProcesses(
  availability: AvailabilityDeclarationResponse[],
  requests: CapacityRequestResponse[],
  matches: MatchOfferResponse[],
): DashboardProcess[] {
  return [
    ...requests
      .filter((request) => request.status === "Active")
      .map((request) => buildRequestProcess(request, matches)),
    ...availability
      .filter((entry) => entry.status === "Active")
      .map((entry) => buildAvailabilityProcess(entry, matches)),
  ]
    .sort((left, right) => {
      const leftTimestamp =
        left.kind === "request"
          ? getLatestRequestActivityTimestamp(
              requests.find((request) => request.id === left.id)!,
              matches.filter((match) => match.requestId === left.id),
            )
          : getLatestAvailabilityActivityTimestamp(
              availability.find((entry) => entry.id === left.id)!,
              matches.filter((match) => match.availabilityId === left.id),
            );
      const rightTimestamp =
        right.kind === "request"
          ? getLatestRequestActivityTimestamp(
              requests.find((request) => request.id === right.id)!,
              matches.filter((match) => match.requestId === right.id),
            )
          : getLatestAvailabilityActivityTimestamp(
              availability.find((entry) => entry.id === right.id)!,
              matches.filter((match) => match.availabilityId === right.id),
            );

      return rightTimestamp - leftTimestamp;
    })
    .slice(0, 5);
}

export function deriveReminders(
  availability: AvailabilityDeclarationResponse[],
  requests: CapacityRequestResponse[],
  matches: MatchOfferResponse[],
  agreements: AgreementResponse[],
): DashboardReminder[] {
  const now = Date.now();
  const agreementRequestIds = new Set(
    agreements.map((agreement) => agreement.requestId),
  );
  const urgentItems = [
    ...availability
      .filter((entry) => entry.status === "Active")
      .map((entry) => ({
        date: entry.endDate,
        tone: "success" as const,
        title: "Availability expiring",
        description: `${getPrimarySkill(entry.skills, "Availability")} capacity ends`,
      }))
      .filter((entry) =>
        isWithinWindow(parseDate(entry.date), now, 7 * DAY_IN_MS),
      ),
    ...requests
      .filter(
        (request) =>
          request.status === "Active" && !agreementRequestIds.has(request.id),
      )
      .map((request) => ({
        date: request.startDate,
        tone: "primary" as const,
        title: "Request start date",
        description: `${getPrimarySkill(request.skills, "Capacity")} needed period begins`,
      }))
      .filter((entry) =>
        isWithinWindow(parseDate(entry.date), now, 7 * DAY_IN_MS),
      ),
    ...matches
      .filter((match) => match.status === "PendingRequesterReview")
      .map((match) => ({
        date: match.expiresAt,
        tone: "danger" as const,
        title: "Response deadline",
        description: "Pending match response expires soon",
      }))
      .filter((entry) =>
        isWithinWindow(parseDate(entry.date), now, 48 * HOUR_IN_MS),
      ),
  ];

  if (urgentItems.length > 0) {
    return urgentItems
      .sort((left, right) => {
        const leftTime = parseDate(left.date) ?? Number.MAX_SAFE_INTEGER;
        const rightTime = parseDate(right.date) ?? Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })
      .slice(0, 5)
      .map((entry) => ({
        title: entry.title,
        description: entry.description,
        date: entry.date ?? new Date(now).toISOString(),
        tone: entry.tone,
      }));
  }

  return [
    ...availability
      .filter((entry) => entry.status === "Active")
      .map((entry) => ({
        date: entry.endDate,
        tone: "success" as const,
        title: "Availability live",
        description: `${buildQuantityTitle(entry.quantity, entry.skills, "Availability")} visible in ${entry.locationCity || "your market"}`,
      })),
    ...requests
      .filter((request) => request.status === "Active")
      .map((request) => ({
        date: request.startDate,
        tone: "primary" as const,
        title: "Request live",
        description: `${buildQuantityTitle(request.quantity, request.skills, "Capacity")} still open for matching`,
      })),
  ]
    .sort((left, right) => {
      const leftTime = parseDate(left.date) ?? Number.MAX_SAFE_INTEGER;
      const rightTime = parseDate(right.date) ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })
    .slice(0, 5)
    .map((entry) => ({
      title: entry.title,
      description: entry.description,
      date: entry.date ?? new Date(now).toISOString(),
      tone: entry.tone,
    }));
}

export function deriveActionBanner(
  availability: AvailabilityDeclarationResponse[],
  requests: CapacityRequestResponse[],
  matches: MatchOfferResponse[],
): DashboardActionBanner | null {
  const now = Date.now();

  const mostUrgentRequest = requests
    .filter((request) => request.status === "Active")
    .filter((request) =>
      isWithinWindow(parseDate(request.startDate), now, 14 * DAY_IN_MS),
    )
    .filter(
      (request) =>
        !matches.some(
          (match) =>
            match.requestId === request.id &&
            match.status === "AgreementCreated",
        ),
    )
    .sort((left, right) => {
      const leftTime = parseDate(left.startDate) ?? Number.MAX_SAFE_INTEGER;
      const rightTime = parseDate(right.startDate) ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })[0];

  if (!mostUrgentRequest) {
    const mostRecentAvailability = availability
      .filter((entry) => entry.status === "Active")
      .sort((left, right) => {
        const leftTime =
          parseDate(left.publishedAt) ?? parseDate(left.createdAt) ?? 0;
        const rightTime =
          parseDate(right.publishedAt) ?? parseDate(right.createdAt) ?? 0;
        return rightTime - leftTime;
      })[0];

    if (mostRecentAvailability) {
      return {
        id: mostRecentAvailability.id,
        kind: "availability",
        tone: "success",
        badge: "Availability live",
        timing: formatUntilDate(mostRecentAvailability.endDate),
        title: `${buildQuantityTitle(
          mostRecentAvailability.quantity,
          mostRecentAvailability.skills,
          "Availability",
        )} is now visible in your trusted network`,
        description: `${
          mostRecentAvailability.locationCity
            ? `${mostRecentAvailability.locationCity} availability is open for matching. `
            : ""
        }Keep your declaration current so trusted companies can respond with relevant demand.`,
        cta: "Review availability",
      };
    }

    const mostRecentRequest = requests
      .filter((request) => request.status === "Active")
      .sort((left, right) => {
        const leftTime =
          parseDate(left.publishedAt) ?? parseDate(left.createdAt) ?? 0;
        const rightTime =
          parseDate(right.publishedAt) ?? parseDate(right.createdAt) ?? 0;
        return rightTime - leftTime;
      })[0];

    if (mostRecentRequest) {
      return {
        id: mostRecentRequest.id,
        kind: "request",
        tone: "primary",
        badge: "Request live",
        timing: formatDaysUntilStart(mostRecentRequest.startDate, now),
        title: `${buildQuantityTitle(
          mostRecentRequest.quantity,
          mostRecentRequest.skills,
          "Capacity",
        )} is now being matched across your network`,
        description:
          "Your request is active and we are monitoring network capacity for relevant opportunities.",
        cta: "Review request",
      };
    }

    return null;
  }

  const primarySkill = getPrimarySkill(
    mostUrgentRequest.skills,
    "Capacity request",
  );

  return {
    id: mostUrgentRequest.id,
    kind: "request",
    tone: "warning" as DashboardBannerTone,
    badge: "Action required",
    timing: formatDaysUntilStart(mostUrgentRequest.startDate, now),
    title: `${primarySkill} request starts ${formatShortDate(
      mostUrgentRequest.startDate,
    )} - No confirmed match yet`,
    description:
      "Your capacity request begins soon but matching is still in progress. Consider expanding search criteria or contacting network companies directly.",
    cta: "View and take action",
  };
}

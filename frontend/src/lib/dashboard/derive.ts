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
import type { TranslateFn } from "@/types/i18n";
import { APP_ROUTES } from "@/constants/routes";

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

function formatUntilDate(t: TranslateFn, value?: string | null) {
  if (!value) {
    return t("Live now");
  }

  return t("Until {{date}}", { date: formatShortDate(value) });
}

function formatRelativePublishedAt(
  t: TranslateFn,
  value?: string | null,
  now = Date.now(),
) {
  const publishedAt = parseDate(value);

  if (!publishedAt) {
    return t("Published recently");
  }

  const diffInMs = now - publishedAt;

  if (diffInMs < 60 * 1000) {
    return t("Published just now");
  }

  if (diffInMs < HOUR_IN_MS) {
    const minutes = Math.max(1, Math.floor(diffInMs / (60 * 1000)));
    return minutes === 1
      ? t("Published {{count}} minute ago", { count: minutes })
      : t("Published {{count}} minutes ago", { count: minutes });
  }

  if (diffInMs < DAY_IN_MS) {
    const hours = Math.max(1, Math.floor(diffInMs / HOUR_IN_MS));
    return hours === 1
      ? t("Published {{count}} hour ago", { count: hours })
      : t("Published {{count}} hours ago", { count: hours });
  }

  const days = Math.max(1, Math.floor(diffInMs / DAY_IN_MS));
  return days === 1
    ? t("Published {{count}} day ago", { count: days })
    : t("Published {{count}} days ago", { count: days });
}

function buildLocationSubtitle(t: TranslateFn, locationCity?: string | null) {
  return locationCity?.trim()
    ? t("Visible in {{locationCity}} for trusted network companies", {
        locationCity,
      })
    : t("Visible in your trusted network");
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

function buildMatchesHref(matchId?: number | null) {
  return matchId
    ? `${APP_ROUTES.matches}?matchId=${matchId}`
    : APP_ROUTES.matches;
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

function formatDaysUntilStart(
  t: TranslateFn,
  startDate: string,
  now = Date.now(),
) {
  const startTime = parseDate(startDate);

  if (startTime === null) {
    return t("Starts soon");
  }

  const daysUntilStart = Math.max(0, Math.ceil((startTime - now) / DAY_IN_MS));

  if (daysUntilStart === 0) {
    return t("Starts today");
  }

  return daysUntilStart === 1
    ? t("Starts in {{count}} day", { count: daysUntilStart })
    : t("Starts in {{count}} days", { count: daysUntilStart });
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
  t: TranslateFn,
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

  let subtitle = buildLocationSubtitle(t, availability.locationCity);
  let status = t("Availability published");
  let statusTone: DashboardProcess["statusTone"] = "success";
  let cta = t("Review availability");
  let href: DashboardProcess["href"] = APP_ROUTES.matches;

  if (pendingSupplierConfirmationMatches.length > 0) {
    subtitle =
      pendingSupplierConfirmationMatches.length === 1
        ? t("{{count}} match waiting for supplier confirmation", {
            count: pendingSupplierConfirmationMatches.length,
          })
        : t("{{count}} matches waiting for supplier confirmation", {
            count: pendingSupplierConfirmationMatches.length,
          });
    status = t("Confirmation needed");
    statusTone = "primary";
    cta = t("Review match");
    href = buildMatchesHref(pendingSupplierConfirmationMatches[0]?.id);
  } else if (pendingRequesterReviewMatches.length > 0) {
    subtitle =
      pendingRequesterReviewMatches.length === 1
        ? t("{{count}} potential match currently under requester review", {
            count: pendingRequesterReviewMatches.length,
          })
        : t("{{count}} potential matches currently under requester review", {
            count: pendingRequesterReviewMatches.length,
          });
    status = t("Match under review");
    statusTone = "primary";
    cta = t("Track matches");
    href = buildMatchesHref(pendingRequesterReviewMatches[0]?.id);
  } else if (agreementCreatedMatches.length > 0) {
    subtitle = t("Agreement confirmed");
    status = t("Agreement confirmed");
    statusTone = "success";
    cta = t("View agreement");
    href = buildMatchesHref(agreementCreatedMatches[0]?.id);
  }

  return {
    id: availability.id,
    kind: "availability",
    title: buildQuantityTitle(
      availability.quantity,
      availability.skills,
      t("Availability"),
    ),
    subtitle,
    meta: formatUntilDate(t, availability.endDate),
    status,
    statusTone,
    cta,
    href,
  };
}

function buildRequestProcess(
  t: TranslateFn,
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

  let subtitle = t("System analyzing network capacity");
  let status = t("Matching in progress");
  let statusTone: DashboardProcess["statusTone"] = "neutral";
  let cta = t("View details");
  let href: DashboardProcess["href"] = APP_ROUTES.matches;

  if (pendingRequesterReviewMatches.length > 0) {
    subtitle =
      pendingRequesterReviewMatches.length === 1
        ? t("{{count}} potential match from network companies", {
            count: pendingRequesterReviewMatches.length,
          })
        : t("{{count}} potential matches from network companies", {
            count: pendingRequesterReviewMatches.length,
          });
    status = t("Direct match found");
    statusTone = "success";
    cta = t("View matches");
    href = buildMatchesHref(pendingRequesterReviewMatches[0]?.id);
  } else if (pendingSupplierConfirmationMatches.length > 0) {
    subtitle = t("Awaiting supplier confirmation");
    status = t("Awaiting confirmation");
    statusTone = "primary";
    href = buildMatchesHref(pendingSupplierConfirmationMatches[0]?.id);
  } else if (agreementCreatedMatches.length > 0) {
    subtitle = t("Agreement confirmed");
    status = t("Agreement confirmed");
    statusTone = "success";
    cta = t("View agreement");
    href = buildMatchesHref(agreementCreatedMatches[0]?.id);
  }

  return {
    id: request.id,
    kind: "request",
    title: buildQuantityTitle(request.quantity, request.skills, t("Capacity")),
    subtitle,
    meta: formatRelativePublishedAt(
      t,
      request.publishedAt ?? request.createdAt,
    ),
    status,
    statusTone,
    cta,
    href,
  };
}

export function deriveMetrics(
  t: TranslateFn,
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
      label: t("Declared availability"),
      value: t("{{count}} Active", { count: activeAvailabilityCount }),
      icon: "users",
      tone: "success",
    },
    {
      label: t("Declared needs"),
      value: t("{{count}} Searching", { count: activeRequestCount }),
      icon: "search",
      tone: "primary",
    },
    {
      label: t("Actions needed"),
      value: t("{{count}} Requires response", { count: actionsNeededCount }),
      icon: "warning",
      tone: "danger",
      highlighted: actionsNeededCount > 0,
    },
  ];
}

export function deriveActiveProcesses(
  t: TranslateFn,
  availability: AvailabilityDeclarationResponse[],
  requests: CapacityRequestResponse[],
  matches: MatchOfferResponse[],
): DashboardProcess[] {
  return [
    ...requests
      .filter((request) => request.status === "Active")
      .map((request) => buildRequestProcess(t, request, matches)),
    ...availability
      .filter((entry) => entry.status === "Active")
      .map((entry) => buildAvailabilityProcess(t, entry, matches)),
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
  t: TranslateFn,
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
        title: t("Availability expiring"),
        description: t("{{skill}} capacity ends", {
          skill: getPrimarySkill(entry.skills, t("Availability")),
        }),
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
        title: t("Request start date"),
        description: t("{{skill}} needed period begins", {
          skill: getPrimarySkill(request.skills, t("Capacity")),
        }),
      }))
      .filter((entry) =>
        isWithinWindow(parseDate(entry.date), now, 7 * DAY_IN_MS),
      ),
    ...matches
      .filter((match) => match.status === "PendingRequesterReview")
      .map((match) => ({
        date: match.expiresAt,
        tone: "danger" as const,
        title: t("Response deadline"),
        description: t("Pending match response expires soon"),
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
        title: t("Availability live"),
        description: t("{{title}} visible in {{location}}", {
          title: buildQuantityTitle(
            entry.quantity,
            entry.skills,
            t("Availability"),
          ),
          location: entry.locationCity || t("your market"),
        }),
      })),
    ...requests
      .filter((request) => request.status === "Active")
      .map((request) => ({
        date: request.startDate,
        tone: "primary" as const,
        title: t("Request live"),
        description: t("{{title}} still open for matching", {
          title: buildQuantityTitle(request.quantity, request.skills, t("Capacity")),
        }),
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
  t: TranslateFn,
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
        badge: t("Availability live"),
        timing: formatUntilDate(t, mostRecentAvailability.endDate),
        title: t("{{title}} is now visible in your trusted network", {
          title: buildQuantityTitle(
            mostRecentAvailability.quantity,
            mostRecentAvailability.skills,
            t("Availability"),
          ),
        }),
        description: mostRecentAvailability.locationCity
          ? t(
              "{{location}} availability is open for matching. Keep your declaration current so trusted companies can respond with relevant demand.",
              {
                location: mostRecentAvailability.locationCity,
              },
            )
          : t(
              "Keep your declaration current so trusted companies can respond with relevant demand.",
            ),
        cta: t("Review availability"),
        href: APP_ROUTES.matches,
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
        badge: t("Request live"),
        timing: formatDaysUntilStart(t, mostRecentRequest.startDate, now),
        title: t("{{title}} is now being matched across your network", {
          title: buildQuantityTitle(
            mostRecentRequest.quantity,
            mostRecentRequest.skills,
            t("Capacity"),
          ),
        }),
        description: t(
          "Your request is active and we are monitoring network capacity for relevant opportunities.",
        ),
        cta: t("Review request"),
        href: APP_ROUTES.matches,
      };
    }

    return null;
  }

  const primarySkill = getPrimarySkill(
    mostUrgentRequest.skills,
    t("Capacity request"),
  );

  return {
    id: mostUrgentRequest.id,
    kind: "request",
    tone: "warning" as DashboardBannerTone,
    badge: t("Action required"),
    timing: formatDaysUntilStart(t, mostUrgentRequest.startDate, now),
    title: t("{{skill}} request starts {{date}} - No confirmed match yet", {
      skill: primarySkill,
      date: formatShortDate(mostUrgentRequest.startDate),
    }),
    description: t(
      "Your capacity request begins soon but matching is still in progress. Consider expanding search criteria or contacting network companies directly.",
    ),
    cta: t("View and take action"),
    href: APP_ROUTES.matches,
  };
}

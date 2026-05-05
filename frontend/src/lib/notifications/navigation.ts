import { APP_ROUTES } from "@/constants/routes";
import type {
  NotificationResponse,
  NotificationType,
} from "@/types/api-notifications";

type ParsedNotificationMetadata = {
  agreementId?: number;
  matchId?: number;
  matchOfferId?: number;
  requestId?: number;
};

export function parseNotificationMetadata(
  metadata: string | null,
): ParsedNotificationMetadata {
  if (!metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadata) as ParsedNotificationMetadata;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function appendQuery(path: string, key: string, value: number) {
  const search = new URLSearchParams({ [key]: String(value) });
  return `${path}?${search.toString()}`;
}

export function getNotificationActionLabel(notification: NotificationResponse) {
  const metadata = parseNotificationMetadata(notification.metadata);

  if (metadata.agreementId) {
    return "Go to agreement";
  }

  if (metadata.matchOfferId || metadata.matchId) {
    return "Go to match";
  }

  if (metadata.requestId) {
    return "Go to request";
  }

  return "Open";
}

export function getNotificationHref(notification: NotificationResponse) {
  const metadata = parseNotificationMetadata(notification.metadata);

  if (metadata.agreementId) {
    return appendQuery(APP_ROUTES.matches, "agreementId", metadata.agreementId);
  }

  if (metadata.matchOfferId || metadata.matchId) {
    return appendQuery(
      APP_ROUTES.matches,
      "matchId",
      metadata.matchOfferId ?? metadata.matchId!,
    );
  }

  if (
    notification.type === ("NetworkEscalation" satisfies NotificationType) &&
    metadata.requestId
  ) {
    return appendQuery(
      APP_ROUTES.networkRequests,
      "requestId",
      metadata.requestId,
    );
  }

  if (notification.type === "MatchDeadline") {
    return APP_ROUTES.matches;
  }

  if (notification.type === "UpcomingCooperation") {
    return APP_ROUTES.matches;
  }

  if (notification.type === "NewMatch") {
    return APP_ROUTES.matches;
  }

  if (notification.type === "SupplierConfirmationRequest") {
    return APP_ROUTES.matches;
  }

  if (notification.type === "NetworkEscalation") {
    return APP_ROUTES.networkRequests;
  }

  return APP_ROUTES.dashboard;
}

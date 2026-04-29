import { describe, expect, it } from "vitest";
import type { NotificationResponse } from "@/types/api-notifications";
import {
  getNotificationActionLabel,
  getNotificationHref,
  parseNotificationMetadata,
} from "./navigation";

function notification(
  overrides: Partial<NotificationResponse> = {},
): NotificationResponse {
  return {
    id: 1,
    type: "NewMatch",
    title: "New match",
    body: "A new match is ready",
    isRead: false,
    createdAt: "2026-04-28T00:00:00.000Z",
    metadata: null,
    ...overrides,
  };
}

describe("notification navigation", () => {
  it("parses metadata safely", () => {
    expect(parseNotificationMetadata(null)).toEqual({});
    expect(parseNotificationMetadata("invalid-json")).toEqual({});
    expect(parseNotificationMetadata(JSON.stringify({ matchId: 4 }))).toEqual({
      matchId: 4,
    });
  });

  it("derives action labels from metadata", () => {
    expect(
      getNotificationActionLabel(
        notification({ metadata: JSON.stringify({ agreementId: 3 }) }),
      ),
    ).toBe("Go to agreement");
    expect(
      getNotificationActionLabel(
        notification({ metadata: JSON.stringify({ matchId: 4 }) }),
      ),
    ).toBe("Go to match");
    expect(
      getNotificationActionLabel(
        notification({ metadata: JSON.stringify({ requestId: 5 }) }),
      ),
    ).toBe("Go to request");
  });

  it("builds hrefs based on metadata and notification type", () => {
    expect(
      getNotificationHref(
        notification({ metadata: JSON.stringify({ agreementId: 3 }) }),
      ),
    ).toContain("agreementId=3");
    expect(
      getNotificationHref(
        notification({ metadata: JSON.stringify({ matchOfferId: 4 }) }),
      ),
    ).toContain("matchId=4");
    expect(
      getNotificationHref(
        notification({
          type: "NetworkEscalation",
          metadata: JSON.stringify({ requestId: 5 }),
        }),
      ),
    ).toContain("requestId=5");
    expect(getNotificationHref(notification({ type: "MatchDeadline" }))).toBe(
      "/dashboard/matches",
    );
  });
});

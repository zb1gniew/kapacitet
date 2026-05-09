import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationPanel } from "./NotificationPanel";
import type { NotificationResponse } from "@/types/api-notifications";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/useLocalizedScreen", () => ({
  useLocalizedScreen: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "{{count}}m ago") {
        return `${options?.count}m ago`;
      }
      if (key === "{{count}}h ago") {
        return `${options?.count}h ago`;
      }
      if (key === "{{count}}d ago") {
        return `${options?.count}d ago`;
      }
      return key;
    },
  }),
}));

vi.mock("@/lib/notifications/navigation", () => ({
  getNotificationActionLabel: (notification: NotificationResponse) =>
    notification.type === "NewMatch" ? "Open match" : "Review request",
  getNotificationHref: (notification: NotificationResponse) =>
    `/go/${notification.id}`,
}));

const notifications: NotificationResponse[] = [
  {
    id: 1,
    type: "NewMatch",
    title: "New match available",
    body: "A relevant supplier has been found.",
    isRead: false,
    createdAt: "2026-05-09T09:59:00Z",
    metadata: null,
  },
  {
    id: 2,
    type: "NetworkEscalation",
    title: "Network request",
    body: "Urgent escalation waiting for review.",
    isRead: true,
    createdAt: "2026-05-09T08:00:00Z",
    metadata: null,
  },
];

describe("NotificationPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T10:00:00Z"));
  });

  it("filters the list to unread notifications only", () => {
    render(
      <NotificationPanel
        notifications={notifications}
        loading={false}
        error={null}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Unread only" }));

    expect(screen.getByText("New match available")).toBeInTheDocument();
    expect(screen.queryByText("Network request")).not.toBeInTheDocument();
    expect(screen.getByText("1m ago")).toBeInTheDocument();
  });

  it("shows an empty filtered state when no notifications match the active filters", () => {
    render(
      <NotificationPanel
        notifications={notifications}
        loading={false}
        error={null}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Network requests/i }));
    fireEvent.click(screen.getByRole("switch", { name: "Unread only" }));

    expect(
      screen.getByText("No unread notifications in this view"),
    ).toBeInTheDocument();
  });

  it("marks unread notifications as read before navigating away", async () => {
    const onMarkAsRead = vi.fn().mockResolvedValue(undefined);
    const onNavigate = vi.fn();

    render(
      <NotificationPanel
        notifications={notifications}
        loading={false}
        error={null}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open match" }));
      await Promise.resolve();
    });

    expect(onMarkAsRead).toHaveBeenCalledWith(1);
    expect(onNavigate).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/go/1");
  });
});

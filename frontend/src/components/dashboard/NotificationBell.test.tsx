import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "./NotificationBell";

const TEST_TIMEOUT_MS = 10_000;
const useNotificationsMock = vi.fn();
const notificationPanelMock = vi.fn();

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => useNotificationsMock(),
}));

vi.mock("./NotificationPanel", () => ({
  NotificationPanel: (props: unknown) => {
    notificationPanelMock(props);
    return (
      <div data-testid="notification-panel">
        <button
          type="button"
          onClick={() => (props as { onNavigate: () => void }).onNavigate()}
        >
          Close panel
        </button>
      </div>
    );
  },
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationsMock.mockReturnValue({
      notifications: [{ id: 1, isRead: false }],
      unreadCount: 3,
      loading: false,
      error: null,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });
  });

  it(
    "shows the unread badge and opens the notification panel with hook data",
    () => {
      render(<NotificationBell ariaLabel="Alerts" />);

      expect(screen.getByText("3")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Alerts" }));

      expect(screen.getByTestId("notification-panel")).toBeInTheDocument();
      expect(notificationPanelMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          notifications: [{ id: 1, isRead: false }],
          loading: false,
          error: null,
        }),
      );
    },
    TEST_TIMEOUT_MS,
  );

  it("caps large unread counts at 99+", () => {
    useNotificationsMock.mockReturnValueOnce({
      notifications: [],
      unreadCount: 120,
      loading: false,
      error: null,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });

    render(<NotificationBell />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("closes the panel when clicking outside or when the panel navigates", () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByTestId("notification-panel")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("notification-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));

    expect(screen.queryByTestId("notification-panel")).not.toBeInTheDocument();
  });
});

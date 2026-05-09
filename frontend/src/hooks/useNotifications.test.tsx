import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNotifications } from "./useNotifications";

vi.mock("@/lib/backend/errors", () => ({
  parseProblemDetails: vi.fn(async () => ({
    message: "Backend notification error",
  })),
}));

describe("useNotifications", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads notifications and computes unread count", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 1,
            type: "NewMatch",
            title: "New match",
            body: "You have a new match.",
            isRead: false,
            createdAt: "2026-05-01T10:00:00Z",
            metadata: null,
          },
          {
            id: 2,
            type: "MatchDeadline",
            title: "Deadline",
            body: "Review deadline approaching.",
            isRead: true,
            createdAt: "2026-05-01T09:00:00Z",
            metadata: null,
          },
        ]),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("rolls back optimistic markAsRead updates when the backend call fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 11,
              type: "NewMatch",
              title: "Unread match",
              body: "Read me",
              isRead: false,
              createdAt: "2026-05-01T10:00:00Z",
              metadata: null,
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead(11);
    });

    expect(result.current.notifications[0].isRead).toBe(false);
    expect(result.current.error).toBe("Backend notification error");
  });

  it("marks all as read successfully and clears previous errors", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 21,
              type: "NewMatch",
              title: "One",
              body: "One",
              isRead: false,
              createdAt: "2026-05-01T10:00:00Z",
              metadata: null,
            },
            {
              id: 22,
              type: "NetworkEscalation",
              title: "Two",
              body: "Two",
              isRead: false,
              createdAt: "2026-05-01T11:00:00Z",
              metadata: null,
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(
      result.current.notifications.every((notification) => notification.isRead),
    ).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.error).toBeNull();
  });
});

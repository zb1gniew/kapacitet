"use client";

import { useCallback, useEffect, useState } from "react";
import { parseProblemDetails } from "@/lib/backend/errors";
import type { NotificationResponse } from "@/types/api-notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok)
        throw new Error(`Failed to load notifications (${response.status})`);
      const data = (await response.json()) as NotificationResponse[];
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      const previousNotifications = notifications;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      try {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error((await parseProblemDetails(response)).message);
        }
        setError(null);
      } catch (err) {
        setNotifications(previousNotifications);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update notification state.",
        );
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notifications;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error((await parseProblemDetails(response)).message);
      }
      setError(null);
    } catch (err) {
      setNotifications(previousNotifications);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification state.",
      );
    }
  }, [notifications]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

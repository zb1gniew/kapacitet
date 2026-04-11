"use client";

import { useCallback, useEffect, useState } from "react";
import type { NotificationResponse } from "@/types/api-notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load notifications (${response.status})`);
      const data = (await response.json()) as NotificationResponse[];
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {
      void refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      void refresh();
    }
  }, [refresh]);

  useEffect(() => { void refresh(); }, [refresh]);

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

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import {
  getNotificationActionLabel,
  getNotificationHref,
} from "@/lib/notifications/navigation";
import type {
  NotificationResponse,
  NotificationType,
} from "@/types/api-notifications";

function formatRelativeTime(
  t: (key: string, options?: Record<string, unknown>) => string,
  isoString: string,
): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("Just now");
  if (minutes < 60) return t("{{count}}m ago", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("{{count}}h ago", { count: hours });
  return t("{{count}}d ago", { count: Math.floor(hours / 24) });
}

type Props = {
  notifications: NotificationResponse[];
  loading: boolean;
  error?: string | null;
  onMarkAsRead: (id: number) => void | Promise<void>;
  onMarkAllAsRead: () => void;
  onNavigate?: () => void;
};

type NotificationFilter = "all" | NotificationType;

const NOTIFICATION_TYPE_ORDER: NotificationType[] = [
  "SupplierConfirmationRequest",
  "NewMatch",
  "NetworkEscalation",
  "MatchDeadline",
];

function getNotificationTypeLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  type: NotificationType,
) {
  switch (type) {
    case "SupplierConfirmationRequest":
      return t("Confirmation requests");
    case "NewMatch":
      return t("New matches");
    case "NetworkEscalation":
      return t("Network requests");
    case "MatchDeadline":
      return t("Deadlines");
    default:
      return t("Other");
  }
}

export function NotificationPanel({
  notifications,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}: Props) {
  const router = useRouter();
  const { t } = useLocalizedScreen();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const hasUnread = notifications.some((n) => !n.isRead);

  const filterOptions = useMemo(() => {
    const typeCounts = notifications.reduce<Record<NotificationType, number>>(
      (counts, notification) => {
        counts[notification.type] = (counts[notification.type] ?? 0) + 1;
        return counts;
      },
      {
        SupplierConfirmationRequest: 0,
        NewMatch: 0,
        NetworkEscalation: 0,
        MatchDeadline: 0,
      },
    );

    return [
      {
        value: "all" as const,
        label: t("All"),
        count: notifications.length,
      },
      ...NOTIFICATION_TYPE_ORDER.filter((type) => typeCounts[type] > 0).map(
        (type) => ({
          value: type,
          label: getNotificationTypeLabel(t, type),
          count: typeCounts[type],
        }),
      ),
    ];
  }, [notifications, t]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeFilter !== "all" && notification.type !== activeFilter) {
        return false;
      }

      if (unreadOnly && notification.isRead) {
        return false;
      }

      return true;
    });
  }, [activeFilter, notifications, unreadOnly]);

  const groupedNotifications = useMemo(() => {
    return NOTIFICATION_TYPE_ORDER.map((type) => ({
      type,
      label: getNotificationTypeLabel(t, type),
      items: filteredNotifications.filter(
        (notification) => notification.type === type,
      ),
    })).filter((group) => group.items.length > 0);
  }, [filteredNotifications, t]);

  async function handleOpen(notification: NotificationResponse) {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }

    onNavigate?.();
    router.push(getNotificationHref(notification));
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[26rem] rounded-[10px] border border-neutral-200 bg-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <span className="text-sm font-semibold text-neutral-800">
          {t("Notifications")}
        </span>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {t("Mark all as read")}
          </button>
        )}
      </div>

      <div className="border-b border-neutral-200 px-4 py-3">
        {error ? (
          <p className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {t(error)}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const selected = activeFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
                className={[
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
                  selected
                    ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-800",
                ].join(" ")}
              >
                <span>{option.label}</span>
                <span className="text-[11px] opacity-80">{option.count}</span>
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
          <span className="font-medium">{t("Unread only")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={unreadOnly}
            onClick={() => setUnreadOnly((current) => !current)}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition",
              unreadOnly ? "bg-[#2563eb]" : "bg-neutral-300",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-5 w-5 rounded-full bg-white shadow transition",
                unreadOnly ? "translate-x-5" : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </label>
      </div>

      <div className="max-h-[30rem] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            {t("Loading...")}
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            {t("No notifications yet")}
          </p>
        ) : groupedNotifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            {unreadOnly
              ? t("No unread notifications in this view")
              : t("No notifications match this filter")}
          </p>
        ) : (
          groupedNotifications.map((group) => (
            <section
              key={group.type}
              className="border-b border-neutral-100 last:border-b-0"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  {group.label}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {group.items.length}
                </span>
              </div>

              {group.items.map((notification) => (
                <article
                  key={notification.id}
                  className={[
                    "border-b border-neutral-100 px-4 py-3 last:border-b-0",
                    notification.isRead ? "bg-white" : "bg-blue-50",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                        notification.isRead ? "bg-transparent" : "bg-blue-500",
                      ].join(" ")}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate pr-2 text-sm font-medium text-neutral-800">
                          {notification.title}
                        </p>
                        <p className="whitespace-nowrap text-[10px] text-neutral-400">
                          {formatRelativeTime(t, notification.createdAt)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-neutral-600">
                        {notification.body}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            notification.isRead
                              ? "bg-neutral-100 text-neutral-500"
                              : "bg-[#dbeafe] text-[#1d4ed8]",
                          ].join(" ")}
                        >
                          {notification.isRead ? t("Read") : t("Unread")}
                        </span>
                        <span className="text-[10px] font-medium text-blue-700">
                          {getNotificationActionLabel(notification)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() => void onMarkAsRead(notification.id)}
                        className="inline-flex items-center rounded-[8px] border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:border-neutral-300 hover:text-neutral-800"
                      >
                        {t("Mark as read")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleOpen(notification)}
                      className="inline-flex items-center rounded-[8px] bg-[#2563eb] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
                    >
                      {t(getNotificationActionLabel(notification))}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

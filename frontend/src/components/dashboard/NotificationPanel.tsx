"use client";

import type { NotificationResponse } from "@/types/api-notifications";

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Props = {
  notifications: NotificationResponse[];
  loading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
};

export function NotificationPanel({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}: Props) {
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[10px] border border-neutral-200 bg-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <span className="text-sm font-semibold text-neutral-800">
          Notifications
        </span>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            No notifications yet
          </p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.isRead) onMarkAsRead(n.id);
              }}
              className={[
                "flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left last:border-b-0",
                n.isRead
                  ? "bg-white hover:bg-neutral-50"
                  : "bg-blue-50 hover:bg-blue-100",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                  n.isRead ? "bg-transparent" : "bg-blue-500",
                ].join(" ")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {n.title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-neutral-600">
                  {n.body}
                </p>
                <p className="mt-1 text-[10px] text-neutral-400">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, EmailIcon, LockIcon } from "@/components/auth/icons";
import { APP_ROUTES } from "@/constants/routes";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";

type SettingsAccountAccessCardProps = {
  t: TranslateFn;
  user: AuthenticatedUser;
};

type ActivityItem = {
  type: string;
  title: string;
  description: string;
  occurredAt: string;
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRoleLabel(roles?: string[]): { label: string; badge: string } {
  if (roles?.includes("platform-admin") || roles?.includes("operator-admin")) {
    return { label: "Platform Administrator", badge: "Full Access" };
  }
  return { label: "Company Administrator", badge: "Full Access" };
}

function AccountPanel({
  t,
  user,
}: {
  t: TranslateFn;
  user: AuthenticatedUser;
}) {
  const { label: roleLabel, badge } = getRoleLabel(user.roles);
  const displayEmail = user.email ?? user.preferredUsername ?? "";

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Account & access")}
      </h2>

      <div className="mt-3 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold leading-[19.5px] tracking-[-0.1172px] text-[#1c398e]">
              {t("Current role")}
            </p>
            <p className="mt-0.5 text-xs leading-[19.5px] tracking-[-0.1172px] text-[#193cb8]">
              {t(roleLabel)}
            </p>
          </div>
          <span className="inline-flex h-5 items-center rounded-[10px] bg-blue-600 px-2 text-[10px] font-semibold text-white">
            {t(badge)}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-[16px] text-[#193cb8]">
          {t(
            "As a company administrator, you have full access to declare availability, request capacity, review matches, and manage settings.",
          )}
        </p>
      </div>

      <div className="mt-3 rounded-[10px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
        <div className="flex items-start gap-2">
          <EmailIcon className="mt-0.5 h-4 w-4 text-neutral-500" />
          <div>
            <p className="text-sm font-medium leading-5 tracking-[-0.1504px] text-neutral-900">
              {displayEmail}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[10px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <LockIcon className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
                {t("Password")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-8 items-center rounded-[8px] border border-neutral-300 bg-white px-3 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            {t("Change password")}
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-neutral-200 pt-3">
        <form method="POST" action={APP_ROUTES.authLogoutApi}>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-[#fca5a5] bg-[#fff5f5] text-sm font-semibold tracking-[-0.1504px] text-[#dc2626] transition hover:bg-[#fee2e2]"
          >
            {t("Sign out")}
          </button>
        </form>
      </div>
    </article>
  );
}

function RecentActivityPanel({ t }: { t: TranslateFn }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/company/activity?limit=10")
      .then((r) => r.json())
      .then((data: ActivityItem[]) => setItems(data))
      .catch(() => {});
  }, []);

  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h3 className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
        {t("Recent activity")}
      </h3>

      {displayed.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-500">
          {t("No recent activity.")}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {displayed.map((item, idx) => (
            <div
              key={idx}
              className="rounded-[10px] border border-neutral-200 bg-[#fafafa] px-3 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="mt-0.5 h-2 w-2 shrink-0 bg-blue-600" />
                    <p className="text-xs font-medium leading-[16px] text-neutral-900">
                      {t(item.title)}
                    </p>
                  </div>
                  <p className="mt-0.5 pl-4 text-[11px] leading-[16px] text-neutral-500">
                    {item.description}
                  </p>
                </div>
                <p className="shrink-0 text-[10px] leading-[14px] text-neutral-500">
                  {formatRelativeTime(item.occurredAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 5 && (
        <div className="mt-3 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-semibold tracking-[-0.1504px] text-blue-700 transition hover:text-blue-800"
          >
            {showAll ? t("Show less") : t("View full activity log")}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </article>
  );
}

export function SettingsAccountAccessCard({
  t,
  user,
}: SettingsAccountAccessCardProps) {
  return (
    <div className="space-y-4">
      <AccountPanel t={t} user={user} />
      <RecentActivityPanel t={t} />
    </div>
  );
}

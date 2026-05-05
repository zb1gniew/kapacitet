"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightIcon, EmailIcon, LockIcon } from "@/components/auth/icons";
import { APP_ROUTES } from "@/constants/routes";
import {
  isCompanyManager,
  isCompanyViewer,
  isPlatformAdmin,
} from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/types/auth";
import type { TranslateFn } from "@/types/i18n";

type SettingsAccountAccessCardProps = {
  t: TranslateFn;
  user: AuthenticatedUser;
};

type ActivityItem = {
  type: string;
  occurredAt: string;
  params: Record<string, string>;
};

function formatActivityDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

function getActivityLabels(
  t: TranslateFn,
  type: string,
  params: Record<string, string>,
  locale: string,
): { title: string; description: string } {
  const resourceType = t("worker(s)");

  const start = params.start ? formatActivityDate(params.start, locale) : "";
  const end = params.end ? formatActivityDate(params.end, locale) : "";

  return {
    title: t(`activity_title_${type}`),
    description: t(`activity_desc_${type}`, {
      ...params,
      resourceType,
      start,
      end,
    }),
  };
}

function formatRelativeTime(t: TranslateFn, dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 60) {
    return diffMin === 1
      ? t("{{count}} min ago", { count: diffMin })
      : t("{{count}} mins ago", { count: diffMin });
  }
  if (diffHours < 24)
    return diffHours === 1
      ? t("{{count}} hour ago", { count: diffHours })
      : t("{{count}} hours ago", { count: diffHours });
  if (diffDays === 1) return t("Yesterday");
  if (diffDays < 7) return t("{{count}} days ago", { count: diffDays });
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRoleLabel(
  t: TranslateFn,
  user: AuthenticatedUser,
): { label: string; badge: string } {
  if (isPlatformAdmin(user)) {
    return { label: t("Platform Administrator"), badge: t("Full Access") };
  }
  if (user.appRole === "Admin") {
    return { label: t("Company Administrator"), badge: t("Full Access") };
  }
  if (isCompanyManager(user)) {
    return { label: t("Company Manager"), badge: t("Manage Access") };
  }
  if (isCompanyViewer(user)) {
    return { label: t("Company Viewer"), badge: t("Read Only") };
  }
  return { label: t("Company User"), badge: t("Access limited") };
}

function AccountPanel({
  t,
  user,
}: {
  t: TranslateFn;
  user: AuthenticatedUser;
}) {
  const { label: roleLabel, badge } = getRoleLabel(t, user);
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
              {roleLabel}
            </p>
          </div>
          <span className="inline-flex h-5 items-center rounded-[10px] bg-blue-600 px-2 text-[10px] font-semibold text-white">
            {badge}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-[16px] text-[#193cb8]">
          {t(
            isPlatformAdmin(user)
              ? "As a platform administrator, you have full access to review onboarding, manage platform operations, and inspect audit activity."
              : user.appRole === "Admin"
                ? "As a company administrator, you have full access to declare availability, request capacity, review matches, and manage settings."
                : isCompanyViewer(user)
                  ? "As a company viewer, you can review matches, network requests, and settings, but only managers can publish or change company data."
                  : isCompanyManager(user)
                    ? "As a company manager, you can declare availability, request capacity, review matches, and manage company settings."
                    : "Your account access is pending setup. Contact your company administrator if you believe this is incorrect.",
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <LockIcon className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div>
              <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
                {t("Password")}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-neutral-500">
                {t(
                  "Password changes are managed by the hosted sign-in provider during login.",
                )}
              </p>
            </div>
          </div>
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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const loadActivity = useCallback(() => {
    setLoadError("");

    void fetch("/api/company/activity?limit=10", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          const fallback = "Unable to load recent activity right now.";
          const payload = (await response.json().catch(() => null)) as {
            message?: string;
            detail?: string;
            title?: string;
          } | null;
          throw new Error(
            payload?.message ?? payload?.detail ?? payload?.title ?? fallback,
          );
        }

        return (await response.json()) as ActivityItem[];
      })
      .then((data) => {
        setItems(data);
      })
      .catch((error: unknown) => {
        setItems([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load recent activity right now.",
        );
      });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadActivity();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadActivity]);

  const displayed = showAll ? items : items.slice(0, 5);

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h3 className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
        {t("Recent activity")}
      </h3>

      {loadError ? (
        <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
          <p>{t(loadError)}</p>
          <button
            type="button"
            onClick={loadActivity}
            className="mt-3 inline-flex h-8 items-center rounded-[8px] border border-red-200 bg-white px-3 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
          >
            {t("Try again")}
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-500">
          {t("No recent activity.")}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {displayed.map((item, idx) => {
            const { title, description } = getActivityLabels(
              t,
              item.type,
              item.params ?? {},
              locale,
            );
            return (
              <div
                key={idx}
                className="rounded-[10px] border border-neutral-200 bg-[#fafafa] px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mt-0.5 h-2 w-2 shrink-0 bg-blue-600" />
                      <p className="text-xs font-medium leading-[16px] text-neutral-900">
                        {title}
                      </p>
                    </div>
                    <p className="mt-0.5 pl-4 text-[11px] leading-[16px] text-neutral-500">
                      {description}
                    </p>
                  </div>
                  <p className="shrink-0 text-[10px] leading-[14px] text-neutral-500">
                    {formatRelativeTime(t, item.occurredAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 5 && (
        <div className="mt-3 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-semibold tracking-[-0.1504px] text-blue-700 transition hover:text-blue-800"
          >
            {showAll ? t("Show less") : t("Show all recent activity")}
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

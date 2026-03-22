import Link from "next/link";
import { ArrowRightIcon, EmailIcon, LockIcon } from "@/components/auth/icons";
import { APP_ROUTES } from "@/constants/routes";
import type { TranslateFn } from "@/types/i18n";

type SettingsAccountAccessCardProps = {
  t: TranslateFn;
};

type ActivityItem = {
  id: number;
  titleKey: string;
  descriptionKey: string;
  timeKey: string;
};

const RECENT_ACTIVITY_ITEMS: ReadonlyArray<ActivityItem> = [
  {
    id: 1,
    titleKey: "Accepted capacity match",
    descriptionKey: "3 welders from network company",
    timeKey: "2 hours ago",
  },
  {
    id: 2,
    titleKey: "Created capacity request",
    descriptionKey: "Mobile crane equipment",
    timeKey: "6 hours ago",
  },
  {
    id: 3,
    titleKey: "Updated participation preferences",
    descriptionKey: "Enabled network-wide requests",
    timeKey: "Yesterday at 16:45",
  },
  {
    id: 4,
    titleKey: "Declared availability",
    descriptionKey: "2 Electricians, Feb 20 - Mar 15",
    timeKey: "2 days ago",
  },
  {
    id: 5,
    titleKey: "Reviewed match offer",
    descriptionKey: "Declined partial match for CNC operators",
    timeKey: "3 days ago",
  },
];

function AccountPanel({ t }: { t: TranslateFn }) {
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
              {t("Company Administrator")}
            </p>
          </div>
          <span className="inline-flex h-5 items-center rounded-[10px] bg-blue-600 px-2 text-[10px] font-semibold text-white">
            {t("Full Access")}
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
              {t("admin@nordicindustries.se")}
            </p>
            <p className="text-[11px] leading-[16px] text-neutral-500">
              {t("Last login: Feb 10, 2026 at 09:24")}
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
              <p className="text-[11px] leading-[16px] text-neutral-500">
                {t("Last changed 47 days ago")}
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
        <Link
          href={APP_ROUTES.authLogoutApi}
          className="inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-[#fca5a5] bg-[#fff5f5] text-sm font-semibold tracking-[-0.1504px] text-[#dc2626] transition hover:bg-[#fee2e2]"
        >
          {t("Sign out")}
        </Link>
      </div>
    </article>
  );
}

function RecentActivityPanel({ t }: { t: TranslateFn }) {
  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h3 className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
        {t("Recent activity")}
      </h3>

      <div className="mt-3 space-y-2">
        {RECENT_ACTIVITY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-[10px] border border-neutral-200 bg-[#fafafa] px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 bg-blue-600" />
                  <p className="text-xs font-medium leading-[16px] text-neutral-900">
                    {t(item.titleKey)}
                  </p>
                </div>
                <p className="mt-0.5 pl-4 text-[11px] leading-[16px] text-neutral-500">
                  {t(item.descriptionKey)}
                </p>
              </div>
              <p className="shrink-0 text-[10px] leading-[14px] text-neutral-500">
                {t(item.timeKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-neutral-200 pt-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-semibold tracking-[-0.1504px] text-blue-700 transition hover:text-blue-800"
        >
          {t("View full activity log")}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export function SettingsAccountAccessCard({
  t,
}: SettingsAccountAccessCardProps) {
  return (
    <div className="space-y-4">
      <AccountPanel t={t} />
      <RecentActivityPanel t={t} />
    </div>
  );
}

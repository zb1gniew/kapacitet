import { DASHBOARD_ACTION_BANNER } from "@/constants/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { ArrowRightIcon } from "@/components/auth/icons";
import { WarningIcon } from "../icons";

type ActionRequiredBannerProps = {
  t: TranslateFn;
};

export function ActionRequiredBanner({ t }: ActionRequiredBannerProps) {
  return (
    <section className="rounded-[10px] border border-[#ffb900] bg-[#fffbeb] px-4 py-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
          <WarningIcon className="h-4 w-4" />
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              {t(DASHBOARD_ACTION_BANNER.badgeKey)}
            </span>
            <span className="text-xs text-amber-900">
              {t(DASHBOARD_ACTION_BANNER.timingKey)}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.3125px] text-neutral-900">
            {t(DASHBOARD_ACTION_BANNER.titleKey)}
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            {t(DASHBOARD_ACTION_BANNER.descriptionKey)}
          </p>
          <button
            type="button"
            className="mt-3 inline-flex h-10 items-center gap-1 rounded-[8px] bg-neutral-950 px-4 text-sm font-medium text-white"
          >
            <span>{t(DASHBOARD_ACTION_BANNER.ctaKey)}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

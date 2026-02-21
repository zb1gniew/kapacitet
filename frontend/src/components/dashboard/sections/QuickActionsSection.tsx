import Link from "next/link";
import { DASHBOARD_QUICK_ACTIONS } from "@/constants/dashboard";
import type { DashboardQuickAction } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { SearchIcon, UploadIcon } from "../icons";

type QuickActionsSectionProps = {
  t: TranslateFn;
};

function getActionIcon(action: DashboardQuickAction) {
  switch (action.icon) {
    case "search":
      return SearchIcon;
    case "upload":
      return UploadIcon;
    default:
      return UploadIcon;
  }
}

export function QuickActionsSection({ t }: QuickActionsSectionProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {DASHBOARD_QUICK_ACTIONS.map((action) => {
        const Icon = getActionIcon(action);

        return (
          <article
            key={action.titleKey}
            className="rounded-[10px] border border-neutral-200 bg-white p-4 shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
          >
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-neutral-200 bg-neutral-100 text-neutral-600">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-semibold tracking-[-0.3125px] text-neutral-900">
              {t(action.titleKey)}
            </h3>
            <p className="mt-2 min-h-[56px] text-xs leading-[19.5px] text-neutral-500">
              {t(action.descriptionKey)}
            </p>
            <Link
              href={action.href}
              className="mt-4 inline-flex h-[42px] w-full items-center justify-center rounded-[8px] bg-blue-600 px-4 text-xs font-medium text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-blue-700"
            >
              {t(action.ctaKey)}
            </Link>
          </article>
        );
      })}
    </section>
  );
}

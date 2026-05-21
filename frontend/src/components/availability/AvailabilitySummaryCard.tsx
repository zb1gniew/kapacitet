import type { AvailabilitySummarySection } from "@/types/availability";
import type { TranslateFn } from "@/types/i18n";
import {
  DetailsSummaryIcon,
  PeriodSummaryIcon,
  ResourceSummaryIcon,
} from "./icons";

type AvailabilitySummaryCardProps = {
  section: AvailabilitySummarySection;
  t: TranslateFn;
};

function SummaryIcon({ section }: { section: AvailabilitySummarySection }) {
  switch (section.icon) {
    case "details":
      return <DetailsSummaryIcon className="h-[18px] w-[18px] text-blue-600" />;
    case "period":
      return <PeriodSummaryIcon className="h-[18px] w-[18px] text-blue-600" />;
    default:
      return (
        <ResourceSummaryIcon className="h-[18px] w-[18px] text-blue-600" />
      );
  }
}

export function AvailabilitySummaryCard({
  section,
  t,
}: AvailabilitySummaryCardProps) {
  return (
    <article className="rounded-[10px] border border-neutral-200 bg-neutral-50 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2 text-neutral-900">
        <SummaryIcon section={section} />
        <h3 className="text-base font-semibold leading-6 tracking-[-0.3125px]">
          {t(section.titleKey)}
        </h3>
      </div>

      <div className="mt-3 space-y-2 pl-6">
        {section.rows.map((row) => (
          <div
            key={row.labelKey}
            className="flex gap-2 text-sm leading-5 tracking-[-0.1504px]"
          >
            {row.labelKey ? (
              <p className="min-w-[128px] font-medium text-neutral-600">
                {t(row.labelKey)}
              </p>
            ) : null}
            <p className="font-medium text-neutral-900">
              {row.valueText ??
                (row.valueKeys
                  ? row.valueKeys.map((valueKey) => t(valueKey)).join(", ")
                  : t(row.valueKey ?? ""))}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

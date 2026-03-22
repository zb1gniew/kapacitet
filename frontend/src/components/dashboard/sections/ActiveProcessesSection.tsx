import { ArrowRightIcon } from "@/components/auth/icons";
import { DASHBOARD_PROCESSES } from "@/constants/dashboard";
import type { DashboardProcess, DashboardTone } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";

type ActiveProcessesSectionProps = {
  t: TranslateFn;
};

function getProcessToneClasses(statusTone: DashboardTone) {
  switch (statusTone) {
    case "success":
      return {
        status: "border-green-200 bg-green-50 text-green-700",
        border: "border-l-green-500",
      };
    case "primary":
      return {
        status: "border-blue-200 bg-blue-50 text-blue-700",
        border: "border-l-blue-500",
      };
    case "danger":
      return {
        status: "border-red-200 bg-red-50 text-red-700",
        border: "border-l-red-500",
      };
    case "neutral":
    default:
      return {
        status: "border-neutral-200 bg-neutral-50 text-neutral-700",
        border: "border-l-neutral-400",
      };
  }
}

type ProcessItemProps = {
  process: DashboardProcess;
  t: TranslateFn;
};

function ProcessItem({ process, t }: ProcessItemProps) {
  const toneClasses = getProcessToneClasses(process.statusTone);

  return (
    <article
      className={`rounded-[10px] border border-neutral-300 border-l-4 bg-white px-4 py-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] ${toneClasses.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-900">
            {t(process.titleKey)}
          </h4>
          <p className="mt-1 text-[11px] text-neutral-500">
            {t(process.subtitleKey)}
          </p>
        </div>
        <span
          className={`rounded-[8px] border px-2 py-0.5 text-[10px] font-semibold ${toneClasses.status}`}
        >
          {t(process.statusKey)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2">
        <p className="text-[10px] text-neutral-500">{t(process.metaKey)}</p>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"
        >
          <span>{t(process.ctaKey)}</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

export function ActiveProcessesSection({ t }: ActiveProcessesSectionProps) {
  return (
    <article className="rounded-[10px] border border-neutral-200 bg-white p-4 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">
          {t("Active processes")}
        </h3>
        <span className="text-xs text-neutral-500">{t("5 ongoing")}</span>
      </div>
      <div className="space-y-3">
        {DASHBOARD_PROCESSES.map((process) => (
          <ProcessItem key={process.titleKey} process={process} t={t} />
        ))}
      </div>
    </article>
  );
}

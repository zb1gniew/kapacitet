import { ArrowRightIcon } from "@/components/auth/icons";
import type { DashboardProcess, DashboardTone } from "@/types/dashboard";
import type { TranslateFn } from "@/types/i18n";
import { SectionIntro } from "./SectionIntro";

type ActiveProcessesSectionProps = {
  t: TranslateFn;
  processes: DashboardProcess[];
  loading: boolean;
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
};

function ProcessItem({ process }: ProcessItemProps) {
  const toneClasses = getProcessToneClasses(process.statusTone);

  return (
    <article
      className={`rounded-[10px] border border-neutral-300 border-l-4 bg-white px-4 py-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] ${toneClasses.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-900">
            {process.title}
          </h4>
          <p className="mt-1 text-[11px] text-neutral-500">
            {process.subtitle}
          </p>
        </div>
        <span
          className={`rounded-[8px] border px-2 py-0.5 text-[10px] font-semibold ${toneClasses.status}`}
        >
          {process.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2">
        <p className="text-[10px] text-neutral-500">{process.meta}</p>
        <button
          type="button"
          data-process-kind={process.kind}
          data-item-id={process.id}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"
        >
          <span>{process.cta}</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function LoadingProcessCard() {
  return (
    <article className="rounded-[10px] border border-neutral-300 border-l-4 border-l-neutral-300 bg-white px-4 py-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-neutral-200" />
          <div className="h-3 w-56 rounded bg-neutral-100" />
        </div>
        <div className="h-5 w-28 rounded bg-neutral-100" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2">
        <div className="h-3 w-24 rounded bg-neutral-100" />
        <div className="h-3 w-20 rounded bg-neutral-100" />
      </div>
    </article>
  );
}

export function ActiveProcessesSection({
  t,
  processes,
  loading,
}: ActiveProcessesSectionProps) {
  return (
    <article className="rounded-[10px] border border-neutral-200 bg-white p-4 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
      <SectionIntro
        eyebrow={t("Delivery pipeline")}
        title={t("Active processes")}
        description={t(
          "Track live availability, active requests, and matching progress across your trusted company network.",
        )}
        aside={
          <span className="text-xs text-neutral-500">
            {loading ? "..." : `${processes.length} ongoing`}
          </span>
        }
      />
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <LoadingProcessCard key={index} />
            ))
          : null}
        {!loading && processes.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
            {t(
              "No active processes yet. Declare availability or request capacity to get started.",
            )}
          </div>
        ) : null}
        {!loading
          ? processes.map((process) => (
              <ProcessItem
                key={`${process.kind}-${process.id}`}
                process={process}
              />
            ))
          : null}
      </div>
    </article>
  );
}

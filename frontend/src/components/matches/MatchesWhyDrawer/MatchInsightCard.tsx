import type { ReactNode } from "react";

export function MatchInsightCard({
  title,
  summary,
  fitLabel,
  maxScore,
  pillClassName,
  barClassName,
  children,
}: {
  title: string;
  summary: string;
  fitLabel?: string;
  maxScore?: number;
  pillClassName: string;
  barClassName: string;
  children?: ReactNode;
}) {
  const width = maxScore ? "100%" : null;

  return (
    <section className="rounded-[16px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">{summary}</p>
        </div>
        {fitLabel ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${pillClassName}`}
          >
            {fitLabel}
          </span>
        ) : null}
      </div>
      {width ? (
        <div className="mt-3 h-2 rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${barClassName}`}
            style={{ width }}
          />
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

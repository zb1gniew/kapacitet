import type { DashboardMetric } from "@/types/dashboard";
import { UsersIcon } from "@/components/auth/icons";
import { SearchIcon, WarningIcon } from "../icons";

type MetricsSectionProps = {
  metrics: DashboardMetric[];
  loading: boolean;
};

function getMetricIcon(metric: DashboardMetric) {
  switch (metric.icon) {
    case "users":
      return UsersIcon;
    case "search":
      return SearchIcon;
    case "warning":
      return WarningIcon;
    default:
      return UsersIcon;
  }
}

function getMetricValueToneClass(metric: DashboardMetric) {
  switch (metric.tone) {
    case "success":
      return "text-green-700";
    case "primary":
      return "text-blue-700";
    case "danger":
      return "text-red-700";
    default:
      return "text-neutral-700";
  }
}

export function MetricsSection({ metrics, loading }: MetricsSectionProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = getMetricIcon(metric);

        return (
          <article
            key={metric.label}
            className={`rounded-[10px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] ${
              metric.highlighted ? "border-red-200" : ""
            }`}
          >
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-neutral-100 text-neutral-500">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-neutral-500">{metric.label}</p>
            <p
              className={`mt-1 text-sm font-semibold ${getMetricValueToneClass(metric)}`}
            >
              {loading ? "..." : metric.value}
            </p>
          </article>
        );
      })}
    </section>
  );
}

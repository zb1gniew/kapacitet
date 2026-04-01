import { CheckBadgeIcon } from "@/components/auth/icons";
import type { AccessRequestFilterTab } from "@/types/admin";
import { getAccessRequestMetricClasses } from "./utils";

type AccessRequestsMetricCardProps = {
  title: string;
  value: number;
  status: AccessRequestFilterTab;
};

export function AccessRequestsMetricCard({
  title,
  value,
  status,
}: AccessRequestsMetricCardProps) {
  const classes = getAccessRequestMetricClasses(status);

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-5 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-[-0.1504px] text-neutral-500">
            {title}
          </p>
          <p className={`mt-3 text-3xl font-bold ${classes.value}`}>{value}</p>
        </div>
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-[12px] ${classes.icon}`}
        >
          <CheckBadgeIcon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

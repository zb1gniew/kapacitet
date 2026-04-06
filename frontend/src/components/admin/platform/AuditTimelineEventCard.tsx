import type { AuditTimelineEvent } from "@/types/admin";
import { formatPlatformDateTime } from "./utils";

type AuditTimelineEventCardProps = {
  event: AuditTimelineEvent;
};

function getEventClasses(type: AuditTimelineEvent["type"]) {
  switch (type) {
    case "Approval":
      return "border-[#b9f8cf] bg-[#f0fdf4] text-[#166534]";
    case "Rejection":
      return "border-[#fecaca] bg-[#fff5f5] text-[#b91c1c]";
    case "Provisioning":
      return "border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]";
    default:
      return "border-neutral-200 bg-[#fafafa] text-neutral-700";
  }
}

export function AuditTimelineEventCard({ event }: AuditTimelineEventCardProps) {
  return (
    <article className="rounded-[16px] border border-neutral-200 bg-white p-5 shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold tracking-[-0.3125px] text-neutral-900">
              {event.summary}
            </h3>
            <span
              className={`inline-flex rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold ${getEventClasses(
                event.type,
              )}`}
            >
              {event.type}
            </span>
          </div>

          <p className="mt-3 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-700">
            {event.detail}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Company
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {event.companyName}
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Contact
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {event.contactEmail}
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Actor
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {event.actor ?? "system"}
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Timestamp
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {formatPlatformDateTime(event.timestamp)}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:max-w-[190px]">
          <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">Reference</p>
            <p className="mt-1 leading-[22.75px] tracking-[-0.1504px]">
              Request ID {event.requestId}
              {event.provisionedCompanyId
                ? ` · Company ID ${event.provisionedCompanyId}`
                : ""}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

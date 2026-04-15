import type { AuditTimelineEvent } from "@/types/admin";
import type { TranslateFn } from "@/types/i18n";
import { formatPlatformDateTime } from "./utils";

type AuditTimelineEventCardProps = {
  event: AuditTimelineEvent;
  t: TranslateFn;
  highlighted?: boolean;
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

export function AuditTimelineEventCard({
  event,
  t,
  highlighted = false,
}: AuditTimelineEventCardProps) {
  return (
    <article
      id={`audit-event-${event.id}`}
      className={`rounded-[16px] border bg-white p-5 shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.08)] transition ${
        highlighted
          ? "border-[#2563eb] ring-2 ring-[#93c5fd]"
          : "border-neutral-200"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
              {t(event.type)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-700">
            {event.detail}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Company")}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-neutral-900">
                {event.companyName}
              </p>
            </div>
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 sm:col-span-2 2xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Contact")}
              </p>
              <p className="mt-1 break-all text-[13px] font-medium leading-5 text-neutral-900">
                {event.contactEmail}
              </p>
            </div>
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 sm:col-span-2 2xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Actor")}
              </p>
              <p className="mt-1 break-all text-[13px] font-medium leading-5 text-neutral-900">
                {event.actor ?? t("system")}
              </p>
            </div>
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Timestamp")}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-neutral-900">
                {formatPlatformDateTime(event.timestamp)}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 xl:max-w-[190px]">
          <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">{t("Reference")}</p>
            <p className="mt-1 break-words leading-[22.75px] tracking-[-0.1504px]">
              {event.requestId
                ? t("Request ID {{id}}", { id: event.requestId })
                : t("No request reference")}
              {event.provisionedCompanyId
                ? t(" · Company ID {{id}}", {
                    id: event.provisionedCompanyId,
                  })
                : event.companyId
                  ? t(" · Company ID {{id}}", { id: event.companyId })
                  : ""}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

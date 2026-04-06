import Link from "next/link";
import { APP_ROUTES } from "@/constants/routes";
import type { CompanyRegistryRecord } from "@/types/admin";
import { formatPlatformDateTime } from "./utils";

type CompanyRegistryCardProps = {
  record: CompanyRegistryRecord;
};

function getStatusClasses(status: CompanyRegistryRecord["status"]) {
  return status === "Provisioned"
    ? "border-[#b9f8cf] bg-[#f0fdf4] text-[#166534]"
    : "border-[#fde68a] bg-[#fff8db] text-[#92400e]";
}

export function CompanyRegistryCard({ record }: CompanyRegistryCardProps) {
  return (
    <article className="rounded-[16px] border border-neutral-200 bg-white p-5 shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold tracking-[-0.3125px] text-neutral-900">
              {record.companyName}
            </h3>
            <span
              className={`inline-flex rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                record.status,
              )}`}
            >
              {record.status}
            </span>
            {record.provisionedCompanyId ? (
              <span className="inline-flex rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8]">
                Company ID {record.provisionedCompanyId}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Industry
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {record.industry}
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Location
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {record.location}
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Primary contact
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {record.contactEmail}
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Reviewed
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {formatPlatformDateTime(record.reviewedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">Operational note</p>
            <p className="mt-1 leading-[22.75px] tracking-[-0.1504px]">
              {record.status === "Provisioned"
                ? `Provisioned from an approved access request and reviewed by ${record.reviewedBy ?? "platform administrator"}.`
                : "The request was approved but still needs provisioning follow-up before the company is fully linked."}
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 lg:max-w-[220px]">
          <Link
            href={APP_ROUTES.adminAccessRequests}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-4 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
          >
            View access request
          </Link>
          <p className="mt-3 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
            Request ID {record.requestId} created on{" "}
            {formatPlatformDateTime(record.createdAt)}.
          </p>
        </div>
      </div>
    </article>
  );
}

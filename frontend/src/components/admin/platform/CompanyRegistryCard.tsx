import Link from "next/link";
import { APP_ROUTES } from "@/constants/routes";
import type { CompanyRegistryRecord } from "@/types/admin";
import type { TranslateFn } from "@/types/i18n";
import { CATEGORY_LABELS } from "@/constants/categories";
import { formatPlatformDateTime } from "./utils";

type CompanyRegistryCardProps = {
  record: CompanyRegistryRecord;
  t: TranslateFn;
  highlighted?: boolean;
};

function getStatusClasses(status: CompanyRegistryRecord["status"]) {
  return status === "Provisioned"
    ? "border-[#b9f8cf] bg-[#f0fdf4] text-[#166534]"
    : "border-[#fde68a] bg-[#fff8db] text-[#92400e]";
}

export function CompanyRegistryCard({
  record,
  t,
  highlighted = false,
}: CompanyRegistryCardProps) {
  const recordDomId =
    record.companyId ??
    record.provisionedCompanyId ??
    record.requestId ??
    record.companyName;

  return (
    <article
      id={`company-registry-${recordDomId}`}
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
              {record.companyName}
            </h3>
            <span
              className={`inline-flex rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                record.status,
              )}`}
            >
              {t(record.status)}
            </span>
            {record.provisionedCompanyId ? (
              <span className="inline-flex rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8]">
                {t("Company ID {{id}}", {
                  id: record.provisionedCompanyId,
                })}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Categories")}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-neutral-900">
                {record.categories.length > 0
                  ? record.categories
                      .map(
                        (k) =>
                          t(
                            CATEGORY_LABELS[
                              k as keyof typeof CATEGORY_LABELS
                            ] ?? k,
                          ),
                      )
                      .join(", ")
                  : "—"}
              </p>
            </div>
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Location")}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-neutral-900">
                {record.location}
              </p>
            </div>
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 sm:col-span-2 2xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Primary contact")}
              </p>
              <p className="mt-1 break-all text-[13px] font-medium leading-5 text-neutral-900">
                {record.contactEmail}
              </p>
            </div>
            <div className="min-w-0 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Reviewed")}
              </p>
              <p className="mt-1 break-words text-sm font-medium text-neutral-900">
                {formatPlatformDateTime(record.reviewedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">
              {t("Operational note")}
            </p>
            <p className="mt-1 break-words leading-[22.75px] tracking-[-0.1504px]">
              {record.status === "Provisioned"
                ? t(
                    "Provisioned from an approved access request and reviewed by {{actor}}.",
                    {
                      actor: record.reviewedBy ?? t("platform administrator"),
                    },
                  )
                : t(
                    "The request was approved but still needs provisioning follow-up before the company is fully linked.",
                  )}
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 xl:max-w-[220px]">
          {record.requestId ? (
            <Link
              href={APP_ROUTES.adminAccessRequests}
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-4 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
            >
              {t("View access request")}
            </Link>
          ) : (
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">
                {t("Registry source")}
              </p>
              <p className="mt-1 break-words leading-[22.75px] tracking-[-0.1504px]">
                {t(
                  "This company record exists directly in the platform registry.",
                )}
              </p>
            </div>
          )}
          <p className="mt-3 break-words text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
            {record.requestId
              ? t("Request ID {{id}} created on {{date}}.", {
                  id: record.requestId,
                  date: formatPlatformDateTime(record.createdAt),
                })
              : t("Company record created on {{date}}.", {
                  date: formatPlatformDateTime(record.createdAt),
                })}
          </p>
        </div>
      </div>
    </article>
  );
}

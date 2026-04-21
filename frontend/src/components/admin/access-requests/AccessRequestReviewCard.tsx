import { CheckBadgeIcon, EmailIcon, MapPinIcon } from "@/components/auth/icons";
import type { AccessRequest } from "@/types/admin";
import type { TranslateFn } from "@/types/i18n";
import { CATEGORY_LABELS } from "@/constants/categories";
import { AccessRequestStatusBadge } from "./AccessRequestStatusBadge";
import { formatAccessRequestDate, formatAccessRequestDateTime } from "./utils";

type AccessRequestReviewCardProps = {
  request: AccessRequest;
  t: TranslateFn;
  highlighted?: boolean;
  onApprove: () => void;
  onReject: () => void;
};

type InfoPillProps = {
  label: string;
  value: string;
  icon?: "location" | "email";
};

function InfoPill({ label, value, icon }: InfoPillProps) {
  return (
    <div className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-neutral-900">
        {icon === "location" ? (
          <MapPinIcon className="h-4 w-4 text-neutral-400" />
        ) : null}
        {icon === "email" ? (
          <EmailIcon className="h-4 w-4 text-neutral-400" />
        ) : null}
        <span className="min-w-0 truncate">{value}</span>
      </p>
    </div>
  );
}

export function AccessRequestReviewCard({
  request,
  t,
  highlighted = false,
  onApprove,
  onReject,
}: AccessRequestReviewCardProps) {
  const reviewedAtLabel = formatAccessRequestDateTime(request.reviewedAt);

  return (
    <article
      id={`access-request-${request.id}`}
      className={`rounded-[14px] border bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition ${
        highlighted
          ? "border-[#2563eb] ring-2 ring-[#93c5fd]"
          : "border-neutral-200"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#dbeafe] text-[#1d4ed8]">
              <CheckBadgeIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
                  {request.name}
                </h2>
                <AccessRequestStatusBadge status={request.status} t={t} />
              </div>

              <p className="mt-1 text-sm leading-6 tracking-[-0.1504px] text-neutral-600">
                {t("Submitted on {{date}}", {
                  date: formatAccessRequestDate(request.createdAt),
                })}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoPill
              label={t("Categories")}
              value={
                request.categories.length > 0
                  ? request.categories
                      .map(
                        (k) =>
                          t(
                            CATEGORY_LABELS[
                              k as keyof typeof CATEGORY_LABELS
                            ] ?? k,
                          ),
                      )
                      .join(", ")
                  : "—"
              }
            />
            <InfoPill
              label={t("Location")}
              value={request.location}
              icon="location"
            />
            <InfoPill
              label={t("Contact email")}
              value={request.contactEmail}
              icon="email"
            />
          </div>

          {request.message ? (
            <div className="mt-5 rounded-[12px] border border-neutral-200 bg-[#fafafa] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Message")}
              </p>
              <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-700">
                {request.message}
              </p>
            </div>
          ) : null}

          {request.status === "Approved" ? (
            <div className="mt-5 rounded-[12px] border border-[#b9f8cf] bg-[#f0fdf4] p-4 text-[#166534]">
              <p className="text-sm font-semibold">
                {t("Company access provisioned successfully")}
              </p>
              <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px]">
                {t("Reviewed by {{actor}}", {
                  actor: request.reviewedBy ?? t("platform administrator"),
                })}
                {reviewedAtLabel
                  ? t(" on {{date}}", { date: reviewedAtLabel })
                  : ""}
                .
                {request.provisionedCompanyId
                  ? ` ${t("Company ID: {{id}}.", {
                      id: request.provisionedCompanyId,
                    })}`
                  : ""}
              </p>
            </div>
          ) : null}

          {request.status === "Rejected" ? (
            <div className="mt-5 rounded-[12px] border border-[#fecaca] bg-[#fff5f5] p-4 text-[#b91c1c]">
              <p className="text-sm font-semibold">{t("Request rejected")}</p>
              <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px]">
                {t("Reviewed by {{actor}}", {
                  actor: request.reviewedBy ?? t("platform administrator"),
                })}
                {reviewedAtLabel
                  ? t(" on {{date}}", { date: reviewedAtLabel })
                  : ""}
                .
              </p>
              {request.rejectionReason ? (
                <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px]">
                  {t("Reason: {{reason}}", {
                    reason: request.rejectionReason,
                  })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 lg:max-w-[220px] lg:self-center">
          {request.status === "Pending" ? (
            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={onApprove}
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#00a63e] px-4 text-sm font-semibold text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition hover:bg-[#008b35]"
              >
                {t("Approve request")}
              </button>
              <button
                type="button"
                onClick={onReject}
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#fca5a5] bg-white px-4 text-sm font-semibold text-[#dc2626] transition hover:bg-[#fff5f5]"
              >
                {t("Reject request")}
              </button>
            </div>
          ) : (
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] p-4">
              <p className="text-sm font-semibold text-neutral-900">
                {t("Review completed")}
              </p>
              <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
                {t("This request has already been processed.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

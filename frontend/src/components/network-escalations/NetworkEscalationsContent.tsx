"use client";

import { useState } from "react";
import type {
  NetworkEscalationResponse,
  NetworkResponseType,
} from "@/types/api-network-escalations";
import { PermissionNotice } from "@/components/ui/PermissionNotice";
import type { TranslateFn } from "@/types/i18n";

type NetworkEscalationsContentProps = {
  escalations: NetworkEscalationResponse[];
  highlightedRequestId?: number | null;
  loading: boolean;
  error: string | null;
  toastError: string;
  actionInProgress: number | null;
  canManageCompany: boolean;
  onRetry: () => void | Promise<void>;
  onRespond: (
    escalationId: number,
    responseType: NetworkResponseType,
  ) => void | Promise<void>;
  t: TranslateFn;
};

type CategoryFilter = "same" | "all";

function formatDateRange(t: TranslateFn, startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return t("{{start}} - {{end}}", {
    start: formatter.format(new Date(startDate)),
    end: formatter.format(new Date(endDate)),
  });
}

function formatTriggeredAt(triggeredAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(triggeredAt));
}

function urgencyConfig(urgency: NetworkEscalationResponse["urgency"]) {
  if (urgency === "Critical") {
    return { badge: "border-[#fecaca] bg-[#fff1f2] text-[#be123c]" };
  }
  if (urgency === "High") {
    return { badge: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]" };
  }
  if (urgency === "Medium") {
    return { badge: "border-[#fef08a] bg-[#fefce8] text-[#854d0e]" };
  }
  return { badge: "border-neutral-200 bg-neutral-50 text-neutral-600" };
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HandRaisedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.75 3a.75.75 0 0 1 .75.75V7h5V3.75a.75.75 0 0 1 1.5 0v3.25h.25A2.75 2.75 0 0 1 17 9.75v4.5A4.75 4.75 0 0 1 12.25 19h-4.5A4.75 4.75 0 0 1 3 14.25v-4.5A2.75 2.75 0 0 1 5.75 7H6V3.75A.75.75 0 0 1 6.75 3Z" />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function NetworkEscalationsContent({
  escalations,
  highlightedRequestId,
  loading,
  error,
  toastError,
  actionInProgress,
  canManageCompany,
  onRetry,
  onRespond,
  t,
}: NetworkEscalationsContentProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filtered =
    categoryFilter === "same"
      ? escalations.filter((e) => e.sharesCategory)
      : escalations;

  const showEmptyState = !loading && !error && filtered.length === 0;
  const sameCategoryCount = escalations.filter((e) => e.sharesCategory).length;

  return (
    <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
            {t("Network requests")}
          </h1>
          <p className="mt-1 max-w-[600px] text-sm leading-6 text-neutral-500">
            {t(
              "Review urgent network-wide requests that need a quick response from your company.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category filter */}
          <div className="flex items-center rounded-[10px] border border-neutral-200 bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === "all"
                  ? "bg-neutral-900 text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {t("All")}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  categoryFilter === "all"
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {loading ? "–" : escalations.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("same")}
              className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === "same"
                  ? "bg-neutral-900 text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <TagIcon className="h-3 w-3" />
              {t("Same category")}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  categoryFilter === "same"
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {loading ? "–" : sameCategoryCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Toast error ── */}
      {toastError ? (
        <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {toastError}
        </div>
      ) : null}

      {/* ── Load error ── */}
      {error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-[10px] border border-[#fca5a5] bg-white px-3 py-2 text-xs font-semibold text-[#b91c1c] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
          >
            {t("Try again")}
          </button>
        </div>
      ) : null}

      {/* ── Loading skeleton ── */}
      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-[14px] border border-neutral-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-neutral-200" />
                    <div className="h-6 w-32 rounded-full bg-neutral-100" />
                  </div>
                  <div className="h-7 w-48 rounded-lg bg-neutral-200" />
                  <div className="h-5 w-64 rounded-lg bg-neutral-100" />
                </div>
                <div className="h-16 w-36 rounded-[10px] bg-neutral-100" />
              </div>
              <div className="mt-5 flex gap-3">
                <div className="h-10 w-28 rounded-[10px] bg-neutral-200" />
                <div className="h-10 w-36 rounded-[10px] bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Empty state ── */}
      {showEmptyState ? (
        <section className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <HandRaisedIcon className="h-6 w-6 text-neutral-400" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-neutral-900">
            {categoryFilter === "same"
              ? t("No matching category requests right now")
              : t("No network requests right now")}
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-neutral-500">
            {categoryFilter === "same"
              ? t(
                  'There are no open requests from companies that share your trade categories. Switch to "All" to see all network requests.',
                )
              : t(
                  "Urgent escalations from the broader network will appear here when your company is eligible to respond.",
                )}
          </p>
          {categoryFilter === "same" && escalations.length > 0 ? (
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className="mt-4 inline-flex h-9 items-center rounded-[8px] border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-neutral-50"
            >
              {t("Show all {{count}} requests", { count: escalations.length })}
            </button>
          ) : null}
        </section>
      ) : null}

      {/* ── Escalation cards ── */}
      {!loading ? (
        <div className="mt-6 space-y-4">
          {filtered.map((escalation) => {
            const { badge } = urgencyConfig(escalation.urgency);
            const hasResponded = escalation.hasResponded;
            const submitting = actionInProgress === escalation.id;
            const isHighlighted = highlightedRequestId === escalation.requestId;

            return (
              <article
                key={escalation.id}
                id={`network-request-${escalation.requestId}`}
                className={`overflow-hidden rounded-[14px] border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
                  isHighlighted
                    ? "border-[#2563eb] ring-2 ring-[#93c5fd]"
                    : "border-neutral-200"
                }`}
              >
                <div className="p-6">
                  {/* ── Card header ── */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge}`}
                        >
                          {t("{{urgency}} priority", {
                            urgency: t(escalation.urgency),
                          })}
                        </span>
                        {escalation.sharesCategory ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-xs font-semibold text-[#15803d]">
                            <TagIcon className="h-3 w-3" />
                            {t("Your category")}
                          </span>
                        ) : null}
                        <span className="text-xs text-neutral-400">
                          {t("Escalated {{date}}", {
                            date: formatTriggeredAt(escalation.triggeredAt),
                          })}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-900">
                        {escalation.quantity === 1
                          ? t("{{count}} worker needed", {
                              count: escalation.quantity,
                            })
                          : t("{{count}} workers needed", {
                              count: escalation.quantity,
                            })}
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        {t("{{city}} · {{radius}} km · {{range}}", {
                          city: escalation.locationCity,
                          radius: escalation.locationRadiusKm,
                          range: formatDateRange(
                            t,
                            escalation.startDate,
                            escalation.endDate,
                          ),
                        })}
                      </p>
                    </div>

                    {/* Response stats */}
                    <div className="shrink-0 rounded-[10px] border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        {t("Responses")}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dcfce7]">
                            <HandRaisedIcon className="h-3 w-3 text-[#16a34a]" />
                          </span>
                          <span className="text-sm font-semibold text-neutral-800">
                            {escalation.helpResponses}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {t("can help")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eff6ff]">
                            <PlusCircleIcon className="h-3 w-3 text-[#2563eb]" />
                          </span>
                          <span className="text-sm font-semibold text-neutral-800">
                            {escalation.needCapacityResponses}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {t("also need")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Skills & certificates ── */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {t("Requested skills")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {escalation.skills.length > 0 ? (
                          escalation.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#1d4ed8]"
                            >
                              {t(skill)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-400">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {t("Required certificates")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {escalation.certificates.length > 0 ? (
                          escalation.certificates.map((cert) => (
                            <span
                              key={cert}
                              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                            >
                              {t(cert)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">
                            {t("No required certificates")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Action area ── */}
                  <div className="mt-5 border-t border-neutral-100 pt-5">
                    {hasResponded && escalation.responseType ? (
                      /* Confirmation banner */
                      <div
                        className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 ${
                          escalation.responseType === "CanHelp"
                            ? "border-[#bbf7d0] bg-[#f0fdf4]"
                            : "border-[#bfdbfe] bg-[#eff6ff]"
                        }`}
                      >
                        <CheckCircleIcon
                          className={`mt-0.5 h-5 w-5 shrink-0 ${
                            escalation.responseType === "CanHelp"
                              ? "text-[#16a34a]"
                              : "text-[#2563eb]"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              escalation.responseType === "CanHelp"
                                ? "text-[#15803d]"
                                : "text-[#1d4ed8]"
                            }`}
                          >
                            {escalation.responseType === "CanHelp"
                              ? t("You replied: I can help")
                              : t("You replied: I also need capacity")}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {escalation.responseType === "CanHelp"
                              ? t(
                                  "An availability declaration has been created on your behalf and the matching engine is running.",
                                )
                              : t(
                                  "A capacity request has been created on your behalf and the matching engine is running.",
                                )}
                          </p>
                        </div>
                      </div>
                    ) : canManageCompany ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="mr-1 text-sm text-neutral-500">
                          {t(
                            "Choose whether your company can help with this request or also needs capacity.",
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              void onRespond(escalation.id, "CanHelp")
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#16a34a] px-4 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <HandRaisedIcon className="h-4 w-4" />
                            {submitting ? t("Submitting...") : t("I can help")}
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              void onRespond(escalation.id, "NeedCapacity")
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <PlusCircleIcon className="h-4 w-4" />
                            {submitting
                              ? t("Submitting...")
                              : t("I also need capacity")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <PermissionNotice
                        title={t("Manager action required")}
                        description={t(
                          "Only company managers can respond to network-wide requests. You can review the request details, but a manager needs to submit the company response.",
                        )}
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

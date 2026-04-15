import type {
  NetworkEscalationResponse,
  NetworkResponseType,
} from "@/types/api-network-escalations";
import type { TranslateFn } from "@/types/i18n";

type NetworkEscalationsContentProps = {
  escalations: NetworkEscalationResponse[];
  highlightedRequestId?: number | null;
  loading: boolean;
  error: string | null;
  toastError: string;
  actionInProgress: number | null;
  onRetry: () => void | Promise<void>;
  onRespond: (
    escalationId: number,
    responseType: NetworkResponseType,
  ) => void | Promise<void>;
  t: TranslateFn;
};

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

function responseLabel(t: TranslateFn, responseType: NetworkResponseType) {
  return responseType === "CanHelp"
    ? t("You replied: I can help")
    : t("You replied: I also need capacity");
}

function urgencyBadgeClass(urgency: NetworkEscalationResponse["urgency"]) {
  if (urgency === "Critical") {
    return "border-[#fecaca] bg-[#fff1f2] text-[#be123c]";
  }

  if (urgency === "High") {
    return "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export function NetworkEscalationsContent({
  escalations,
  highlightedRequestId,
  loading,
  error,
  toastError,
  actionInProgress,
  onRetry,
  onRespond,
  t,
}: NetworkEscalationsContentProps) {
  const showEmptyState = !loading && !error && escalations.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
            {t("Network requests")}
          </h1>
          <p className="mt-2 max-w-[760px] text-sm leading-6 text-neutral-600">
            {t(
              "Review urgent network-wide requests that need a quick response from your company.",
            )}
          </p>
        </div>
        <div className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          {loading
            ? t("Loading network requests...")
            : escalations.length === 1
              ? t("{{count}} request", { count: escalations.length })
              : t("{{count}} requests", { count: escalations.length })}
        </div>
      </header>

      {toastError ? (
        <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {toastError}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-[10px] border border-[#fca5a5] bg-white px-3 py-2 text-xs font-semibold text-[#b91c1c] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
          >
            {t("Try again")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          <div className="inline-flex items-center gap-3 text-sm text-neutral-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span>{t("Loading network requests...")}</span>
          </div>
        </div>
      ) : null}

      {showEmptyState ? (
        <section className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t("No network requests right now")}
          </h2>
          <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 text-neutral-600">
            {t(
              "Urgent escalations from the broader network will appear here when your company is eligible to respond.",
            )}
          </p>
        </section>
      ) : null}

      {!loading ? (
        <div className="mt-6 space-y-4">
          {escalations.map((escalation) => {
            const hasResponded = escalation.hasResponded;
            const submitting = actionInProgress === escalation.id;

            return (
              <article
                key={escalation.id}
                id={`network-request-${escalation.requestId}`}
                className={`rounded-[14px] border bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition ${
                  highlightedRequestId === escalation.requestId
                    ? "border-[#2563eb] ring-2 ring-[#93c5fd]"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${urgencyBadgeClass(
                          escalation.urgency,
                        )}`}
                      >
                        {t("{{urgency}} priority", {
                          urgency: t(escalation.urgency),
                        })}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {t("Escalated {{date}}", {
                          date: formatTriggeredAt(escalation.triggeredAt),
                        })}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-neutral-900">
                      {escalation.quantity === 1
                        ? t("{{count}} worker needed", {
                            count: escalation.quantity,
                          })
                        : t("{{count}} workers needed", {
                            count: escalation.quantity,
                          })}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
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

                  <div className="rounded-[12px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    <p>
                      {t("{{count}} can help", {
                        count: escalation.helpResponses,
                      })}
                    </p>
                    <p className="mt-1">
                      {t("{{count}} also need capacity", {
                        count: escalation.needCapacityResponses,
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {t("Requested skills")}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {escalation.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {t("Required certificates")}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {escalation.certificates.length > 0 ? (
                        escalation.certificates.map((certificate) => (
                          <span
                            key={certificate}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                          >
                            {certificate}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-500">
                          {t("No required certificates")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[12px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  {hasResponded && escalation.responseType ? (
                    <p>{responseLabel(t, escalation.responseType)}</p>
                  ) : (
                    <p>
                      {t(
                        "Choose whether your company can help with this request or also needs capacity.",
                      )}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={hasResponded || submitting}
                    onClick={() => void onRespond(escalation.id, "CanHelp")}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#00a63e] px-5 text-sm font-semibold text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? t("Submitting...") : t("I can help")}
                  </button>
                  <button
                    type="button"
                    disabled={hasResponded || submitting}
                    onClick={() =>
                      void onRespond(escalation.id, "NeedCapacity")
                    }
                    className="inline-flex h-11 items-center justify-center rounded-[10px] border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? t("Submitting...")
                      : t("I also need capacity")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

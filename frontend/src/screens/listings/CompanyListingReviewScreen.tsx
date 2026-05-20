"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PermissionNotice } from "@/components/ui/PermissionNotice";
import { parseProblemDetails } from "@/lib/backend/errors";
import { APP_ROUTES } from "@/constants/routes";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type {
  AvailabilityDeclarationResponse,
  CapacityRequestResponse,
  ListingStatus,
} from "@/types/api";
import type { AuthenticatedUser } from "@/types/auth";

type CompanyListingReviewScreenProps = {
  user: AuthenticatedUser;
  listingId: number;
  kind: "availability" | "request";
  canManage: boolean;
};

type Listing = AvailabilityDeclarationResponse | CapacityRequestResponse;

function isCapacityRequest(
  listing: Listing,
): listing is CapacityRequestResponse {
  return "urgency" in listing;
}

function formatDateRange(startDate: string, endDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).formatRange(new Date(startDate), new Date(endDate));
}

function formatStatus(status: ListingStatus) {
  switch (status) {
    case "Active":
      return {
        label: "Active",
        classes: "border-[#86efac] bg-[#f0fdf4] text-[#166534]",
      };
    case "Cancelled":
      return {
        label: "Cancelled",
        classes: "border-[#fecaca] bg-[#fff5f5] text-[#b91c1c]",
      };
    case "Fulfilled":
      return {
        label: "Fulfilled",
        classes: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
      };
    case "Expired":
      return {
        label: "Expired",
        classes: "border-neutral-300 bg-neutral-100 text-neutral-700",
      };
    default:
      return {
        label: status,
        classes: "border-neutral-300 bg-neutral-100 text-neutral-700",
      };
  }
}

function formatExperienceLevel(experienceLevel: string | null | undefined) {
  switch (experienceLevel) {
    case "junior":
      return "Junior (0-3 years)";
    case "mid":
      return "Mid-level (3-7 years)";
    case "senior":
      return "Senior (7+ years)";
    default:
      return "Not specified";
  }
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-neutral-900">{value}</p>
    </article>
  );
}

export function CompanyListingReviewScreen({
  user,
  listingId,
  kind,
  canManage,
}: CompanyListingReviewScreenProps) {
  const router = useRouter();
  const { t } = useLocalizedScreen();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadListing() {
      setLoading(true);
      setErrorMessage("");

      try {
        const endpoint =
          kind === "availability"
            ? `/api/availability/${listingId}`
            : `/api/requests/${listingId}`;
        const response = await fetch(endpoint, { cache: "no-store" });

        if (!response.ok) {
          throw new Error((await parseProblemDetails(response)).message);
        }

        const data = (await response.json()) as Listing;
        if (!active) {
          return;
        }

        setListing(data);
      } catch (error) {
        if (!active) {
          return;
        }

        setListing(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("Unable to load the listing right now."),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadListing();

    return () => {
      active = false;
    };
  }, [kind, listingId, t]);

  const title =
    kind === "availability" ? t("Review availability") : t("Review request");
  const description =
    kind === "availability"
      ? t(
          "Review the published availability details and withdraw it if the offer is no longer valid.",
        )
      : t(
          "Review the live capacity request and cancel it if your company no longer needs external support.",
        );
  const actionLabel =
    kind === "availability" ? t("Withdraw availability") : t("Cancel request");

  const status = useMemo(
    () => (listing ? formatStatus(listing.status) : null),
    [listing],
  );

  async function handleDeactivate() {
    if (!listing || listing.status !== "Active") {
      return;
    }

    setIsActing(true);
    setActionError("");

    try {
      const endpoint =
        kind === "availability"
          ? `/api/availability/${listing.id}/withdraw`
          : `/api/requests/${listing.id}/cancel`;
      const response = await fetch(endpoint, { method: "POST" });

      if (!response.ok) {
        throw new Error((await parseProblemDetails(response)).message);
      }

      router.refresh();
      const updated = (await response.json()) as Listing;
      setListing(updated);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : t("Unable to update the listing right now."),
      );
    } finally {
      setIsActing(false);
    }
  }

  const activeItemKey =
    kind === "availability" ? "Declare availability" : "Request capacity";

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} user={user} activeItemKey={activeItemKey} />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} showSignOut={false} />

          <div className="mx-auto w-full max-w-[1248px] space-y-4 p-4 sm:p-6 lg:p-8">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
                  {title}
                </h1>
                <p className="mt-2 max-w-[760px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
                  {description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={APP_ROUTES.matches}
                  className="inline-flex h-11 items-center justify-center rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700"
                >
                  {t("Open matches")}
                </Link>
                <Link
                  href={APP_ROUTES.dashboard}
                  className="inline-flex h-11 items-center justify-center rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700"
                >
                  {t("Back to dashboard")}
                </Link>
              </div>
            </header>

            {loading ? (
              <section className="rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
                <div className="inline-flex items-center gap-3 text-sm text-neutral-600">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <span>{t("Loading...")}</span>
                </div>
              </section>
            ) : null}

            {errorMessage ? (
              <section className="rounded-[14px] border border-[#fecaca] bg-[#fff5f5] px-4 py-4 text-sm text-[#b91c1c]">
                <p>{errorMessage}</p>
              </section>
            ) : null}

            {listing && !loading ? (
              <>
                <section className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                        {kind === "availability"
                          ? t("Published availability")
                          : t("Published request")}
                      </p>
                      <h2 className="mt-2 text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
                        {t("{{count}} workers in {{location}}", {
                          count: listing.quantity,
                          location: listing.locationCity,
                        })}
                      </h2>
                    </div>

                    {status ? (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.classes}`}
                      >
                        {t(status.label)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DetailCard
                      label={t("Period")}
                      value={formatDateRange(
                        listing.startDate,
                        listing.endDate,
                      )}
                    />
                    <DetailCard
                      label={t("Radius")}
                      value={t("{{count}} km", {
                        count: listing.locationRadiusKm,
                      })}
                    />
                    <DetailCard
                      label={t("Experience level")}
                      value={t(formatExperienceLevel(listing.experienceLevel))}
                    />
                    <DetailCard
                      label={t("Created")}
                      value={new Intl.DateTimeFormat(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(listing.createdAt))}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    <DetailCard
                      label={t("Skills")}
                      value={listing.skills.join(", ") || t("Not specified")}
                    />
                    <DetailCard
                      label={t("Certificates")}
                      value={
                        listing.certificates.join(", ") || t("Not specified")
                      }
                    />
                  </div>

                  {isCapacityRequest(listing) ? (
                    <div className="mt-4">
                      <DetailCard
                        label={t("Urgency")}
                        value={
                          listing.urgency === "High" ? t("Urgent") : t("Normal")
                        }
                      />
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {t("Management")}
                  </h3>
                  <p className="mt-2 max-w-[760px] text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
                    {kind === "availability"
                      ? t(
                          "Use this page to review the live declaration after publishing and withdraw it when your company can no longer supply the listed capacity.",
                        )
                      : t(
                          "Use this page to review the live request after publishing and cancel it when your capacity need has changed or been resolved.",
                        )}
                  </p>

                  {actionError ? (
                    <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
                      {actionError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {canManage ? (
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={listing.status !== "Active" || isActing}
                        className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#fca5a5] bg-[#fff5f5] px-5 text-sm font-semibold text-[#b91c1c] disabled:opacity-60"
                      >
                        {isActing ? t("Saving...") : actionLabel}
                      </button>
                    ) : (
                      <PermissionNotice
                        title={t("Read-only access")}
                        description={
                          kind === "availability"
                            ? t(
                                "Only company managers can withdraw availability declarations. You can review the details here.",
                              )
                            : t(
                                "Only company managers can cancel capacity requests. You can review the details here.",
                              )
                        }
                      />
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useMemo } from "react";
import { PlatformActivityList } from "@/components/admin/platform/PlatformActivityList";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { PlatformSummaryCard } from "@/components/admin/platform/PlatformSummaryCard";
import { PlatformSurfaceCard } from "@/components/admin/platform/PlatformSurfaceCard";
import {
  formatPlatformDate,
  formatPlatformDateTime,
} from "@/components/admin/platform/utils";
import { getCategoryLabel } from "@/constants/categories";
import { APP_ROUTES } from "@/constants/routes";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { useAdminAccessRequests } from "@/hooks/useAdminAccessRequests";
import { useAdminCompanies } from "@/hooks/useAdminCompanies";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { usePlatformAdminPreferences } from "@/hooks/usePlatformAdminPreferences";
import type { AuthenticatedUser } from "@/types/auth";

type PlatformOverviewScreenProps = {
  user: AuthenticatedUser;
};

export function PlatformOverviewScreen({ user }: PlatformOverviewScreenProps) {
  const { t } = useLocalizedScreen();
  const { preferences } = usePlatformAdminPreferences();
  const {
    requests,
    loading: requestsLoading,
    errorMessage: requestsErrorMessage,
  } = useAdminAccessRequests();
  const {
    records,
    loading: companiesLoading,
    errorMessage: companiesErrorMessage,
  } = useAdminCompanies();
  const {
    events,
    loading: auditLoading,
    errorMessage: auditErrorMessage,
  } = useAdminAudit();
  const loading = requestsLoading || companiesLoading || auditLoading;
  const errorMessages = [
    requestsErrorMessage,
    companiesErrorMessage,
    auditErrorMessage,
  ].filter(Boolean);

  const metrics = useMemo(() => {
    const pendingCount = requests.filter(
      (request) => request.status === "Pending",
    ).length;
    const reviewedCount = events.filter(
      (event) => event.type === "Approval" || event.type === "Rejection",
    ).length;
    const uniqueProvisionedCompanies = new Set(
      records
        .filter((record) => record.status === "Provisioned")
        .map(
          (record) =>
            record.provisionedCompanyId ?? record.companyId ?? record.requestId,
        )
        .filter((value): value is number => typeof value === "number"),
    ).size;
    const approvedRequests = requests.filter(
      (request) => request.status === "Approved",
    );
    const approvedCount = approvedRequests.length;
    const provisioningAlerts = approvedRequests.filter(
      (request) => !request.provisionedCompanyId,
    ).length;

    return [
      {
        label: t("Pending approvals"),
        value: loading ? "..." : String(pendingCount),
        helper: t("Access requests currently waiting for review."),
        tone: "amber" as const,
      },
      {
        label: t("Provisioned companies"),
        value: loading ? "..." : String(uniqueProvisionedCompanies),
        helper: t("Approved requests that already produced a company record."),
        tone: "green" as const,
      },
      {
        label: t("Approved requests"),
        value: loading ? "..." : String(approvedCount),
        helper:
          provisioningAlerts > 0
            ? t(
                "{{count}} approved requests still need provisioning follow-up.",
                {
                  count: provisioningAlerts,
                },
              )
            : t("Approved requests now visible in the admin company registry."),
        tone:
          preferences.highlightProvisioningAlerts && provisioningAlerts > 0
            ? ("amber" as const)
            : ("blue" as const),
      },
      {
        label: t("Review events"),
        value: loading ? "..." : String(reviewedCount),
        helper: t("Approve and reject decisions recorded in the access flow."),
        tone: "slate" as const,
      },
    ];
  }, [
    events,
    loading,
    preferences.highlightProvisioningAlerts,
    records,
    requests,
    t,
  ]);

  const pendingRequests = useMemo(
    () =>
      requests
        .filter((request) => request.status === "Pending")
        .sort((left, right) =>
          preferences.prioritizeFollowUpCompanies
            ? new Date(left.createdAt).getTime() -
              new Date(right.createdAt).getTime()
            : new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
        )
        .slice(0, 4),
    [preferences.prioritizeFollowUpCompanies, requests],
  );

  const recentDecisions = useMemo(
    () =>
      events
        .filter(
          (event) => event.type === "Approval" || event.type === "Rejection",
        )
        .sort(
          (left, right) =>
            new Date(right.timestamp).getTime() -
            new Date(left.timestamp).getTime(),
        )
        .slice(0, 4),
    [events],
  );

  const recentProvisionedCompanies = useMemo(
    () =>
      records
        .sort((left, right) =>
          preferences.prioritizeFollowUpCompanies
            ? new Date(left.reviewedAt ?? left.createdAt).getTime() -
              new Date(right.reviewedAt ?? right.createdAt).getTime()
            : new Date(right.reviewedAt ?? right.createdAt).getTime() -
              new Date(left.reviewedAt ?? left.createdAt).getTime(),
        )
        .slice(0, 4),
    [preferences.prioritizeFollowUpCompanies, records],
  );

  const provisioningAlerts = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "Approved" && !request.provisionedCompanyId,
      ),
    [requests],
  );

  return (
    <PlatformAdminLayout
      user={user}
      t={t}
      activeItemKey="Platform overview"
      title={t("Platform overview")}
      description={t(
        "Monitor incoming demand, approval throughput, and the operational health of the KapacitetNet platform from one platform-first workspace.",
      )}
      sidebarNote={t(
        "Use this overview to track review backlog, approved company coverage, and decision history across incoming company access requests.",
      )}
      dataName="Platform Overview"
      dataNodeId="platform-overview"
    >
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <PlatformSummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      {errorMessages.map((message) => (
        <div
          key={message}
          className="mt-4 rounded-[12px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]"
        >
          {message}
        </div>
      ))}

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <PlatformSurfaceCard
          eyebrow={t("Review queue")}
          title={t("Pending requests")}
          description={t("The newest company requests waiting for review.")}
        >
          <PlatformActivityList
            t={t}
            items={pendingRequests.map((request) => ({
              id: `pending-${request.id}`,
              title: request.name,
              meta: `${request.categories.map(getCategoryLabel).join(", ") || "—"} · ${request.location}`,
              helper: t("Submitted {{date}} · {{email}}", {
                date: formatPlatformDate(request.createdAt),
                email: request.contactEmail,
              }),
              href: `${APP_ROUTES.adminAccessRequests}?requestId=${request.id}`,
              statusLabel: t("Pending"),
              statusTone: "warning" as const,
            }))}
            emptyMessage={t("There are no pending access requests right now.")}
            ctaLabel={t("Review")}
          />
        </PlatformSurfaceCard>

        <PlatformSurfaceCard
          eyebrow={t("Recent decisions")}
          title={t("Latest review activity")}
          description={t(
            "The most recent approval and rejection decisions across company onboarding.",
          )}
        >
          <PlatformActivityList
            t={t}
            items={recentDecisions.map((event) => ({
              id: `decision-${event.id}`,
              title: event.companyName,
              meta: t("{{type}} on {{date}}", {
                type: t(event.type),
                date: formatPlatformDateTime(event.timestamp),
              }),
              helper: `${t("Reviewed by {{actor}}", {
                actor: event.actor ?? t("platform administrator"),
              })}${
                event.provisionedCompanyId
                  ? t(" · Company ID {{id}}", {
                      id: event.provisionedCompanyId,
                    })
                  : event.companyId
                    ? t(" · Company ID {{id}}", { id: event.companyId })
                    : ""
              }`,
              href: `${APP_ROUTES.adminAudit}?eventId=${encodeURIComponent(
                event.id,
              )}`,
              statusLabel:
                event.type === "Approval" ? t("Approved") : t("Rejected"),
              statusTone:
                event.type === "Approval"
                  ? ("success" as const)
                  : ("danger" as const),
            }))}
            emptyMessage={t("No reviewed requests are available yet.")}
            ctaLabel={t("Open")}
          />
        </PlatformSurfaceCard>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <PlatformSurfaceCard
          eyebrow={t("Company registry")}
          title={t("Recently provisioned companies")}
          description={t(
            "The most recently reviewed companies that are already linked into the platform registry.",
          )}
        >
          <PlatformActivityList
            t={t}
            items={recentProvisionedCompanies.map((record) => ({
              id: `company-${record.provisionedCompanyId ?? record.companyId ?? record.requestId}`,
              title: record.companyName,
              meta: `${record.categories.map(getCategoryLabel).join(", ") || "—"} · ${record.location}`,
              helper: t("Reviewed {{date}} · {{email}}", {
                date: formatPlatformDateTime(record.reviewedAt),
                email: record.contactEmail,
              }),
              href: `${APP_ROUTES.adminCompanies}?${
                record.companyId || record.provisionedCompanyId
                  ? `companyId=${record.companyId ?? record.provisionedCompanyId}`
                  : `requestId=${record.requestId}`
              }`,
              statusLabel: t("Provisioned"),
              statusTone: "success" as const,
            }))}
            emptyMessage={t(
              "No provisioned companies are visible in the registry yet.",
            )}
            ctaLabel={t("Inspect")}
          />
        </PlatformSurfaceCard>

        <PlatformSurfaceCard
          eyebrow={t("Coverage")}
          title={t("What is already tracked")}
          description={t(
            "The admin workspace now covers the main onboarding flow from submission through decision, provisioning linkage, company registry visibility, and event history.",
          )}
        >
          <div className="space-y-3">
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {t("Functional areas")}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {t(
                  "Access review, company registry, audit timeline, and saved admin workspace preferences are all available in the platform admin UI.",
                )}
              </p>
            </div>
            <div
              className={`rounded-[12px] border px-4 py-3 ${
                preferences.highlightProvisioningAlerts &&
                provisioningAlerts.length > 0
                  ? "border-[#fde68a] bg-[#fffbeb]"
                  : "border-neutral-200 bg-[#fafafa]"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                {preferences.highlightProvisioningAlerts &&
                provisioningAlerts.length > 0
                  ? t("Provisioning alerts")
                  : t("Suggested next step")}
              </p>
              {preferences.highlightProvisioningAlerts &&
              provisioningAlerts.length > 0 ? (
                <p className="mt-1 text-sm text-neutral-700">
                  {t(
                    "{{count}} approved requests do not yet show a linked company record. Open the access-request queue first if you need to verify provisioning follow-up.",
                    { count: provisioningAlerts.length },
                  )}
                </p>
              ) : (
                <p className="mt-1 text-sm text-neutral-700">
                  {t(
                    "Use the company registry to inspect linked companies, then open the audit log when you need to trace a request from submission to activation.",
                  )}
                </p>
              )}
            </div>
          </div>
        </PlatformSurfaceCard>
      </section>
    </PlatformAdminLayout>
  );
}

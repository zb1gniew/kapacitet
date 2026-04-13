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
  const { preferences } = usePlatformAdminPreferences();
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
    const provisioningAlerts = records.filter(
      (record) => record.status === "Needs follow-up",
    ).length;

    return [
      {
        label: "Pending approvals",
        value: loading ? "..." : String(pendingCount),
        helper: "Access requests currently waiting for review.",
        tone: "amber" as const,
      },
      {
        label: "Provisioned companies",
        value: loading ? "..." : String(uniqueProvisionedCompanies),
        helper: "Approved requests that already produced a company record.",
        tone: "green" as const,
      },
      {
        label: "Operational alerts",
        value: loading ? "..." : String(provisioningAlerts),
        helper: "Approved requests still missing a linked provisioned company.",
        tone: preferences.highlightProvisioningAlerts
          ? ("amber" as const)
          : ("blue" as const),
      },
      {
        label: "Review events",
        value: loading ? "..." : String(reviewedCount),
        helper: "Approve and reject decisions recorded in the access flow.",
        tone: "slate" as const,
      },
    ];
  }, [
    events,
    loading,
    preferences.highlightProvisioningAlerts,
    records,
    requests,
  ]);

  const pendingRequests = useMemo(
    () =>
      requests
        .filter((request) => request.status === "Pending")
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )
        .slice(0, 4),
    [requests],
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

  const followUpCompanies = useMemo(
    () =>
      records
        .filter((record) => record.status === "Needs follow-up")
        .sort(
          (left, right) =>
            new Date(right.reviewedAt ?? right.createdAt).getTime() -
            new Date(left.reviewedAt ?? left.createdAt).getTime(),
        )
        .slice(0, 4),
    [records],
  );

  return (
    <PlatformAdminLayout
      user={user}
      t={t}
      activeItemKey="Platform overview"
      title="Platform overview"
      description="Monitor incoming demand, provisioning progress, and the operational health of the KapacitetNet platform from one platform-first workspace."
      sidebarNote="Use this overview to track review backlog, provisioning progress, and follow-up work across incoming company access requests."
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
          eyebrow="Review queue"
          title="Pending requests"
          description="The newest company requests waiting for review."
        >
          <PlatformActivityList
            items={pendingRequests.map((request) => ({
              id: `pending-${request.id}`,
              title: request.name,
              meta: `${request.industry} · ${request.location}`,
              helper: `Submitted ${formatPlatformDate(request.createdAt)} · ${request.contactEmail}`,
              href: `${APP_ROUTES.adminAccessRequests}?requestId=${request.id}`,
              statusLabel: "Pending",
              statusTone: "warning" as const,
            }))}
            emptyMessage="There are no pending access requests right now."
            ctaLabel="Review"
          />
        </PlatformSurfaceCard>

        <PlatformSurfaceCard
          eyebrow="Recent decisions"
          title="Latest review activity"
          description="The most recent approval and rejection decisions across company onboarding."
        >
          <PlatformActivityList
            items={recentDecisions.map((event) => ({
              id: `decision-${event.id}`,
              title: event.companyName,
              meta: `${event.type} on ${formatPlatformDateTime(
                event.timestamp,
              )}`,
              helper: `Reviewed by ${event.actor ?? "platform administrator"}${
                event.provisionedCompanyId
                  ? ` · Company ID ${event.provisionedCompanyId}`
                  : event.companyId
                    ? ` · Company ID ${event.companyId}`
                    : ""
              }`,
              href: `${APP_ROUTES.adminAudit}?eventId=${encodeURIComponent(
                event.id,
              )}`,
              statusLabel: event.type === "Approval" ? "Approved" : "Rejected",
              statusTone:
                event.type === "Approval"
                  ? ("success" as const)
                  : ("danger" as const),
            }))}
            emptyMessage="No reviewed requests are available yet."
            ctaLabel="Open"
          />
        </PlatformSurfaceCard>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <PlatformSurfaceCard
          eyebrow="Provisioning follow-up"
          title="Companies needing attention"
          description="Approved companies that still need provisioning follow-up before the registry is fully linked."
        >
          <PlatformActivityList
            items={followUpCompanies.map((record) => ({
              id: `follow-up-${record.requestId}`,
              title: record.companyName,
              meta: `${record.industry} · ${record.location}`,
              helper: `Reviewed ${formatPlatformDateTime(
                record.reviewedAt,
              )} · ${record.contactEmail}`,
              href: `${APP_ROUTES.adminCompanies}?${
                record.companyId || record.provisionedCompanyId
                  ? `companyId=${record.companyId ?? record.provisionedCompanyId}`
                  : `requestId=${record.requestId}`
              }`,
              statusLabel: "Needs follow-up",
              statusTone: "warning" as const,
            }))}
            emptyMessage="No companies currently need provisioning follow-up."
            ctaLabel="Inspect"
          />
        </PlatformSurfaceCard>

        <PlatformSurfaceCard
          eyebrow="Coverage"
          title="What is already tracked"
          description="The admin workspace now covers the main onboarding flow from submission through decision, provisioning linkage, company registry visibility, and event history."
        >
          <div className="space-y-3">
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Functional areas
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                Access review, company registry, audit timeline, and saved admin
                workspace preferences are all available in the platform admin
                UI.
              </p>
            </div>
            <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Suggested next step
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                Use the company registry for follow-up, then open the audit log
                when you need to trace a request from submission to activation.
              </p>
            </div>
          </div>
        </PlatformSurfaceCard>
      </section>
    </PlatformAdminLayout>
  );
}

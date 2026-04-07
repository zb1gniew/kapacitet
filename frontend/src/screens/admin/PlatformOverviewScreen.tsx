"use client";

import { useMemo } from "react";
import { PlatformActivityList } from "@/components/admin/platform/PlatformActivityList";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { PlatformSummaryCard } from "@/components/admin/platform/PlatformSummaryCard";
import { PlatformSurfaceCard } from "@/components/admin/platform/PlatformSurfaceCard";
import {
  deriveCompanyRegistryRecords,
  formatPlatformDate,
  formatPlatformDateTime,
} from "@/components/admin/platform/utils";
import { APP_ROUTES } from "@/constants/routes";
import { useAdminAccessRequests } from "@/hooks/useAdminAccessRequests";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { usePlatformAdminPreferences } from "@/hooks/usePlatformAdminPreferences";
import type { AuthenticatedUser } from "@/types/auth";

type PlatformOverviewScreenProps = {
  user: AuthenticatedUser;
};

export function PlatformOverviewScreen({ user }: PlatformOverviewScreenProps) {
  const { t } = useLocalizedScreen();
  const { requests, loading, errorMessage } = useAdminAccessRequests();
  const { preferences } = usePlatformAdminPreferences();

  const metrics = useMemo(() => {
    const pendingCount = requests.filter(
      (request) => request.status === "Pending",
    ).length;
    const approvedRequests = requests.filter(
      (request) => request.status === "Approved",
    );
    const reviewedCount = requests.filter(
      (request) => request.reviewedAt,
    ).length;
    const uniqueProvisionedCompanies = new Set(
      approvedRequests
        .map((request) => request.provisionedCompanyId)
        .filter((value): value is number => typeof value === "number"),
    ).size;
    const provisioningAlerts = approvedRequests.filter(
      (request) => !request.provisionedCompanyId,
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
  }, [loading, preferences.highlightProvisioningAlerts, requests]);

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
      requests
        .filter((request) => request.reviewedAt)
        .sort(
          (left, right) =>
            new Date(right.reviewedAt ?? right.createdAt).getTime() -
            new Date(left.reviewedAt ?? left.createdAt).getTime(),
        )
        .slice(0, 4),
    [requests],
  );

  const followUpCompanies = useMemo(
    () =>
      deriveCompanyRegistryRecords(requests)
        .filter((record) => record.status === "Needs follow-up")
        .slice(0, 4),
    [requests],
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

      {errorMessage ? (
        <div className="mt-4 rounded-[12px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {errorMessage}
        </div>
      ) : null}

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
              href: APP_ROUTES.adminAccessRequests,
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
            items={recentDecisions.map((request) => ({
              id: `decision-${request.id}`,
              title: request.name,
              meta: `${request.status} on ${formatPlatformDateTime(
                request.reviewedAt,
              )}`,
              helper: `Reviewed by ${request.reviewedBy ?? "platform administrator"}${
                request.provisionedCompanyId
                  ? ` · Company ID ${request.provisionedCompanyId}`
                  : ""
              }`,
              href: APP_ROUTES.adminAccessRequests,
              statusLabel: request.status,
              statusTone:
                request.status === "Approved"
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
              href: APP_ROUTES.adminCompanies,
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuditTimelineEventCard } from "@/components/admin/platform/AuditTimelineEventCard";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { PlatformCollectionToolbar } from "@/components/admin/platform/PlatformCollectionToolbar";
import { PlatformSummaryCard } from "@/components/admin/platform/PlatformSummaryCard";
import { PlatformSurfaceCard } from "@/components/admin/platform/PlatformSurfaceCard";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { usePlatformAdminPreferences } from "@/hooks/usePlatformAdminPreferences";
import type { AuthenticatedUser } from "@/types/auth";
import type { AuditEventFilterTab } from "@/types/admin";

type PlatformAuditScreenProps = {
  user: AuthenticatedUser;
};

export function PlatformAuditScreen({ user }: PlatformAuditScreenProps) {
  const searchParams = useSearchParams();
  const { t } = useLocalizedScreen();
  const { events, loading, errorMessage } = useAdminAudit();
  const { preferences } = usePlatformAdminPreferences();
  const [currentTimestamp] = useState(() => Date.now());
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<AuditEventFilterTab | null>(
    null,
  );
  const highlightedEventId = searchParams.get("eventId");

  const highlightedEvent = useMemo(
    () =>
      highlightedEventId
        ? (events.find((event) => event.id === highlightedEventId) ?? null)
        : null,
    [events, highlightedEventId],
  );

  const currentFilter =
    activeFilter ??
    (highlightedEvent
      ? highlightedEvent.type === "Submission"
        ? "Submissions"
        : highlightedEvent.type === "Provisioning"
          ? "Provisioning"
          : "Decisions"
      : preferences.defaultAuditFilter);

  useEffect(() => {
    if (loading || !highlightedEventId) {
      return;
    }

    const target = document.getElementById(`audit-event-${highlightedEventId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedEventId, loading]);

  const metrics = useMemo(() => {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const decisionEvents = events.filter(
      (event) => event.type === "Approval" || event.type === "Rejection",
    );
    const reviewsToday = decisionEvents.filter((event) => {
      const reviewedTime = new Date(event.timestamp).getTime();
      return (
        !Number.isNaN(reviewedTime) &&
        currentTimestamp - reviewedTime <= oneDayInMs
      );
    }).length;
    const rejectedCount = events.filter(
      (event) => event.type === "Rejection",
    ).length;
    const provisioningEvents = events.filter(
      (event) => event.type === "Provisioning",
    ).length;
    const submissionEvents = events.filter(
      (event) => event.type === "Submission",
    ).length;

    return [
      {
        label: "Reviews today",
        value: loading ? "..." : String(reviewsToday),
        helper: "Access-request decisions recorded in the last 24 hours.",
        tone: "blue" as const,
      },
      {
        label: "Review events",
        value: loading ? "..." : String(decisionEvents.length),
        helper: "Requests with an approve or reject decision recorded.",
        tone: "amber" as const,
      },
      {
        label: "Rejected requests",
        value: loading ? "..." : String(rejectedCount),
        helper: "Requests that were rejected and added to the audit trail.",
        tone: "green" as const,
      },
      {
        label: "Provisioning events",
        value: loading ? "..." : String(provisioningEvents),
        helper:
          submissionEvents > 0
            ? `${submissionEvents} submissions are represented in the audit timeline.`
            : "No submissions have been recorded yet.",
        tone: "slate" as const,
      },
    ];
  }, [currentTimestamp, events, loading]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const filteredByType =
      currentFilter === "All"
        ? events
        : events.filter((event) => {
            if (currentFilter === "Submissions") {
              return event.type === "Submission";
            }

            if (currentFilter === "Decisions") {
              return event.type === "Approval" || event.type === "Rejection";
            }

            return event.type === "Provisioning";
          });

    return normalizedSearch
      ? filteredByType.filter((event) =>
          [
            event.companyName,
            event.contactEmail,
            event.actor,
            event.summary,
            event.detail,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedSearch)),
        )
      : filteredByType;
  }, [currentFilter, events, searchValue]);

  return (
    <PlatformAdminLayout
      user={user}
      t={t}
      activeItemKey="Audit log"
      title="Audit log"
      description="Trace platform-level actions across approvals, rejections, provisioning outcomes, and the key decision points recorded in the access-request workflow."
      sidebarNote="Use this view to understand what changed, who reviewed a request, and which approvals still need follow-up after provisioning."
      dataName="Platform Audit"
      dataNodeId="platform-audit"
    >
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <PlatformSummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      <PlatformCollectionToolbar
        searchValue={searchValue}
        searchPlaceholder="Search by company, contact, actor, or event detail"
        onSearchChange={setSearchValue}
        activeFilter={currentFilter}
        onFilterChange={(value) =>
          setActiveFilter(value as AuditEventFilterTab)
        }
        filters={[
          { key: "All", label: "All", count: events.length },
          {
            key: "Submissions",
            label: "Submissions",
            count: events.filter((event) => event.type === "Submission").length,
          },
          {
            key: "Decisions",
            label: "Decisions",
            count: events.filter(
              (event) =>
                event.type === "Approval" || event.type === "Rejection",
            ).length,
          },
          {
            key: "Provisioning",
            label: "Provisioning",
            count: events.filter((event) => event.type === "Provisioning")
              .length,
          },
        ]}
      />

      {errorMessage ? (
        <div className="mt-4 rounded-[12px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          {loading ? (
            <PlatformSurfaceCard
              eyebrow="Audit timeline"
              title="Loading events"
              description="Gathering the latest request submissions, decisions, and provisioning events."
            >
              <p className="text-sm text-neutral-600">
                The audit timeline is loading.
              </p>
            </PlatformSurfaceCard>
          ) : null}

          {!loading && filteredEvents.length === 0 ? (
            <PlatformSurfaceCard
              eyebrow="Audit timeline"
              title="No events found"
              description="No audit events match the current search or filter."
            >
              <p className="text-sm text-neutral-600">
                Try another filter to inspect a broader set of admin events.
              </p>
            </PlatformSurfaceCard>
          ) : null}

          {!loading
            ? filteredEvents.map((event) => (
                <AuditTimelineEventCard
                  key={event.id}
                  event={event}
                  highlighted={highlightedEventId === event.id}
                />
              ))
            : null}
        </div>

        <div className="space-y-4">
          <PlatformSurfaceCard
            eyebrow="Traceability"
            title="Current audit coverage"
            description="The current timeline already captures the main access-request workflow from submission through decision and provisioning linkage."
          >
            <div className="space-y-3">
              <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  Latest event
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {filteredEvents[0]?.summary ?? "Not available"}
                </p>
              </div>
              <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  Investigation support
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  Search by actor, company, or contact email to trace a request
                  from submission through review and provisioning.
                </p>
              </div>
            </div>
          </PlatformSurfaceCard>
        </div>
      </section>
    </PlatformAdminLayout>
  );
}

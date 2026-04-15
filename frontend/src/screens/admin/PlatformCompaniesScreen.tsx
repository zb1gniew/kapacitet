"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CompanyRegistryCard } from "@/components/admin/platform/CompanyRegistryCard";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { PlatformCollectionToolbar } from "@/components/admin/platform/PlatformCollectionToolbar";
import { PlatformSummaryCard } from "@/components/admin/platform/PlatformSummaryCard";
import { PlatformSurfaceCard } from "@/components/admin/platform/PlatformSurfaceCard";
import { formatPlatformDateTime } from "@/components/admin/platform/utils";
import { useAdminCompanies } from "@/hooks/useAdminCompanies";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { usePlatformAdminPreferences } from "@/hooks/usePlatformAdminPreferences";
import type { AuthenticatedUser } from "@/types/auth";
import type {
  CompanyRegistryFilterTab,
  CompanyRegistryRecord,
} from "@/types/admin";

type PlatformCompaniesScreenProps = {
  user: AuthenticatedUser;
};

export function PlatformCompaniesScreen({
  user,
}: PlatformCompaniesScreenProps) {
  const searchParams = useSearchParams();
  const { t } = useLocalizedScreen();
  const { records, loading, errorMessage } = useAdminCompanies();
  const { preferences } = usePlatformAdminPreferences();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<CompanyRegistryFilterTab>("All");
  const highlightedRequestId = Number(searchParams.get("requestId")) || null;
  const highlightedCompanyId = Number(searchParams.get("companyId")) || null;

  const highlightedRecord = useMemo(
    () =>
      records.find(
        (record) =>
          (highlightedRequestId !== null &&
            record.requestId === highlightedRequestId) ||
          (highlightedCompanyId !== null &&
            (record.companyId === highlightedCompanyId ||
              record.provisionedCompanyId === highlightedCompanyId)),
      ) ?? null,
    [highlightedCompanyId, highlightedRequestId, records],
  );

  useEffect(() => {
    if (loading || !highlightedRecord) {
      return;
    }

    const targetId =
      highlightedRecord.companyId ??
      highlightedRecord.provisionedCompanyId ??
      highlightedRecord.requestId ??
      null;

    if (targetId === null) {
      return;
    }

    const target = document.getElementById(`company-registry-${targetId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedRecord, loading]);

  const metrics = useMemo(() => {
    const provisionedRecords = records.filter(
      (record) => record.status === "Provisioned",
    );
    const followUpRecords = records.filter(
      (record) => record.status === "Needs follow-up",
    );
    const now = new Date();
    const newThisMonth = provisionedRecords.filter((record) => {
      const referenceDate = record.reviewedAt ?? record.createdAt;
      const parsedDate = new Date(referenceDate);

      return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.getUTCFullYear() === now.getUTCFullYear() &&
        parsedDate.getUTCMonth() === now.getUTCMonth()
      );
    }).length;

    return [
      {
        label: t("Provisioned companies"),
        value: loading ? "..." : String(provisionedRecords.length),
        helper: t("Companies linked from approved and provisioned requests."),
        tone: "green" as const,
      },
      {
        label: t("Needs follow-up"),
        value: loading ? "..." : String(followUpRecords.length),
        helper: t("Approved requests still missing a linked company record."),
        tone: "amber" as const,
      },
      {
        label: t("Reviewed companies"),
        value: loading ? "..." : String(records.length),
        helper: t("Approved requests now visible in the admin company registry."),
        tone: "slate" as const,
      },
      {
        label: t("New this month"),
        value: loading ? "..." : String(newThisMonth),
        helper: t("Provisioned companies reviewed or created during this month."),
        tone: "blue" as const,
      },
    ];
  }, [loading, records, t]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const filteredByStatus =
      activeFilter === "All"
        ? records
        : records.filter((record) => record.status === activeFilter);
    const filteredBySearch = normalizedSearch
      ? filteredByStatus.filter((record) =>
          [
            record.companyName,
            record.contactEmail,
            record.industry,
            record.location,
            record.reviewedBy,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedSearch)),
        )
      : filteredByStatus;

    return [...filteredBySearch].sort(
      (left: CompanyRegistryRecord, right: CompanyRegistryRecord) => {
        if (preferences.prioritizeFollowUpCompanies) {
          if (left.status !== right.status) {
            return left.status === "Needs follow-up" ? -1 : 1;
          }
        }

        const leftTime = new Date(left.reviewedAt ?? left.createdAt).getTime();
        const rightTime = new Date(
          right.reviewedAt ?? right.createdAt,
        ).getTime();
        return rightTime - leftTime;
      },
    );
  }, [
    activeFilter,
    preferences.prioritizeFollowUpCompanies,
    records,
    searchValue,
  ]);

  return (
    <PlatformAdminLayout
      user={user}
      t={t}
      activeItemKey="Companies"
      title={t("Companies")}
      description={t(
        "Review provisioned organizations, identify onboarding follow-up, and keep the company registry visible from a platform-level perspective.",
      )}
      sidebarNote={t(
        "This registry is built from approved access requests and highlights which companies are already linked and which approvals still need provisioning follow-up.",
      )}
      dataName="Platform Companies"
      dataNodeId="platform-companies"
    >
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <PlatformSummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      <PlatformCollectionToolbar
        t={t}
        searchValue={searchValue}
        searchPlaceholder={t(
          "Search by company, contact email, industry, or location",
        )}
        onSearchChange={setSearchValue}
        activeFilter={activeFilter}
        onFilterChange={(value) =>
          setActiveFilter(value as CompanyRegistryFilterTab)
        }
        filters={[
          { key: "All", label: t("All"), count: records.length },
          {
            key: "Provisioned",
            label: t("Provisioned"),
            count: records.filter((record) => record.status === "Provisioned")
              .length,
          },
          {
            key: "Needs follow-up",
            label: t("Needs follow-up"),
            count: records.filter(
              (record) => record.status === "Needs follow-up",
            ).length,
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
              eyebrow={t("Registry")}
              title={t("Loading companies")}
              description={t(
                "Fetching the latest approved company records from the access-request workflow.",
              )}
            >
              <p className="text-sm text-neutral-600">
                {t("The company registry is loading.")}
              </p>
            </PlatformSurfaceCard>
          ) : null}

          {!loading && filteredRecords.length === 0 ? (
            <PlatformSurfaceCard
              eyebrow={t("Registry")}
              title={t("No companies found")}
              description={t(
                "No approved company records match the current search or filter.",
              )}
            >
              <p className="text-sm text-neutral-600">
                {t(
                  "Try clearing the search or switching to another registry filter.",
                )}
              </p>
            </PlatformSurfaceCard>
          ) : null}

          {!loading
            ? filteredRecords.map((record) => (
                <CompanyRegistryCard
                  key={`${record.requestId ?? "requestless"}-${record.companyId ?? record.provisionedCompanyId ?? record.companyName}`}
                  highlighted={highlightedRecord === record}
                  record={record}
                  t={t}
                />
              ))
            : null}
        </div>

        <div className="space-y-4">
          <PlatformSurfaceCard
            eyebrow={t("Registry summary")}
            title={t("Current company coverage")}
            description={t(
              "A quick read on how recently companies were reviewed and which part of the registry needs attention.",
            )}
          >
            <div className="space-y-3">
              <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  {t("Latest reviewed company")}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {filteredRecords[0]?.companyName ?? t("Not available")}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {filteredRecords[0]
                    ? formatPlatformDateTime(
                        filteredRecords[0].reviewedAt ??
                          filteredRecords[0].createdAt,
                      )
                    : t("No review timestamp available")}
                </p>
              </div>
              <div className="rounded-[12px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  {t("Follow-up queue")}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {t(
                    "{{count}} companies currently need provisioning attention.",
                    {
                      count: records.filter(
                        (record) => record.status === "Needs follow-up",
                      ).length,
                    },
                  )}
                </p>
              </div>
            </div>
          </PlatformSurfaceCard>
        </div>
      </section>
    </PlatformAdminLayout>
  );
}

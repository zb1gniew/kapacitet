"use client";

import { InfoIcon } from "@/components/auth/icons";
import { AccessRequestReviewCard } from "@/components/admin/access-requests/AccessRequestReviewCard";
import { AccessRequestsFilterTabs } from "@/components/admin/access-requests/AccessRequestsFilterTabs";
import { AccessRequestsMetricCard } from "@/components/admin/access-requests/AccessRequestsMetricCard";
import { AccessRequestsToolbar } from "@/components/admin/access-requests/AccessRequestsToolbar";
import type {
  AccessRequestAdvancedFilters,
  SavedAccessRequestView,
} from "@/components/admin/access-requests/types";
import type { AccessRequest, AccessRequestFilterTab } from "@/types/admin";
import type { TranslateFn } from "@/types/i18n";

type AccessRequestsReviewContentProps = {
  t: TranslateFn;
  requests: AccessRequest[];
  filteredRequests: AccessRequest[];
  loading: boolean;
  errorMessage: string;
  toastMessage: string;
  currentActiveTab: AccessRequestFilterTab;
  highlightedRequestId: number | null;
  advancedFilters: AccessRequestAdvancedFilters;
  industryOptions: string[];
  locationOptions: string[];
  reviewerOptions: string[];
  savedViews: SavedAccessRequestView[];
  activeSavedViewId: string | null;
  saveViewName: string;
  onTabChange: (tab: AccessRequestFilterTab) => void;
  onFilterChange: <K extends keyof AccessRequestAdvancedFilters>(
    key: K,
    value: AccessRequestAdvancedFilters[K],
  ) => void;
  onClearFilters: () => void;
  onSaveViewNameChange: (value: string) => void;
  onSaveCurrentView: () => void;
  onApplySavedView: (id: string) => void;
  onDeleteSavedView: (id: string) => void;
  onApproveRequest: (request: AccessRequest) => void;
  onRejectRequest: (request: AccessRequest) => void;
};

export function AccessRequestsReviewContent({
  t,
  requests,
  filteredRequests,
  loading,
  errorMessage,
  toastMessage,
  currentActiveTab,
  highlightedRequestId,
  advancedFilters,
  industryOptions,
  locationOptions,
  reviewerOptions,
  savedViews,
  activeSavedViewId,
  saveViewName,
  onTabChange,
  onFilterChange,
  onClearFilters,
  onSaveViewNameChange,
  onSaveCurrentView,
  onApplySavedView,
  onDeleteSavedView,
  onApproveRequest,
  onRejectRequest,
}: AccessRequestsReviewContentProps) {
  const pendingCount = requests.filter(
    (request) => request.status === "Pending",
  ).length;
  const approvedCount = requests.filter(
    (request) => request.status === "Approved",
  ).length;
  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected",
  ).length;

  return (
    <>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AccessRequestsMetricCard
          title={t("Pending review")}
          value={pendingCount}
          status="Pending"
        />
        <AccessRequestsMetricCard
          title={t("Approved requests")}
          value={approvedCount}
          status="Approved"
        />
        <AccessRequestsMetricCard
          title={t("Rejected requests")}
          value={rejectedCount}
          status="Rejected"
        />
        <AccessRequestsMetricCard
          title={t("Total requests")}
          value={requests.length}
          status="All"
        />
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-start gap-3 rounded-[12px] border border-[#bedbff] bg-[#eff6ff] px-4 py-3 text-sm text-[#193cb8]">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-[22.75px] tracking-[-0.1504px]">
            {t(
              "Approve verified companies to continue provisioning. Reject only when the request does not meet access requirements.",
            )}
          </p>
        </div>

        <AccessRequestsFilterTabs
          activeTab={currentActiveTab}
          onChange={onTabChange}
          requests={requests}
          t={t}
        />
      </section>

      <AccessRequestsToolbar
        t={t}
        filters={advancedFilters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        resultCount={filteredRequests.length}
        totalCount={requests.length}
        industries={industryOptions}
        locations={locationOptions}
        reviewers={reviewerOptions}
        savedViews={savedViews}
        activeSavedViewId={activeSavedViewId}
        saveViewName={saveViewName}
        onSaveViewNameChange={onSaveViewNameChange}
        onSaveCurrentView={onSaveCurrentView}
        onApplySavedView={onApplySavedView}
        onDeleteSavedView={onDeleteSavedView}
      />

      {toastMessage ? (
        <div className="mt-4 rounded-[12px] border border-[#b9f8cf] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
          {toastMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-[12px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          {t("Loading access requests...")}
        </div>
      ) : null}

      {!loading && filteredRequests.length === 0 ? (
        <div className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          <p className="text-lg font-semibold text-neutral-900">
            {t("No access requests found")}
          </p>
          <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
            {t("There are no requests in the {{tab}} view right now.", {
              tab: t(currentActiveTab),
            })}
          </p>
        </div>
      ) : null}

      {!loading && filteredRequests.length > 0 ? (
        <section className="mt-6 space-y-4">
          {filteredRequests.map((request) => (
            <AccessRequestReviewCard
              key={request.id}
              highlighted={highlightedRequestId === request.id}
              request={request}
              t={t}
              onApprove={() => onApproveRequest(request)}
              onReject={() => onRejectRequest(request)}
            />
          ))}
        </section>
      ) : null}
    </>
  );
}

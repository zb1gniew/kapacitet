"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccessRequestReviewDialog } from "@/components/admin/access-requests/AccessRequestReviewDialog";
import { AccessRequestsReviewContent } from "@/components/admin/access-requests/AccessRequestsReviewContent";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
import { useAccessRequestFilters } from "@/hooks/useAccessRequestFilters";
import { useAdminAccessRequests } from "@/hooks/useAdminAccessRequests";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import { usePlatformAdminPreferences } from "@/hooks/usePlatformAdminPreferences";
import type { AuthenticatedUser } from "@/types/auth";
import type { AccessRequest, AccessRequestFilterTab } from "@/types/admin";

type DialogState =
  | { type: "none" }
  | { type: "approve"; request: AccessRequest }
  | { type: "reject"; request: AccessRequest };

type AccessRequestsReviewScreenProps = {
  user: AuthenticatedUser;
};

export function AccessRequestsReviewScreen({
  user,
}: AccessRequestsReviewScreenProps) {
  const searchParams = useSearchParams();
  const { t } = useLocalizedScreen();
  const { requests, loading, errorMessage, refreshRequests } =
    useAdminAccessRequests();
  const { preferences } = usePlatformAdminPreferences();
  const [activeTab, setActiveTab] = useState<AccessRequestFilterTab | null>(
    null,
  );
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);
  const highlightedRequestId = Number(searchParams.get("requestId")) || null;

  const highlightedRequest = useMemo(
    () =>
      highlightedRequestId
        ? (requests.find((request) => request.id === highlightedRequestId) ??
          null)
        : null,
    [highlightedRequestId, requests],
  );

  const currentActiveTab =
    activeTab ??
    highlightedRequest?.status ??
    preferences.defaultAccessRequestsTab;

  const {
    advancedFilters,
    filteredRequests,
    industryOptions,
    locationOptions,
    reviewerOptions,
    savedViews,
    activeSavedViewId,
    saveViewName,
    setSaveViewName,
    handleAdvancedFilterChange,
    handleClearFilters,
    handleSaveCurrentView,
    handleApplySavedView: applySavedViewFromFilters,
    handleDeleteSavedView,
  } = useAccessRequestFilters({
    requests,
    currentActiveTab,
    t,
    setToastMessage,
  });

  useEffect(() => {
    if (loading || !highlightedRequestId) {
      return;
    }

    const target = document.getElementById(
      `access-request-${highlightedRequestId}`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedRequestId, loading]);

  async function handleReview(
    request: AccessRequest,
    decision: "Approved" | "Rejected",
    reason?: string,
  ) {
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/access-requests/${request.id}/review`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            decision,
            ...(reason ? { rejectionReason: reason } : {}),
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message ||
            errorBody?.detail ||
            `Unable to process request (${response.status})`,
        );
      }

      setDialog({ type: "none" });
      setRejectionReason("");
      setToastMessage(
        decision === "Approved"
          ? t("Approved access request from {{name}}.", {
              name: request.name,
            })
          : t("Rejected access request from {{name}}.", {
              name: request.name,
            }),
      );
      await refreshRequests();
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : t("Unable to process the review right now."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendSetupEmail(request: AccessRequest) {
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/access-requests/${request.id}/resend-setup-email`,
        { method: "POST" },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message || `Unable to resend email (${response.status})`,
        );
      }

      setToastMessage(
        t("Setup email resent to {{email}}.", {
          email: request.contactEmail,
        }),
      );
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : t("Unable to resend setup email right now."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleTabChange(nextTab: AccessRequestFilterTab) {
    setActiveTab(nextTab);
  }

  function handleApplySavedView(id: string) {
    const nextTab = applySavedViewFromFilters(id);
    if (nextTab) {
      setActiveTab(nextTab);
    }
  }

  return (
    <>
      <PlatformAdminLayout
        user={user}
        t={t}
        activeItemKey="Access requests"
        title={t("Access requests")}
        description={t(
          "Review incoming company access requests, approve verified organizations, and keep track of provisioning outcomes from one place.",
        )}
        sidebarNote={t(
          "This view handles incoming company onboarding requests and supports the full review workflow from pending to approved or rejected.",
        )}
        dataName="Admin Access Requests"
        dataNodeId="admin-access-requests"
      >
        <AccessRequestsReviewContent
          t={t}
          requests={requests}
          filteredRequests={filteredRequests}
          loading={loading}
          errorMessage={errorMessage}
          toastMessage={toastMessage}
          currentActiveTab={currentActiveTab}
          highlightedRequestId={highlightedRequestId}
          advancedFilters={advancedFilters}
          onFilterChange={handleAdvancedFilterChange}
          onTabChange={handleTabChange}
          onClearFilters={handleClearFilters}
          industryOptions={industryOptions}
          locationOptions={locationOptions}
          reviewerOptions={reviewerOptions}
          savedViews={savedViews}
          activeSavedViewId={activeSavedViewId}
          saveViewName={saveViewName}
          onSaveViewNameChange={setSaveViewName}
          onSaveCurrentView={handleSaveCurrentView}
          onApplySavedView={handleApplySavedView}
          onDeleteSavedView={handleDeleteSavedView}
          onApproveRequest={(request) =>
            setDialog({ type: "approve", request })
          }
          onRejectRequest={(request) => {
            setRejectionReason("");
            setDialog({ type: "reject", request });
          }}
          onResendSetupEmail={handleResendSetupEmail}
        />
      </PlatformAdminLayout>

      {dialog.type === "approve" ? (
        <AccessRequestReviewDialog
          t={t}
          title={t("Approve access request")}
          description={t(
            "Approve {{name}} and trigger company provisioning for {{contactEmail}}.",
            {
              name: dialog.request.name,
              contactEmail: dialog.request.contactEmail,
            },
          )}
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={() => handleReview(dialog.request, "Approved")}
          confirmLabel="Approve request"
          confirmClassName="bg-[#00a63e] hover:bg-[#008b35]"
          submitting={submitting}
        >
          <div className="rounded-[12px] border border-[#bedbff] bg-[#eff6ff] p-4 text-sm leading-[22.75px] tracking-[-0.1504px] text-[#193cb8]">
            {t(
              "The request will be marked as approved and the backend will continue with provisioning based on the submitted company details.",
            )}
          </div>
        </AccessRequestReviewDialog>
      ) : null}

      {dialog.type === "reject" ? (
        <AccessRequestReviewDialog
          t={t}
          title={t("Reject access request")}
          description={t(
            "Reject {{name}}. You can optionally save a short reason for the decision.",
            {
              name: dialog.request.name,
            },
          )}
          onCancel={() => {
            setDialog({ type: "none" });
            setRejectionReason("");
          }}
          onConfirm={() =>
            handleReview(
              dialog.request,
              "Rejected",
              rejectionReason.trim() || undefined,
            )
          }
          confirmLabel="Reject request"
          confirmClassName="bg-[#dc2626] hover:bg-[#b91c1c]"
          submitting={submitting}
        >
          <label className="block">
            <span className="text-sm font-semibold text-neutral-900">
              {t("Rejection reason")}
            </span>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-[12px] border border-neutral-300 px-4 py-3 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:border-blue-600 focus:outline-none"
              placeholder={t("Optional reason for rejecting this request")}
            />
          </label>
        </AccessRequestReviewDialog>
      ) : null}
    </>
  );
}

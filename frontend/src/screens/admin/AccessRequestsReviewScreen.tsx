"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InfoIcon } from "@/components/auth/icons";
import { AccessRequestReviewCard } from "@/components/admin/access-requests/AccessRequestReviewCard";
import { AccessRequestReviewDialog } from "@/components/admin/access-requests/AccessRequestReviewDialog";
import { AccessRequestsFilterTabs } from "@/components/admin/access-requests/AccessRequestsFilterTabs";
import { AccessRequestsMetricCard } from "@/components/admin/access-requests/AccessRequestsMetricCard";
import { PlatformAdminLayout } from "@/components/admin/platform/PlatformAdminLayout";
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

  useEffect(() => {
    if (loading || !highlightedRequestId) {
      return;
    }

    const target = document.getElementById(
      `access-request-${highlightedRequestId}`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedRequestId, loading]);

  const filteredRequests =
    currentActiveTab === "All"
      ? requests
      : requests.filter((request) => request.status === currentActiveTab);

  const pendingCount = requests.filter(
    (request) => request.status === "Pending",
  ).length;
  const approvedCount = requests.filter(
    (request) => request.status === "Approved",
  ).length;
  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected",
  ).length;

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
            onChange={setActiveTab}
            requests={requests}
            t={t}
          />
        </section>

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
                onApprove={() => setDialog({ type: "approve", request })}
                onReject={() => {
                  setRejectionReason("");
                  setDialog({ type: "reject", request });
                }}
              />
            ))}
          </section>
        ) : null}
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

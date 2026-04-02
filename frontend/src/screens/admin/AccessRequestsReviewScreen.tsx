"use client";

import { useCallback, useEffect, useState } from "react";
import { InfoIcon } from "@/components/auth/icons";
import { AccessRequestReviewCard } from "@/components/admin/access-requests/AccessRequestReviewCard";
import { AccessRequestReviewDialog } from "@/components/admin/access-requests/AccessRequestReviewDialog";
import { AccessRequestsFilterTabs } from "@/components/admin/access-requests/AccessRequestsFilterTabs";
import { AccessRequestsMetricCard } from "@/components/admin/access-requests/AccessRequestsMetricCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { AuthenticatedUser } from "@/types/auth";
import type { AccessRequest, AccessRequestFilterTab } from "@/types/admin";

type DialogState =
  | { type: "none" }
  | { type: "approve"; request: AccessRequest }
  | { type: "reject"; request: AccessRequest };

type AccessRequestsReviewScreenProps = {
  user: AuthenticatedUser;
};

function getReviewToastMessage(
  request: AccessRequest,
  decision: "Approved" | "Rejected",
): string {
  if (decision === "Approved") {
    return `Approved access request from ${request.name}. They can sign in using their email address as the initial password.`;
  }

  return `Rejected access request from ${request.name}.`;
}

export function AccessRequestsReviewScreen({
  user,
}: AccessRequestsReviewScreenProps) {
  const { t } = useLocalizedScreen();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AccessRequestFilterTab>("Pending");
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/access-requests", {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message ||
            errorBody?.detail ||
            `Failed to load access requests (${response.status})`,
        );
      }

      const data = (await response.json()) as AccessRequest[];
      setRequests(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load access requests right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filteredRequests =
    activeTab === "All"
      ? requests
      : requests.filter((request) => request.status === activeTab);

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
      setToastMessage(getReviewToastMessage(request, decision));
      await fetchRequests();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to process the review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-[#f5f5f5]"
      data-name="Admin Access Requests"
      data-node-id="admin-access-requests"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar t={t} activeItemKey="Access requests" showAdminTab />

        <div className="min-w-0 flex-1">
          <DashboardHeader t={t} user={user} />

          <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
            <section className="rounded-[18px] border border-neutral-200 bg-white p-6 shadow-[0_25px_50px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-[760px]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#bedbff] bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#1c398e]">
                    <InfoIcon className="h-4 w-4" />
                    Platform administration
                  </div>
                  <h1 className="mt-4 text-[28px] font-bold leading-9 tracking-[-0.4492px] text-neutral-900">
                    Access requests
                  </h1>
                  <p className="mt-3 text-sm leading-[24px] tracking-[-0.1504px] text-neutral-600">
                    Review incoming company access requests, approve verified
                    organizations, and keep track of provisioning outcomes from
                    one place.
                  </p>
                </div>

                <div className="rounded-[14px] border border-[#fde68a] bg-[#fff8db] px-4 py-3 text-sm text-[#92400e] shadow-[0_10px_15px_rgba(0,0,0,0.08),0_4px_6px_rgba(0,0,0,0.08)]">
                  <p className="font-semibold">{pendingCount} pending review</p>
                  <p className="mt-1 leading-[22.75px] tracking-[-0.1504px]">
                    Prioritize pending companies to unblock onboarding and
                    access.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AccessRequestsMetricCard
                title="Pending review"
                value={pendingCount}
                status="Pending"
              />
              <AccessRequestsMetricCard
                title="Approved requests"
                value={approvedCount}
                status="Approved"
              />
              <AccessRequestsMetricCard
                title="Rejected requests"
                value={rejectedCount}
                status="Rejected"
              />
              <AccessRequestsMetricCard
                title="Total requests"
                value={requests.length}
                status="All"
              />
            </section>

            <section className="mt-6">
              <div className="mb-4 rounded-[12px] border border-[#bedbff] bg-[#eff6ff] px-4 py-3 text-sm text-[#193cb8]">
                Approve verified companies to continue provisioning. Reject only
                when the request does not meet access requirements.
              </div>

              <AccessRequestsFilterTabs
                activeTab={activeTab}
                onChange={setActiveTab}
                requests={requests}
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
                Loading access requests...
              </div>
            ) : null}

            {!loading && filteredRequests.length === 0 ? (
              <div className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
                <p className="text-lg font-semibold text-neutral-900">
                  No access requests found
                </p>
                <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
                  There are no requests in the <strong>{activeTab}</strong> view
                  right now.
                </p>
              </div>
            ) : null}

            {!loading && filteredRequests.length > 0 ? (
              <section className="mt-6 space-y-4">
                {filteredRequests.map((request) => (
                  <AccessRequestReviewCard
                    key={request.id}
                    request={request}
                    onApprove={() => setDialog({ type: "approve", request })}
                    onReject={() => {
                      setRejectionReason("");
                      setDialog({ type: "reject", request });
                    }}
                  />
                ))}
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {dialog.type === "approve" ? (
        <AccessRequestReviewDialog
          title="Approve access request"
          description={`Approve ${dialog.request.name} and trigger company provisioning for ${dialog.request.contactEmail}.`}
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={() => handleReview(dialog.request, "Approved")}
          confirmLabel="Approve request"
          confirmClassName="bg-[#00a63e] hover:bg-[#008b35]"
          submitting={submitting}
        >
          <div className="rounded-[12px] border border-[#bedbff] bg-[#eff6ff] p-4 text-sm leading-[22.75px] tracking-[-0.1504px] text-[#193cb8]">
            The request will be marked as approved and the backend will continue
            with provisioning based on the submitted company details.
          </div>
        </AccessRequestReviewDialog>
      ) : null}

      {dialog.type === "reject" ? (
        <AccessRequestReviewDialog
          title="Reject access request"
          description={`Reject ${dialog.request.name}. You can optionally save a short reason for the decision.`}
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
              Rejection reason
            </span>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-[12px] border border-neutral-300 px-4 py-3 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] focus:border-blue-600 focus:outline-none"
              placeholder="Optional reason for rejecting this request"
            />
          </label>
        </AccessRequestReviewDialog>
      ) : null}
    </main>
  );
}

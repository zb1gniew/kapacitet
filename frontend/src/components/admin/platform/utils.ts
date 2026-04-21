import type {
  AccessRequest,
  AuditTimelineEvent,
  CompanyRegistryRecord,
} from "@/types/admin";

export function formatPlatformDate(value?: string): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatPlatformDateTime(value?: string): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function deriveCompanyRegistryRecords(
  requests: AccessRequest[],
): CompanyRegistryRecord[] {
  const sortedRecords = requests
    .filter((request) => request.status === "Approved")
    .map((request) => ({
      requestId: request.id,
      companyName: request.name,
      categories: request.categories,
      location: request.location,
      contactEmail: request.contactEmail,
      status: request.provisionedCompanyId
        ? ("Provisioned" as const)
        : ("Needs follow-up" as const),
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
      provisionedCompanyId: request.provisionedCompanyId,
    }))
    .sort((left, right) => {
      const leftTime = new Date(left.reviewedAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.reviewedAt ?? right.createdAt).getTime();
      return rightTime - leftTime;
    });

  const seenRegistryEntries = new Set<string>();

  return sortedRecords.filter((record) => {
    const key = record.provisionedCompanyId
      ? `company-${record.provisionedCompanyId}`
      : `request-${record.requestId}`;

    if (seenRegistryEntries.has(key)) {
      return false;
    }

    seenRegistryEntries.add(key);
    return true;
  });
}

export function deriveAuditTimelineEvents(
  requests: AccessRequest[],
): AuditTimelineEvent[] {
  return requests
    .flatMap((request) => {
      const events: AuditTimelineEvent[] = [
        {
          id: `submission-${request.id}`,
          timestamp: request.createdAt,
          type: "Submission",
          requestId: request.id,
          companyName: request.name,
          contactEmail: request.contactEmail,
          summary: "Access request submitted",
          detail: `${request.name} submitted a new company access request.`,
        },
      ];

      if (request.reviewedAt && request.status === "Approved") {
        events.push({
          id: `approval-${request.id}`,
          timestamp: request.reviewedAt,
          type: "Approval",
          requestId: request.id,
          companyName: request.name,
          contactEmail: request.contactEmail,
          actor: request.reviewedBy,
          summary: "Access request approved",
          detail: `${request.name} was approved for platform onboarding.`,
          provisionedCompanyId: request.provisionedCompanyId,
        });
      }

      if (request.reviewedAt && request.status === "Rejected") {
        events.push({
          id: `rejection-${request.id}`,
          timestamp: request.reviewedAt,
          type: "Rejection",
          requestId: request.id,
          companyName: request.name,
          contactEmail: request.contactEmail,
          actor: request.reviewedBy,
          summary: "Access request rejected",
          detail: request.rejectionReason
            ? `Rejected with note: ${request.rejectionReason}`
            : `${request.name} was rejected during review.`,
        });
      }

      if (
        request.reviewedAt &&
        request.status === "Approved" &&
        request.provisionedCompanyId
      ) {
        events.push({
          id: `provisioning-${request.id}`,
          timestamp: request.reviewedAt,
          type: "Provisioning",
          requestId: request.id,
          companyName: request.name,
          contactEmail: request.contactEmail,
          actor: request.reviewedBy,
          summary: "Company linked to approved request",
          detail: `Provisioned company ID ${request.provisionedCompanyId} is linked to the approved request.`,
          provisionedCompanyId: request.provisionedCompanyId,
        });
      }

      return events;
    })
    .sort((left, right) => {
      const leftTime = new Date(left.timestamp).getTime();
      const rightTime = new Date(right.timestamp).getTime();
      return rightTime - leftTime;
    });
}

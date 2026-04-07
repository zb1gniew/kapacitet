export type AccessRequest = {
  id: number;
  name: string;
  industry: string;
  location: string;
  contactEmail: string;
  message?: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  provisionedCompanyId?: number;
  rejectionReason?: string;
};

export type AccessRequestFilterTab =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "All";

export type CompanyRegistryStatus = "Provisioned" | "Needs follow-up";

export type CompanyRegistryRecord = {
  requestId: number;
  companyName: string;
  industry: string;
  location: string;
  contactEmail: string;
  status: CompanyRegistryStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  provisionedCompanyId?: number;
};

export type CompanyRegistryFilterTab =
  | "All"
  | "Provisioned"
  | "Needs follow-up";

export type AuditEventType =
  | "Submission"
  | "Approval"
  | "Rejection"
  | "Provisioning";

export type AuditEventFilterTab =
  | "All"
  | "Submissions"
  | "Decisions"
  | "Provisioning";

export type AuditTimelineEvent = {
  id: string;
  timestamp: string;
  type: AuditEventType;
  requestId: number;
  companyName: string;
  contactEmail: string;
  actor?: string;
  summary: string;
  detail: string;
  provisionedCompanyId?: number;
};

export type PlatformAdminPreferences = {
  defaultAccessRequestsTab: AccessRequestFilterTab;
  defaultAuditFilter: AuditEventFilterTab;
  prioritizeFollowUpCompanies: boolean;
  highlightProvisioningAlerts: boolean;
};

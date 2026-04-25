import type { AccessRequestFilterTab } from "@/types/admin";

export type AccessRequestDateField = "Submitted" | "Reviewed";

export type AccessRequestRejectionReasonFilter =
  | "All"
  | "With reason"
  | "Without reason";

export type AccessRequestProvisioningFilter = "All" | "Linked" | "Not linked";

export type AccessRequestAdvancedFilters = {
  search: string;
  industry: string;
  location: string;
  reviewer: string;
  dateField: AccessRequestDateField;
  fromDate: string;
  toDate: string;
  rejectionReason: AccessRequestRejectionReasonFilter;
  provisioningLink: AccessRequestProvisioningFilter;
};

export type SavedAccessRequestView = {
  id: string;
  name: string;
  tab: AccessRequestFilterTab;
  filters: AccessRequestAdvancedFilters;
};

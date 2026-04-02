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

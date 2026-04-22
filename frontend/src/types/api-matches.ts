export type MatchStatus =
  | "PendingRequesterReview"
  | "RequesterDeclined"
  | "PendingSupplierConfirmation"
  | "SupplierDeclined"
  | "AgreementCreated"
  | "Expired"
  | "Withdrawn";

export const MATCH_STATUS = {
  PendingRequesterReview: "PendingRequesterReview",
  RequesterDeclined: "RequesterDeclined",
  PendingSupplierConfirmation: "PendingSupplierConfirmation",
  SupplierDeclined: "SupplierDeclined",
  AgreementCreated: "AgreementCreated",
  Expired: "Expired",
  Withdrawn: "Withdrawn",
} as const;

export type MatchPerspective = "Requester" | "Supplier";
export type MatchUrgency = "Low" | "Medium" | "High" | "Critical";

export type MatchOfferResponse = {
  id: number;
  requestId: number;
  availabilityId: number;
  perspective: MatchPerspective;
  status: MatchStatus;
  offeredQuantity: number;
  requestQuantity: number;
  availabilityQuantity: number;
  matchScore: number;
  skillScore: number;
  certificateScore: number;
  dateScore: number;
  locationScore: number;
  quantityScore: number;
  coversFullPeriod: boolean;
  isPartial: boolean;
  locationCity: string;
  requestLocationCity: string;
  requestLocationRadiusKm: number;
  availabilityLocationCity: string;
  availabilityLocationRadiusKm: number;
  requestUrgency: MatchUrgency;
  requestStartDate: string;
  requestEndDate: string;
  availabilityStartDate: string;
  availabilityEndDate: string;
  createdAt: string;
  expiresAt: string;
  explanation: string;
  partnerCompanyName: string | null;
  partnerCompanyId: number | null;
  skills: string[];
  certificates: string[];
};

export type AgreementStatus = "Active" | "Completed" | "Cancelled";

export const AGREEMENT_STATUS = {
  Active: "Active",
  Completed: "Completed",
  Cancelled: "Cancelled",
} as const;

export type AgreementResponse = {
  id: number;
  matchOfferId: number;
  requestId: number;
  availabilityId: number;
  partnerCompanyId: number | null;
  partnerCompanyName: string | null;
  partnerCvr: string | null;
  partnerContactPhone: string | null;
  partnerContactEmail: string | null;
  supplierCompanyId: number;
  supplierCompanyName: string;
  requesterCompanyId: number;
  requesterCompanyName: string;
  startDate: string;
  endDate: string;
  quantity: number;
  status: AgreementStatus;
  createdAt: string;
  confirmedAt: string;
};

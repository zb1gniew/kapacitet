export type ListingStatus =
  | "Draft"
  | "Active"
  | "Fulfilled"
  | "Cancelled"
  | "Expired";

export type MatchOfferStatus =
  | "PendingRequesterReview"
  | "RequesterDeclined"
  | "PendingSupplierConfirmation"
  | "SupplierDeclined"
  | "AgreementCreated"
  | "Expired"
  | "Withdrawn";

export type ExperienceLevel = "junior" | "mid" | "senior" | null;
export type RequestUrgency = "Medium" | "High" | string;

export type AvailabilityDeclarationResponse = {
  id: number;
  companyId: number;
  resourceType: string;
  startDate: string;
  endDate: string;
  locationCity: string;
  locationRadiusKm: number;
  quantity: number;
  experienceLevel: ExperienceLevel;
  status: ListingStatus;
  createdAt: string;
  publishedAt: string | null;
  skills: string[];
  certificates: string[];
};

export type CapacityRequestResponse = {
  id: number;
  companyId: number;
  resourceType: string;
  startDate: string;
  endDate: string;
  locationCity: string;
  locationRadiusKm: number;
  quantity: number;
  experienceLevel: ExperienceLevel;
  urgency: RequestUrgency;
  status: ListingStatus;
  createdAt: string;
  publishedAt: string | null;
  skills: string[];
  certificates: string[];
};

export type MatchOfferResponse = {
  id: number;
  requestId: number;
  availabilityId: number;
  perspective: string;
  status: MatchOfferStatus;
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
  requestStartDate: string;
  requestEndDate: string;
  availabilityStartDate: string;
  availabilityEndDate: string;
  createdAt: string;
  expiresAt: string | null;
  explanation: string | null;
  partnerCompanyName: string | null;
  partnerCompanyId: number | null;
  skills: string[];
  certificates: string[];
};

export type AgreementResponse = {
  id: number;
  matchOfferId: number;
  requestId: number;
  availabilityId: number;
  supplierCompanyId: number;
  supplierCompanyName: string;
  requesterCompanyId: number;
  requesterCompanyName: string;
  startDate: string;
  endDate: string;
  quantity: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
};

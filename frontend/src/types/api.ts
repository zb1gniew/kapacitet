import type {
  AgreementResponse,
  AgreementStatus,
  MatchOfferResponse,
  MatchPerspective,
  MatchStatus,
} from "@/types/api-matches";

export type ListingStatus =
  | "Draft"
  | "Active"
  | "Fulfilled"
  | "Cancelled"
  | "Expired";

export type MatchOfferStatus = MatchStatus;

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

export type {
  AgreementResponse,
  AgreementStatus,
  MatchOfferResponse,
  MatchPerspective,
};

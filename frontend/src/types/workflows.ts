export type AccessRequestSuccess = {
  id: number;
  status: string;
};

export type AvailabilityDraft = {
  quantity: string;
  experienceLevel: "" | "junior" | "mid" | "senior";
  skillIds: number[];
  certificateIds: number[];
  startDate: string;
  endDate: string;
  locationCity: string;
  locationRadiusKm: number;
};

export type CapacityRequestDraft = {
  quantity: string;
  experienceLevel: "" | "junior" | "mid" | "senior";
  skillIds: number[];
  certificateIds: number[];
  startDate: string;
  endDate: string;
  locationCity: string;
  locationRadiusKm: number;
  urgency: "normal" | "urgent";
};

export type StoredDraft<T> = {
  _v: number;
  _createdAt: string;
  _clientKey: string;
  data: T;
};

export type NetworkEscalationStatus = "Open" | "Resolved" | "Expired";

export type NetworkResponseType = "CanHelp" | "NeedCapacity";

export type NetworkEscalationResponse = {
  id: number;
  requestId: number;
  triggeredAt: string;
  status: NetworkEscalationStatus;
  quantity: number;
  urgency: "Low" | "Medium" | "High" | "Critical";
  locationCity: string;
  locationRadiusKm: number;
  startDate: string;
  endDate: string;
  skills: string[];
  certificates: string[];
  totalResponses: number;
  helpResponses: number;
  needCapacityResponses: number;
  hasResponded: boolean;
  responseType: NetworkResponseType | null;
  respondedAt: string | null;
};

export type NotificationType =
  | "NewMatch"
  | "SupplierConfirmationRequest"
  | "UpcomingCooperation"
  | "NetworkEscalation"
  | "MatchDeadline"
  | "NewAccessRequest";

export type NotificationResponse = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata: string | null;
};

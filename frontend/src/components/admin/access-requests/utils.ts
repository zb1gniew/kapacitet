import type { AccessRequest, AccessRequestFilterTab } from "@/types/admin";

export function formatAccessRequestDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatAccessRequestDateTime(value?: string): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getAccessRequestStatusClasses(status: AccessRequest["status"]) {
  switch (status) {
    case "Approved":
      return "border-[#b9f8cf] bg-[#f0fdf4] text-[#016630]";
    case "Rejected":
      return "border-[#fecaca] bg-[#fff5f5] text-[#b91c1c]";
    default:
      return "border-[#fde68a] bg-[#fff8db] text-[#92400e]";
  }
}

export function getAccessRequestMetricClasses(status: AccessRequestFilterTab) {
  switch (status) {
    case "Approved":
      return {
        icon: "bg-[#dcfce7] text-[#00a63e]",
        value: "text-[#00a63e]",
      };
    case "Rejected":
      return {
        icon: "bg-[#fee2e2] text-[#dc2626]",
        value: "text-[#dc2626]",
      };
    case "Pending":
      return {
        icon: "bg-[#fff7ed] text-[#d97706]",
        value: "text-[#d97706]",
      };
    default:
      return {
        icon: "bg-[#dbeafe] text-[#1d4ed8]",
        value: "text-[#1d4ed8]",
      };
  }
}

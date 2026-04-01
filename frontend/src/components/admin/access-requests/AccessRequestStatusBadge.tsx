import type { AccessRequest } from "@/types/admin";
import { getAccessRequestStatusClasses } from "./utils";

type AccessRequestStatusBadgeProps = {
  status: AccessRequest["status"];
};

export function AccessRequestStatusBadge({
  status,
}: AccessRequestStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold ${getAccessRequestStatusClasses(
        status,
      )}`}
    >
      {status}
    </span>
  );
}

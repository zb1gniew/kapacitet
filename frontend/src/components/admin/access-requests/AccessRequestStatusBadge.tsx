import type { AccessRequest } from "@/types/admin";
import type { TranslateFn } from "@/types/i18n";
import { getAccessRequestStatusClasses } from "./utils";

type AccessRequestStatusBadgeProps = {
  status: AccessRequest["status"];
  t: TranslateFn;
};

export function AccessRequestStatusBadge({
  status,
  t,
}: AccessRequestStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold ${getAccessRequestStatusClasses(
        status,
      )}`}
    >
      {t(status)}
    </span>
  );
}

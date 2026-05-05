import type { ReactNode } from "react";
import { InfoIcon } from "@/components/auth/icons";

type PermissionNoticeProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PermissionNotice({
  title,
  description,
  children,
}: PermissionNoticeProps) {
  return (
    <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 leading-5">{description}</p>
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

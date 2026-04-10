import { CheckBadgeIcon, ClockIcon, UsersIcon } from "@/components/auth/icons";
import { formatDateRange, formatRelativeTime } from "@/lib/matches/derive";
import type { AgreementResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";

type MatchesAgreementCardProps = {
  agreement: AgreementResponse;
  partnerName?: string | null;
  t: TranslateFn;
};

export function MatchesAgreementCard({
  agreement,
  partnerName,
  t,
}: MatchesAgreementCardProps) {
  return (
    <article className="rounded-[14px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#16a34a] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
          <UsersIcon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold leading-6 tracking-[-0.3125px] text-neutral-900">
              {`${agreement.quantity} Workers`}
            </h3>
            <span className="rounded-[8px] border border-[#86efac] bg-[#dcfce7] px-2.5 py-0.5 text-xs font-bold text-[#166534]">
              {t("Agreement active")}
            </span>
          </div>

          <p className="mt-2 text-sm leading-5 tracking-[-0.1504px] text-neutral-700">
            {partnerName
              ? `${t("Partner")}: ${partnerName}`
              : t("Partner confirmed")}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-4 text-xs leading-4 text-neutral-600">
            <p className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-3 w-3" />
              <span>
                {formatDateRange(agreement.startDate, agreement.endDate)}
              </span>
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckBadgeIcon className="h-3 w-3" />
              <span>
                {`${t("Confirmed")} ${formatRelativeTime(agreement.confirmedAt)}`}
              </span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

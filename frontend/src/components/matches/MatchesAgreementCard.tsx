import {
  CheckBadgeIcon,
  ClockIcon,
  EmailIcon,
  UsersIcon,
} from "@/components/auth/icons";
import { formatDateRange, formatRelativeTime } from "@/lib/matches/derive";
import type { AgreementResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";

type MatchesAgreementCardProps = {
  agreement: AgreementResponse;
  highlighted?: boolean;
  t: TranslateFn;
};

export function MatchesAgreementCard({
  agreement,
  highlighted = false,
  t,
}: MatchesAgreementCardProps) {
  return (
    <article
      id={`agreement-${agreement.id}`}
      className={`rounded-[14px] border bg-[#f0fdf4] px-4 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition ${
        highlighted
          ? "border-[#2563eb] ring-2 ring-[#93c5fd]"
          : "border-[#bbf7d0]"
      }`}
    >
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
            {agreement.partnerCompanyName
              ? `${t("Partner")}: ${agreement.partnerCompanyName}`
              : t("Partner confirmed")}
          </p>

          <div className="mt-3 rounded-[12px] border border-[#86efac] bg-white/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#166534] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                {t("Next step")}
              </span>
              <p className="text-sm font-semibold leading-5 text-[#166534]">
                {t(
                  "Contact the partner now to finalize documents and start coordination.",
                )}
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {agreement.partnerContactPhone ? (
                <div className="rounded-[10px] border border-neutral-200 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
                    {t("Phone")}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-neutral-900">
                    {agreement.partnerContactPhone}
                  </p>
                </div>
              ) : null}
              {agreement.partnerContactEmail ? (
                <div className="rounded-[10px] border border-neutral-200 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <EmailIcon className="h-3.5 w-3.5" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em]">
                      {t("Email")}
                    </p>
                  </div>
                  <p className="mt-1 break-all text-sm font-semibold leading-5 text-neutral-900">
                    {agreement.partnerContactEmail}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

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

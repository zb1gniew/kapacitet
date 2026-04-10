import {
  CheckBadgeIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/auth/icons";
import { formatDateRange, formatMatchTitle } from "@/lib/matches/derive";
import type { MatchOfferResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";

type MatchesAwaitingConfirmationCardProps = {
  offer: MatchOfferResponse;
  t: TranslateFn;
};

export function MatchesAwaitingConfirmationCard({
  offer,
  t,
}: MatchesAwaitingConfirmationCardProps) {
  const description =
    offer.perspective === "Requester"
      ? "You accepted this offer. The capacity provider is reviewing your request and will confirm or decline within 48 hours."
      : "Your availability was matched. The requesting company is reviewing the offer.";

  return (
    <article className="rounded-[14px] border border-[#ffd230] bg-[#fffbeb] px-4 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#fe9a00] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]">
          <UsersIcon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold leading-6 tracking-[-0.3125px] text-neutral-900">
              {formatMatchTitle(offer)}
            </h3>
            <span className="rounded-[8px] border border-[#e17100] bg-[#fe9a00] px-2.5 py-0.5 text-xs font-bold text-white">
              {t("Awaiting confirmation")}
            </span>
          </div>

          <p className="mt-2 text-sm leading-5 tracking-[-0.1504px] text-neutral-700">
            {t(description)}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-4 text-xs leading-4 text-neutral-600">
            <p className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-3 w-3" />
              <span>
                {formatDateRange(offer.requestStartDate, offer.requestEndDate)}
              </span>
            </p>
            <p className="inline-flex items-center gap-1.5">
              <MapPinIcon className="h-3 w-3" />
              <span>{offer.locationCity}</span>
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckBadgeIcon className="h-3 w-3" />
              <span>{`${offer.certificates.length} certificates verified`}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

import { useState } from "react";
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
  highlighted?: boolean;
  t: TranslateFn;
};

export function MatchesAwaitingConfirmationCard({
  offer,
  highlighted = false,
  t,
}: MatchesAwaitingConfirmationCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const description =
    offer.perspective === "Requester"
      ? "You accepted this offer. The capacity provider is reviewing your request and will confirm or decline within 48 hours."
      : "Your availability was matched. The requesting company is reviewing the offer.";

  return (
    <article
      id={`match-offer-${offer.id}`}
      className={`rounded-[14px] border bg-[#fffbeb] px-4 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] transition ${
        highlighted
          ? "border-[#2563eb] ring-2 ring-[#93c5fd]"
          : "border-[#ffd230]"
      }`}
    >
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

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDetails((current) => !current)}
              className="h-10 rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
            >
              {t(showDetails ? "Hide details" : "Review details")}
            </button>
          </div>

          {showDetails ? (
            <div className="mt-4 rounded-[12px] border border-[#fde68a] bg-white/70 px-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
                    {t("Skills")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {offer.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-[8px] bg-white px-2 py-1 text-xs font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
                    {t("Offer summary")}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-neutral-700">
                    <li>{`${t("Offered quantity")}: ${offer.offeredQuantity}`}</li>
                    <li>{`${t("Perspective")}: ${t(offer.perspective)}`}</li>
                    <li>{`${t("Status")}: ${t(offer.status)}`}</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
                  {t("Matching explanation")}
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  {offer.explanation}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

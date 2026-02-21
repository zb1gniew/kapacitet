import {
  CheckBadgeIcon,
  ClockIcon,
  InfoIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";
import type { DirectMatchOffer } from "@/types/matches";
import { CheckIcon, XMarkIcon } from "./icons";

type MatchesOfferCardProps = {
  offer: DirectMatchOffer;
  acceptanceNoticeKey: string;
  t: TranslateFn;
};

export function MatchesOfferCard({
  offer,
  acceptanceNoticeKey,
  t,
}: MatchesOfferCardProps) {
  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white px-3 py-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#dcfce7] text-[#00a63e]">
              <UsersIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold leading-6 tracking-[-0.3125px] text-neutral-900">
                  {t(offer.titleKey)}
                </h3>
                <span className="rounded-[8px] border border-[#b9f8cf] bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-semibold leading-4 text-[#016630]">
                  {t(offer.statusKey)}
                </span>
              </div>

              <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                {t(offer.updatedAtKey)}
                <span className="mx-1.5">·</span>
                {t(offer.validUntilKey)}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold leading-8 tracking-[0.0703px] text-[#00a63e]">
            {t(offer.scoreKey)}
          </p>
          <p className="text-xs font-medium text-neutral-500">{t("Match score")}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-neutral-100 pt-3 text-sm sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <ClockIcon className="h-3 w-3" />
            {t("Availability")}
          </p>
          <p className="mt-1 leading-5 tracking-[-0.1504px] text-neutral-900">
            {t(offer.availabilityValueKey)}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <MapPinIcon className="h-3 w-3" />
            {t("Location")}
          </p>
          <p className="mt-1 leading-5 tracking-[-0.1504px] text-neutral-900">
            {t(offer.locationValueKey)}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <CheckBadgeIcon className="h-3 w-3" />
            {t("Certificates")}
          </p>
          <p className="mt-1 leading-5 tracking-[-0.1504px] text-neutral-900">
            {t(offer.certificatesValueKey)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {offer.certificateKeys.map((certificateKey) => (
          <span
            key={certificateKey}
            className="inline-flex items-center gap-1 rounded-[8px] border border-[#b9f8cf] bg-[#f0fdf4] px-2 py-1 text-xs font-medium text-[#016630]"
          >
            <CheckBadgeIcon className="h-3 w-3" />
            {t(certificateKey)}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="h-10 flex-1 rounded-[10px] border border-neutral-300 bg-white text-sm font-semibold tracking-[-0.1504px] text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
        >
          {t("Review details")}
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-1 rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>{t("Decline")}</span>
        </button>

        <button
          type="button"
          className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#00a63e] px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]"
        >
          <CheckIcon className="h-4 w-4" />
          <span>{t("Accept offer")}</span>
        </button>
      </div>

      <div className="mt-2.5 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-3 py-2">
        <p className="flex items-start gap-2 text-[11px] leading-[16px] text-[#193cb8]">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t(acceptanceNoticeKey)}</span>
        </p>
      </div>
    </article>
  );
}

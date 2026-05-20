import { formatDateRange } from "@/lib/matches/derive";
import type { MatchOfferResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";
import { XMarkIcon } from "../icons";
import {
  CertificatesSection,
  DateOverlapSection,
  LocationSection,
  QuantitySection,
  ScoreSummarySection,
  SkillsSection,
  UrgencySection,
} from "./sections";
import { normalizeCity } from "./utils";

type MatchesWhyDrawerProps = {
  offer: MatchOfferResponse;
  open: boolean;
  onClose: () => void;
  t: TranslateFn;
};

export function MatchesWhyDrawer({
  offer,
  open,
  onClose,
  t,
}: MatchesWhyDrawerProps) {
  if (!open) return null;

  const requestRange = formatDateRange(
    t,
    offer.requestStartDate,
    offer.requestEndDate,
  );
  const availabilityRange = formatDateRange(
    t,
    offer.availabilityStartDate,
    offer.availabilityEndDate,
  );
  const sameCity =
    normalizeCity(offer.requestLocationCity) ===
    normalizeCity(offer.availabilityLocationCity);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172acc] backdrop-blur-sm">
      <div className="flex h-full justify-end">
        <button
          type="button"
          aria-label={t("Close")}
          className="hidden flex-1 cursor-default sm:block"
          onClick={onClose}
        />

        <aside className="flex h-full w-full max-w-[720px] flex-col border-l border-neutral-200 bg-[#f8fafc] shadow-[-24px_0_48px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 bg-white px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2563eb]">
                {t("Match reasoning")}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.4492px] text-neutral-900">
                {t("Why this match?")}
              </h2>
              <p className="mt-2 max-w-[520px] text-sm leading-6 text-neutral-600">
                {t(
                  "This view shows the main reasons this offer is a good fit, based on timing, location, required skills, certificates, urgency, and quantity.",
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-neutral-200 bg-white text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition hover:bg-neutral-50"
              aria-label={t("Close")}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <ScoreSummarySection
              offer={offer}
              requestRange={requestRange}
              availabilityRange={availabilityRange}
              t={t}
            />
            <DateOverlapSection
              offer={offer}
              requestRange={requestRange}
              availabilityRange={availabilityRange}
              t={t}
            />
            <LocationSection offer={offer} sameCity={sameCity} t={t} />
            <SkillsSection offer={offer} t={t} />
            <CertificatesSection offer={offer} t={t} />
            <QuantitySection offer={offer} t={t} />
            <UrgencySection offer={offer} t={t} />
          </div>
        </aside>
      </div>
    </div>
  );
}

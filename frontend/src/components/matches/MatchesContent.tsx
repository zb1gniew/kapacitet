import {
  MATCHES_ACCEPTANCE_NOTICE,
  MATCHES_ANONYMIZATION_NOTICE,
  MATCHES_AVAILABLE_OFFERS,
  MATCHES_AWAITING_CONFIRMATION_OFFER,
} from "@/constants/matches";
import type { TranslateFn } from "@/types/i18n";
import { MatchesAwaitingConfirmationCard } from "./MatchesAwaitingConfirmationCard";
import { MatchesInfoBanner } from "./MatchesInfoBanner";
import { MatchesOfferCard } from "./MatchesOfferCard";
import { MatchesSummaryCards } from "./MatchesSummaryCards";

type MatchesContentProps = {
  t: TranslateFn;
};

export function MatchesContent({ t }: MatchesContentProps) {
  return (
    <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
          {t("Matches")}
        </h1>
      </header>

      <MatchesInfoBanner noticeKey={MATCHES_ANONYMIZATION_NOTICE} t={t} />
      <MatchesSummaryCards t={t} />

      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold leading-6 tracking-[-0.1504px] text-neutral-900">
            {t("Available matches")}
          </h2>
          <p className="text-xs leading-4 text-neutral-500">{t("3 offers")}</p>
        </div>

        <div className="space-y-3">
          {MATCHES_AVAILABLE_OFFERS.map((offer) => (
            <MatchesOfferCard
              key={offer.id}
              offer={offer}
              acceptanceNoticeKey={MATCHES_ACCEPTANCE_NOTICE}
              t={t}
            />
          ))}
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold leading-6 tracking-[-0.3125px] text-neutral-900">
            {t("Awaiting supplier confirmation")}
          </h2>
          <p className="text-sm leading-5 tracking-[-0.1504px] text-neutral-500">
            {t("1 pending")}
          </p>
        </div>

        <MatchesAwaitingConfirmationCard offer={MATCHES_AWAITING_CONFIRMATION_OFFER} t={t} />
      </section>
    </div>
  );
}

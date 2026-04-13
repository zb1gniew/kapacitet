import Link from "next/link";
import { MATCHES_ANONYMIZATION_NOTICE } from "@/constants/matches";
import { APP_ROUTES } from "@/constants/routes";
import {
  deriveAwaitingOffers,
  deriveRequesterPendingOffers,
  deriveSupplierPendingOffers,
} from "@/lib/matches/derive";
import {
  AGREEMENT_STATUS,
  type AgreementResponse,
  type MatchOfferResponse,
} from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";
import type { MatchesSummaryCardData } from "@/types/matches";
import { MatchesAgreementCard } from "./MatchesAgreementCard";
import { MatchesAwaitingConfirmationCard } from "./MatchesAwaitingConfirmationCard";
import { MatchesInfoBanner } from "./MatchesInfoBanner";
import { MatchesOfferCard } from "./MatchesOfferCard";
import { MatchesSummaryCards } from "./MatchesSummaryCards";

type MatchesContentProps = {
  agreements: AgreementResponse[];
  highlightedAgreementId?: number | null;
  highlightedMatchId?: number | null;
  error: string | null;
  loading: boolean;
  matches: MatchOfferResponse[];
  summaryCards: MatchesSummaryCardData[];
  toastError?: string;
  onAccept: (matchId: number) => void | Promise<void>;
  onDecline: (matchId: number) => void | Promise<void>;
  onSupplierConfirm: (matchId: number) => void | Promise<void>;
  onSupplierDecline: (matchId: number) => void | Promise<void>;
  onRetry: () => void | Promise<void>;
  actionInProgress: number | null;
  t: TranslateFn;
};

export function MatchesContent({
  agreements,
  highlightedAgreementId,
  highlightedMatchId,
  error,
  loading,
  matches,
  summaryCards,
  toastError,
  onAccept,
  onDecline,
  onSupplierConfirm,
  onSupplierDecline,
  onRetry,
  actionInProgress,
  t,
}: MatchesContentProps) {
  const requesterPendingOffers = deriveRequesterPendingOffers(matches);
  const supplierPendingOffers = deriveSupplierPendingOffers(matches);
  const actionRequiredOffers = [
    ...requesterPendingOffers,
    ...supplierPendingOffers,
  ].sort((left, right) => right.matchScore - left.matchScore);
  const awaitingOffers = deriveAwaitingOffers(matches);
  const activeAgreements = agreements.filter(
    (agreement) => agreement.status === AGREEMENT_STATUS.Active,
  );
  const hasLoadedData = matches.length > 0 || agreements.length > 0;
  const showInitialLoading = loading && !hasLoadedData;
  const showRefreshing = loading && hasLoadedData;
  const showEmptyState = !loading && !error && !hasLoadedData;

  return (
    <div className="mx-auto w-full max-w-[1248px] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold leading-8 tracking-[0.0703px] text-neutral-900">
          {t("Matches")}
        </h1>
        {showRefreshing ? (
          <div className="inline-flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span>{t("Refreshing matches...")}</span>
          </div>
        ) : null}
      </header>

      {toastError ? (
        <div className="mt-4 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {toastError}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-[10px] border border-[#fca5a5] bg-white px-3 py-2 text-xs font-semibold text-[#b91c1c] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
          >
            {t("Try again")}
          </button>
        </div>
      ) : null}

      <MatchesInfoBanner noticeKey={MATCHES_ANONYMIZATION_NOTICE} t={t} />
      <MatchesSummaryCards
        loading={loading}
        summaryCards={summaryCards}
        t={t}
      />

      {showInitialLoading ? (
        <div className="mt-4 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          <div className="inline-flex items-center gap-3 text-sm text-neutral-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span>{t("Loading matches...")}</span>
          </div>
        </div>
      ) : null}

      {showEmptyState ? (
        <section className="mt-6 rounded-[14px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t("No matches yet")}
          </h2>
          <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 tracking-[-0.1504px] text-neutral-600">
            {t(
              "Matches will appear here once you publish availability declarations or capacity requests.",
            )}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={APP_ROUTES.declareAvailabilityWorkersStep1}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#00a63e] px-5 text-sm font-semibold text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]"
            >
              {t("Declare availability")}
            </Link>
            <Link
              href={APP_ROUTES.requestCapacityWorkersStep1}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
            >
              {t("Request capacity")}
            </Link>
          </div>
        </section>
      ) : null}

      {!showInitialLoading && !showEmptyState ? (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold leading-6 tracking-[-0.1504px] text-neutral-900">
              {t("Action required")}
            </h2>
            <p className="text-sm leading-5 tracking-[-0.1504px] text-neutral-500">
              {`${actionRequiredOffers.length} ${actionRequiredOffers.length === 1 ? "offer" : "offers"}`}
            </p>
          </div>

          <div className="space-y-3">
            {actionRequiredOffers.map((offer) => (
              <MatchesOfferCard
                key={offer.id}
                actionInProgress={actionInProgress}
                highlighted={highlightedMatchId === offer.id}
                offer={offer}
                onAccept={onAccept}
                onDecline={onDecline}
                onSupplierConfirm={onSupplierConfirm}
                onSupplierDecline={onSupplierDecline}
                t={t}
              />
            ))}
            {actionRequiredOffers.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                {t("No offers requiring your action right now.")}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {!showInitialLoading && !showEmptyState && awaitingOffers.length > 0 ? (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold leading-6 tracking-[-0.3125px] text-neutral-900">
              {t("Awaiting response")}
            </h2>
            <p className="text-sm leading-5 tracking-[-0.1504px] text-neutral-500">
              {`${awaitingOffers.length} pending`}
            </p>
          </div>

          <div className="space-y-3">
            {awaitingOffers.map((offer) => (
              <MatchesAwaitingConfirmationCard
                key={offer.id}
                highlighted={highlightedMatchId === offer.id}
                offer={offer}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!showInitialLoading && !showEmptyState && activeAgreements.length > 0 ? (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold leading-6 tracking-[-0.3125px] text-neutral-900">
              {t("Active agreements")}
            </h2>
            <p className="text-sm leading-5 tracking-[-0.1504px] text-neutral-500">
              {`${activeAgreements.length}`}
            </p>
          </div>

          <div className="space-y-3">
            {activeAgreements.map((agreement) => (
              <MatchesAgreementCard
                key={agreement.id}
                agreement={agreement}
                highlighted={highlightedAgreementId === agreement.id}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

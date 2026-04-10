import { useState } from "react";
import {
  CheckBadgeIcon,
  ClockIcon,
  InfoIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/auth/icons";
import { MATCHES_ACCEPTANCE_NOTICE } from "@/constants/matches";
import {
  formatDateRange,
  formatExpiresAt,
  formatMatchTitle,
  formatRelativeTime,
} from "@/lib/matches/derive";
import { MATCH_STATUS, type MatchOfferResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";
import { CheckIcon, XMarkIcon } from "./icons";

type MatchesOfferCardProps = {
  offer: MatchOfferResponse;
  onAccept: (matchId: number) => void | Promise<void>;
  onDecline: (matchId: number) => void | Promise<void>;
  onSupplierConfirm: (matchId: number) => void | Promise<void>;
  onSupplierDecline: (matchId: number) => void | Promise<void>;
  actionInProgress: number | null;
  t: TranslateFn;
};

export function MatchesOfferCard({
  offer,
  onAccept,
  onDecline,
  onSupplierConfirm,
  onSupplierDecline,
  actionInProgress,
  t,
}: MatchesOfferCardProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const isRequesterOffer =
    offer.perspective === "Requester" &&
    offer.status === MATCH_STATUS.PendingRequesterReview;
  const isSupplierOffer =
    offer.perspective === "Supplier" &&
    offer.status === MATCH_STATUS.PendingSupplierConfirmation;
  const isBusy = actionInProgress === offer.id || pendingAction !== null;
  const statusLabel = isRequesterOffer ? "Direct match" : "Confirmation needed";

  async function handleAction(
    nextAction: "accept" | "decline" | "supplier-confirm" | "supplier-decline",
  ) {
    setPendingAction(nextAction);

    try {
      if (nextAction === "accept") {
        await onAccept(offer.id);
        return;
      }

      if (nextAction === "decline") {
        await onDecline(offer.id);
        return;
      }

      if (nextAction === "supplier-confirm") {
        await onSupplierConfirm(offer.id);
        return;
      }

      await onSupplierDecline(offer.id);
    } finally {
      setPendingAction(null);
    }
  }

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
                  {formatMatchTitle(offer)}
                </h3>
                <span className="rounded-[8px] border border-[#b9f8cf] bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-semibold leading-4 text-[#016630]">
                  {t(statusLabel)}
                </span>
              </div>

              <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                {formatRelativeTime(offer.createdAt)}
                <span className="mx-1.5">·</span>
                {formatExpiresAt(offer.expiresAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold leading-8 tracking-[0.0703px] text-[#00a63e]">
            {`${offer.matchScore}%`}
          </p>
          <p className="text-xs font-medium text-neutral-500">
            {t("Match score")}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-neutral-100 pt-3 text-sm sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <ClockIcon className="h-3 w-3" />
            {t("Availability")}
          </p>
          <p className="mt-1 leading-5 tracking-[-0.1504px] text-neutral-900">
            {formatDateRange(
              offer.availabilityStartDate,
              offer.availabilityEndDate,
            )}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <MapPinIcon className="h-3 w-3" />
            {t("Location")}
          </p>
          <p className="mt-1 leading-5 tracking-[-0.1504px] text-neutral-900">
            {offer.locationCity}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <CheckBadgeIcon className="h-3 w-3" />
            {t("Certificates")}
          </p>
          <p className="mt-1 leading-5 tracking-[-0.1504px] text-neutral-900">
            {`${offer.certificates.length} verified`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {offer.certificates.map((certificate) => (
          <span
            key={certificate}
            className="inline-flex items-center gap-1 rounded-[8px] border border-[#b9f8cf] bg-[#f0fdf4] px-2 py-1 text-xs font-medium text-[#016630]"
          >
            <CheckBadgeIcon className="h-3 w-3" />
            {certificate}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="h-10 flex-1 rounded-[10px] border border-neutral-300 bg-white text-sm font-semibold tracking-[-0.1504px] text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]"
          disabled={isBusy}
        >
          {t("Review details")}
        </button>

        {isRequesterOffer ? (
          <>
            <button
              type="button"
              onClick={() => void handleAction("decline")}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "decline" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
              ) : (
                <XMarkIcon className="h-4 w-4" />
              )}
              <span>
                {t(pendingAction === "decline" ? "Processing..." : "Decline")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleAction("accept")}
              disabled={isBusy}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#00a63e] px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "accept" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              <span>
                {t(
                  pendingAction === "accept" ? "Processing..." : "Accept offer",
                )}
              </span>
            </button>
          </>
        ) : null}

        {isSupplierOffer ? (
          <>
            <button
              type="button"
              onClick={() => void handleAction("supplier-decline")}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-[10px] border border-neutral-300 bg-white px-4 text-sm font-semibold tracking-[-0.1504px] text-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "supplier-decline" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
              ) : (
                <XMarkIcon className="h-4 w-4" />
              )}
              <span>
                {t(
                  pendingAction === "supplier-decline"
                    ? "Processing..."
                    : "Decline",
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleAction("supplier-confirm")}
              disabled={isBusy}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#00a63e] px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "supplier-confirm" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              <span>
                {t(
                  pendingAction === "supplier-confirm"
                    ? "Processing..."
                    : "Confirm",
                )}
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-2.5 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] px-3 py-2">
        <p className="flex items-start gap-2 text-[11px] leading-[16px] text-[#193cb8]">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t(MATCHES_ACCEPTANCE_NOTICE)}</span>
        </p>
      </div>
    </article>
  );
}

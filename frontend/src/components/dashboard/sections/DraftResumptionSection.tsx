"use client";

import Link from "next/link";
import { useSavedDrafts } from "@/hooks/useSavedDrafts";
import type { TranslateFn } from "@/types/i18n";

type DraftResumptionSectionProps = {
  t: TranslateFn;
  userId: string;
};

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export function DraftResumptionSection({
  t,
  userId,
}: DraftResumptionSectionProps) {
  const { drafts, discardDraft } = useSavedDrafts(userId);

  if (drafts.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-2">
        {drafts.map((draft) => (
          <article
            key={draft.storageKey}
            className="relative rounded-[10px] border border-amber-200 bg-amber-50 p-4 shadow-[0_4px_6px_rgba(0,0,0,0.05)]"
          >
            <button
              onClick={() => discardDraft(draft.storageKey)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition hover:bg-amber-100 hover:text-neutral-600"
              aria-label={t("Discard draft")}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
                {t("Draft saved")}
              </span>
            </div>

            <h3 className="mt-2 text-base font-semibold tracking-[-0.3125px] text-neutral-900">
              {t(draft.titleKey)}
            </h3>

            <p className="mt-0.5 text-xs text-neutral-500">
              {t("Last edited")} {formatRelativeTime(draft.updatedAt)}
            </p>

            <Link
              href={draft.resumeHref}
              className="mt-4 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-[8px] border border-amber-300 bg-white px-4 text-xs font-medium text-neutral-900 shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition hover:bg-amber-50"
            >
              {t("Continue draft")}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6h8M6.5 2.5L10 6l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

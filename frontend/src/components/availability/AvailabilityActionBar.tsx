import Link from "next/link";
import type { TranslateFn } from "@/types/i18n";
import { ArrowLeftIcon, ArrowRightIcon, PublishIcon } from "./icons";

type NextButtonVariant = "muted" | "primary" | "success";

type AvailabilityActionBarProps = {
  t: TranslateFn;
  backHref?: string;
  backDisabled?: boolean;
  nextHref?: string;
  nextLabelKey: string;
  nextVariant?: NextButtonVariant;
};

function getNextButtonClass(variant: NextButtonVariant) {
  switch (variant) {
    case "success":
      return "bg-[#00a63e] text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] hover:bg-[#009137]";
    case "primary":
      return "bg-blue-600 text-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)] hover:bg-blue-700";
    default:
      return "bg-neutral-100 text-neutral-400";
  }
}

function isNextDisabled(variant: NextButtonVariant, href?: string) {
  if (!href) {
    return true;
  }

  return variant === "muted";
}

export function AvailabilityActionBar({
  t,
  backHref,
  backDisabled = false,
  nextHref,
  nextLabelKey,
  nextVariant = "primary",
}: AvailabilityActionBarProps) {
  const nextDisabled = isNextDisabled(nextVariant, nextHref);

  return (
    <div className="mt-8 flex items-center justify-between">
      {backHref && !backDisabled ? (
        <Link
          href={backHref}
          className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-neutral-200 px-6 text-base font-semibold tracking-[-0.3125px] text-neutral-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-neutral-300"
        >
          <ArrowLeftIcon className="h-[18px] w-[18px]" />
          {t("Back")}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-neutral-100 px-6 text-base font-semibold tracking-[-0.3125px] text-neutral-400"
        >
          <ArrowLeftIcon className="h-[18px] w-[18px]" />
          {t("Back")}
        </button>
      )}

      {nextDisabled || !nextHref ? (
        <button
          type="button"
          disabled
          className={`inline-flex h-12 items-center gap-2 rounded-[10px] px-6 text-base font-semibold tracking-[-0.3125px] ${getNextButtonClass(nextVariant)}`}
        >
          {nextVariant === "success" ? (
            <PublishIcon className="h-[18px] w-[18px]" />
          ) : null}
          {t(nextLabelKey)}
          {nextVariant === "success" ? null : (
            <ArrowRightIcon className="h-[18px] w-[18px]" />
          )}
        </button>
      ) : (
        <Link
          href={nextHref}
          className={`inline-flex h-12 items-center gap-2 rounded-[10px] px-6 text-base font-semibold tracking-[-0.3125px] transition ${getNextButtonClass(nextVariant)}`}
        >
          {nextVariant === "success" ? (
            <PublishIcon className="h-[18px] w-[18px]" />
          ) : null}
          {t(nextLabelKey)}
          {nextVariant === "success" ? null : (
            <ArrowRightIcon className="h-[18px] w-[18px]" />
          )}
        </Link>
      )}
    </div>
  );
}

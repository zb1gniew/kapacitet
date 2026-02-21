import { CircleCheckIcon } from "@/components/auth/icons";
import { MATCHES_SUMMARY_CARDS } from "@/constants/matches";
import type { TranslateFn } from "@/types/i18n";
import type { MatchesSummaryCard, MatchesSummaryCardTone } from "@/types/matches";
import { HourglassIcon, TrendUpIcon } from "./icons";

type MatchesSummaryCardsProps = {
  t: TranslateFn;
};

function getToneClasses(tone: MatchesSummaryCardTone) {
  switch (tone) {
    case "success":
      return {
        icon: "text-green-600",
      };
    case "warning":
      return {
        icon: "text-amber-500",
      };
    default:
      return {
        icon: "text-blue-600",
      };
  }
}

function SummaryIcon({ card }: { card: MatchesSummaryCard }) {
  const className = `h-4 w-4 ${getToneClasses(card.tone).icon}`;

  switch (card.tone) {
    case "success":
      return <CircleCheckIcon className={className} />;
    case "warning":
      return <HourglassIcon className={className} />;
    default:
      return <TrendUpIcon className={className} />;
  }
}

export function MatchesSummaryCards({ t }: MatchesSummaryCardsProps) {
  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-3">
      {MATCHES_SUMMARY_CARDS.map((card) => (
        <article
          key={card.id}
          className="rounded-[10px] border border-neutral-200 bg-white p-3 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[12px] font-medium leading-[16px] text-neutral-600">
                {t(card.titleKey)}
              </h3>
              <p className="mt-1 text-[31px] font-semibold leading-9 tracking-[-0.4492px] text-neutral-900">
                {card.valueKey}
              </p>
              <p className="mt-1 text-[11px] leading-[16px] text-neutral-500">
                {t(card.helperKey)}
              </p>
            </div>
            <SummaryIcon card={card} />
          </div>
        </article>
      ))}
    </section>
  );
}

import { CheckBadgeIcon, ClockIcon, MapPinIcon } from "@/components/auth/icons";
import type { MatchOfferResponse } from "@/types/api-matches";
import type { TranslateFn } from "@/types/i18n";
import { MatchInsightCard } from "./MatchInsightCard";
import { getFitLabel, getUrgencyTone, SCORE_LIMITS } from "./utils";

type SectionProps = {
  offer: MatchOfferResponse;
  t: TranslateFn;
};

export function ScoreSummarySection({
  offer,
  requestRange,
  availabilityRange,
  t,
}: SectionProps & { requestRange: string; availabilityRange: string }) {
  return (
    <section className="rounded-[18px] border border-[#bfdbfe] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_100%)] p-5 shadow-[0_10px_25px_rgba(37,99,235,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d4ed8]">
            {t("Total match score")}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-[-0.05em] text-neutral-900">
            {offer.matchScore}%
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            {offer.matchScore >= 90
              ? t("This offer is a strong fit for your request.")
              : offer.matchScore >= 75
                ? t("This offer is a good fit for your request.")
                : t("This offer matches several of your request criteria.")}
          </p>
        </div>

        <div className="grid min-w-[220px] gap-3 rounded-[16px] border border-white/70 bg-white/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
              {t("Request overview")}
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {offer.requestLocationCity}
            </p>
            <p className="text-sm text-neutral-600">{requestRange}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
              {t("Availability overview")}
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-900">
              {offer.availabilityLocationCity}
            </p>
            <p className="text-sm text-neutral-600">{availabilityRange}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DateOverlapSection({
  offer,
  requestRange,
  availabilityRange,
  t,
}: SectionProps & { requestRange: string; availabilityRange: string }) {
  return (
    <MatchInsightCard
      barClassName="bg-[#3b82f6]"
      pillClassName="border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
      title={t("Date overlap")}
      summary={t(
        "The supplier availability {{availabilityRange}} covers the requested period {{requestRange}}.",
        { availabilityRange, requestRange },
      )}
      fitLabel={getFitLabel(t, offer.dateScore, SCORE_LIMITS.date)}
      maxScore={SCORE_LIMITS.date}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            <ClockIcon className="h-3.5 w-3.5" />
            {t("Request period")}
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {requestRange}
          </p>
        </div>
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            <ClockIcon className="h-3.5 w-3.5" />
            {t("Availability period")}
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {availabilityRange}
          </p>
        </div>
      </div>
    </MatchInsightCard>
  );
}

export function LocationSection({
  offer,
  sameCity,
  t,
}: SectionProps & { sameCity: boolean }) {
  return (
    <MatchInsightCard
      barClassName="bg-[#14b8a6]"
      pillClassName="border-[#ccfbf1] bg-[#f0fdfa] text-[#0f766e]"
      title={t("City and radius fit")}
      summary={
        sameCity
          ? t(
              "Both sides are based in {{city}}, which gives this offer a strong location fit.",
              {
                city: offer.requestLocationCity,
              },
            )
          : t(
              "The request in {{requestCity}} and the availability in {{availabilityCity}} still fall within the accepted matching radius.",
              {
                requestCity: offer.requestLocationCity,
                availabilityCity: offer.availabilityLocationCity,
              },
            )
      }
      fitLabel={getFitLabel(t, offer.locationScore, SCORE_LIMITS.location)}
      maxScore={SCORE_LIMITS.location}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            <MapPinIcon className="h-3.5 w-3.5" />
            {t("Request location")}
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {offer.requestLocationCity}
          </p>
          <p className="text-sm text-neutral-600">
            {t("Radius {{count}} km", { count: offer.requestLocationRadiusKm })}
          </p>
        </div>
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            <MapPinIcon className="h-3.5 w-3.5" />
            {t("Availability location")}
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            {offer.availabilityLocationCity}
          </p>
          <p className="text-sm text-neutral-600">
            {t("Radius {{count}} km", {
              count: offer.availabilityLocationRadiusKm,
            })}
          </p>
        </div>
      </div>
    </MatchInsightCard>
  );
}

export function SkillsSection({ offer, t }: SectionProps) {
  return (
    <MatchInsightCard
      barClassName="bg-[#22c55e]"
      pillClassName="border-[#dcfce7] bg-[#f0fdf4] text-[#16a34a]"
      title={t("Skill match")}
      summary={
        offer.skills.length > 0
          ? t("All {{count}} required skills matched the request.", {
              count: offer.skills.length,
            })
          : t("No mandatory skills were specified for this request.")
      }
      fitLabel={
        offer.skills.length > 0 ? t("Full match") : t("No required skills")
      }
      maxScore={SCORE_LIMITS.skills}
    >
      {offer.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {offer.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534]"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}
    </MatchInsightCard>
  );
}

export function CertificatesSection({ offer, t }: SectionProps) {
  return (
    <MatchInsightCard
      barClassName="bg-[#f59e0b]"
      pillClassName="border-[#fde68a] bg-[#fffbeb] text-[#854d0e]"
      title={t("Certificate match")}
      summary={
        offer.certificates.length > 0
          ? t("All {{count}} required certificates matched the request.", {
              count: offer.certificates.length,
            })
          : t("No mandatory certificates were specified for this request.")
      }
      fitLabel={
        offer.certificates.length > 0
          ? t("Full match")
          : t("No required certificates")
      }
      maxScore={SCORE_LIMITS.certificates}
    >
      {offer.certificates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {offer.certificates.map((certificate) => (
            <span
              key={certificate}
              className="inline-flex items-center gap-1 rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1 text-xs font-semibold text-[#854d0e]"
            >
              <CheckBadgeIcon className="h-3 w-3" />
              {certificate}
            </span>
          ))}
        </div>
      ) : null}
    </MatchInsightCard>
  );
}

export function QuantitySection({ offer, t }: SectionProps) {
  return (
    <MatchInsightCard
      barClassName={offer.isPartial ? "bg-[#f97316]" : "bg-[#8b5cf6]"}
      pillClassName={
        offer.isPartial
          ? "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]"
          : "border-[#e9d5ff] bg-[#faf5ff] text-[#7c3aed]"
      }
      title={t("Worker quantity")}
      summary={
        offer.isPartial
          ? t(
              "This offer covers {{offered}} of {{requested}} requested workers.",
              {
                offered: offer.offeredQuantity,
                requested: offer.requestQuantity,
              },
            )
          : t(
              "This offer can cover the full requested quantity of {{requested}} workers.",
              {
                requested: offer.requestQuantity,
              },
            )
      }
      fitLabel={offer.isPartial ? t("Partial match") : t("Full match")}
      maxScore={SCORE_LIMITS.quantity}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            {t("Requested")}
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {offer.requestQuantity}
          </p>
        </div>
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            {t("Offered")}
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {offer.offeredQuantity}
          </p>
        </div>
        <div className="rounded-[12px] bg-neutral-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
            {t("Declared available")}
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {offer.availabilityQuantity}
          </p>
        </div>
      </div>
    </MatchInsightCard>
  );
}

export function UrgencySection({ offer, t }: SectionProps) {
  const urgencyTone = getUrgencyTone(offer.requestUrgency);

  return (
    <section className="rounded-[16px] border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900">
            {t("Urgency context")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {t("The request priority is set to {{urgency}}.", {
              urgency: t(offer.requestUrgency),
            })}
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {t(urgencyTone.noteKey)}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${urgencyTone.badgeClassName}`}
        >
          {t(offer.requestUrgency)}
        </span>
      </div>
    </section>
  );
}

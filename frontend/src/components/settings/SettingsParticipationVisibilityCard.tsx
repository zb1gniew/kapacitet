import { CircleCheckIcon } from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";
import { SettingsPreferenceCard } from "./SettingsPreferenceCard";

type SettingsParticipationVisibilityCardProps = {
  t: TranslateFn;
};

export function SettingsParticipationVisibilityCard({
  t,
}: SettingsParticipationVisibilityCardProps) {
  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Participation & visibility")}
      </h2>
      <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {t(
          "Control how your company participates in the capacity coordination network and what types of requests you receive.",
        )}
      </p>

      <div className="mt-5 space-y-3">
        <SettingsPreferenceCard
          title={t("Receive capacity requests")}
          description={t(
            "Allow other companies in your network to send capacity requests that match your declared availability. You can review and respond to each request individually.",
          )}
          checked
          t={t}
        />

        <SettingsPreferenceCard
          title={t("Participate in network-wide requests")}
          description={t(
            "When urgent requests are escalated to the extended network, your company will be included in automated matching even if you haven't declared specific availability.",
          )}
          checked
          t={t}
          noteKey="Network requests are only sent when no direct matches are found and the requesting company has marked their need as urgent."
        />

        <SettingsPreferenceCard
          title={t("Allow partial matches")}
          description={t(
            "Allow the platform to suggest partial matches when you cannot fulfill the complete request (e.g., 2 workers available when 3 are requested).",
          )}
          checked={false}
          t={t}
        />
      </div>

      <div className="mt-5 border-t border-neutral-200 pt-4">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-blue-600 px-4 text-sm font-semibold tracking-[-0.1504px] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition hover:bg-blue-700"
        >
          <CircleCheckIcon className="h-4 w-4" />
          {t("Save preferences")}
        </button>
      </div>
    </article>
  );
}

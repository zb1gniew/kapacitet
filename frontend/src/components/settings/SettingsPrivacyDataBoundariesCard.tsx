import type { ReactNode } from "react";
import { ClockIcon, EyeIcon, InfoIcon, ShieldIcon } from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";

type SettingsPrivacyDataBoundariesCardProps = {
  t: TranslateFn;
};

type BoundaryCardTone = "success" | "primary" | "warning";

function getBoundaryCardClass(tone: BoundaryCardTone) {
  switch (tone) {
    case "success":
      return {
        wrapper: "border-[#86efac] bg-[#f0fdf4]",
        icon: "bg-[#dcfce7] text-[#15803d]",
        title: "text-[#166534]",
        body: "text-[#166534]",
      };
    case "warning":
      return {
        wrapper: "border-[#fde68a] bg-[#fffbeb]",
        icon: "bg-[#fef3c7] text-[#d97706]",
        title: "text-[#7c2d12]",
        body: "text-[#973c00]",
      };
    default:
      return {
        wrapper: "border-[#bedbff] bg-[#eff6ff]",
        icon: "bg-[#dbeafe] text-[#1d4ed8]",
        title: "text-[#1c398e]",
        body: "text-[#193cb8]",
      };
  }
}

function BoundaryCard({
  t,
  titleKey,
  descriptionKey,
  tone,
  icon,
  noteKey,
}: {
  t: TranslateFn;
  titleKey: string;
  descriptionKey: string;
  tone: BoundaryCardTone;
  icon: ReactNode;
  noteKey?: string;
}) {
  const toneClass = getBoundaryCardClass(tone);

  return (
    <article className={`rounded-[10px] border px-4 py-4 ${toneClass.wrapper}`}>
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] ${toneClass.icon}`}
        >
          {icon}
        </span>
        <div>
          <h3 className={`text-sm font-semibold leading-5 tracking-[-0.1504px] ${toneClass.title}`}>
            {t(titleKey)}
          </h3>
          <p className={`mt-1 text-xs leading-[19.5px] tracking-[-0.1172px] ${toneClass.body}`}>
            {t(descriptionKey)}
          </p>
        </div>
      </div>

      {noteKey ? (
        <div className="mt-3 rounded-[8px] border border-[#bbf7d0] bg-[#f8fff9] px-3 py-2 text-[11px] leading-[16px] text-[#166534]">
          {t(noteKey)}
        </div>
      ) : null}
    </article>
  );
}

export function SettingsPrivacyDataBoundariesCard({
  t,
}: SettingsPrivacyDataBoundariesCardProps) {
  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-6 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Privacy & data boundaries")}
      </h2>
      <p className="mt-2 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {t(
          "The platform enforces strict privacy boundaries to protect worker identities and ensure temporary cooperation only.",
        )}
      </p>

      <div className="mt-5 space-y-3">
        <BoundaryCard
          t={t}
          titleKey="Worker identities are never shared"
          descriptionKey="The platform operates on anonymized capacity declarations. Worker names, personal information, and identification details are never transmitted or visible to requesting companies. Only skills, certificates, and availability are shared."
          noteKey="Platform guarantee: This boundary is enforced at the system level and cannot be overridden by any user."
          tone="success"
          icon={<ShieldIcon className="h-3.5 w-3.5" />}
        />

        <BoundaryCard
          t={t}
          titleKey="Company identities revealed after mutual confirmation"
          descriptionKey="During matching, both companies remain anonymous. Company names and contact information are revealed only after both parties have confirmed their intent to cooperate. Either party can decline without identity disclosure."
          tone="primary"
          icon={<EyeIcon className="h-3.5 w-3.5" />}
        />

        <BoundaryCard
          t={t}
          titleKey="All cooperation is temporary and time-bounded"
          descriptionKey="The platform is designed exclusively for temporary capacity sharing. All declarations and requests must have defined start and end dates. This is not a recruitment, hiring, or employment transfer platform."
          tone="warning"
          icon={<ClockIcon className="h-3.5 w-3.5" />}
        />

        <article className="rounded-[10px] border border-neutral-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
            {t("Data retention and access")}
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-[19.5px] tracking-[-0.1172px] text-neutral-700">
            <li>{t("Capacity declarations are stored only for the declared availability period plus 90 days")}</li>
            <li>{t("Match history and cooperation records are retained for compliance and audit purposes")}</li>
            <li>{t("You can request a full data export or account deletion by contacting platform support")}</li>
            <li>{t("All data handling complies with GDPR and local data protection regulations")}</li>
          </ul>
        </article>
      </div>

      <div className="mt-4 rounded-[10px] border border-neutral-200 bg-[#fafafa] px-4 py-3">
        <div className="flex items-start gap-2 text-neutral-600">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-[19.5px] tracking-[-0.1172px]">
            {t(
              "Note: Privacy boundaries are enforced at the platform level and cannot be modified through settings. For questions about data handling, contact platform support.",
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

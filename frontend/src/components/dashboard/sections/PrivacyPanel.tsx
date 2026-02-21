import type { TranslateFn } from "@/types/i18n";

type PrivacyPanelProps = {
  t: TranslateFn;
};

export function PrivacyPanel({ t }: PrivacyPanelProps) {
  return (
    <article className="rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-4 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
      <h3 className="text-sm font-semibold text-[#1c398e]">{t("Privacy protected")}</h3>
      <p className="mt-2 text-xs leading-[19.5px] text-[#193cb8]">
        {t(
          "Worker identities are never shared. Temporary cooperation only. You approve every match.",
        )}
      </p>
    </article>
  );
}

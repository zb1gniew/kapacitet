import { InfoIcon } from "@/components/auth/icons";
import type { TranslateFn } from "@/types/i18n";

type MatchesInfoBannerProps = {
  noticeKey: string;
  t: TranslateFn;
};

export function MatchesInfoBanner({ noticeKey, t }: MatchesInfoBannerProps) {
  return (
    <article className="mt-4 rounded-[10px] border border-[#bedbff] bg-[#eff6ff] p-3.5 text-[#1c398e] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="text-[11px] leading-[19.5px] tracking-[-0.1172px]">
          {t(noticeKey)}
        </p>
      </div>
    </article>
  );
}

import type { ReactNode } from "react";
import type { TranslateFn } from "@/types/i18n";
import { InfoIcon } from "@/components/auth/icons";
import { SettingsToggleSwitch } from "./SettingsToggleSwitch";

type NoteTone = "info" | "neutral";

type SettingsPreferenceCardProps = {
  title: string;
  description: string;
  checked: boolean;
  t: TranslateFn;
  noteKey?: string;
  noteTone?: NoteTone;
  leadingIcon?: ReactNode;
};

function getNoteToneClass(tone: NoteTone) {
  switch (tone) {
    case "neutral":
      return "border-neutral-300 bg-neutral-50 text-neutral-600";
    default:
      return "border-[#bedbff] bg-[#eff6ff] text-[#193cb8]";
  }
}

export function SettingsPreferenceCard({
  title,
  description,
  checked,
  t,
  noteKey,
  noteTone = "info",
  leadingIcon,
}: SettingsPreferenceCardProps) {
  return (
    <article className="rounded-[10px] border border-neutral-200 bg-[#fafafa] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {leadingIcon}
            <h3 className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-neutral-900">
              {title}
            </h3>
          </div>
          <p className="mt-1 text-xs leading-[19.5px] tracking-[-0.1172px] text-neutral-600">
            {description}
          </p>
        </div>
        <SettingsToggleSwitch checked={checked} />
      </div>

      {noteKey ? (
        <div
          className={`mt-3 flex items-start gap-2 rounded-[8px] border px-3 py-2 ${getNoteToneClass(noteTone)}`}
        >
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="text-[11px] leading-[16px]">{t(noteKey)}</p>
        </div>
      ) : null}
    </article>
  );
}

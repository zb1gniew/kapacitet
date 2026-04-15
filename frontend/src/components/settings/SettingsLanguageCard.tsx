"use client";

import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { SupportedLanguage } from "@/i18n/resources";

type LanguageOption = {
  code: SupportedLanguage;
  flag: string;
  labelKey: string;
  nativeLabel: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", flag: "🇬🇧", labelKey: "English", nativeLabel: "English" },
  { code: "da", flag: "🇩🇰", labelKey: "Danish", nativeLabel: "Dansk" },
  { code: "sv", flag: "🇸🇪", labelKey: "Swedish", nativeLabel: "Svenska" },
  { code: "no", flag: "🇳🇴", labelKey: "Norwegian", nativeLabel: "Norsk" },
];

export function SettingsLanguageCard() {
  const { i18n, t } = useLocalizedScreen();
  const active = (i18n.resolvedLanguage ?? "en").split(
    "-",
  )[0] as SupportedLanguage;

  return (
    <article className="rounded-[14px] border border-neutral-200 bg-white p-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="text-xl font-bold leading-7 tracking-[-0.4492px] text-neutral-900">
        {t("Language")}
      </h2>
      <p className="mt-1 text-sm leading-[22.75px] tracking-[-0.1504px] text-neutral-600">
        {t("Choose your preferred interface language.")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.code === active;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => void i18n.changeLanguage(option.code)}
              className={`flex flex-col items-center gap-2 rounded-[10px] border px-3 py-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                isActive
                  ? "border-[#bedbff] bg-[#eff6ff] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "border-neutral-200 bg-[#fafafa] hover:border-neutral-300 hover:bg-neutral-100"
              }`}
              aria-pressed={isActive}
            >
              <span className="text-3xl leading-none" aria-hidden="true">
                {option.flag}
              </span>
              <span
                className={`text-sm font-semibold leading-5 tracking-[-0.1504px] ${
                  isActive ? "text-[#1c398e]" : "text-neutral-700"
                }`}
              >
                {t(option.labelKey)}
              </span>
              <span
                className={`text-xs leading-4 tracking-[-0.1172px] ${
                  isActive ? "text-[#193cb8]" : "text-neutral-500"
                }`}
              >
                {option.nativeLabel}
              </span>
              {isActive ? (
                <span className="inline-flex h-4 items-center rounded-full bg-blue-600 px-2 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
                  {t("Active")}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </article>
  );
}

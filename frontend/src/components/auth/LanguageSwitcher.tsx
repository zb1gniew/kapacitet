"use client";

import { useLocalizedScreen } from "@/hooks/useLocalizedScreen";
import type { SupportedLanguage } from "@/i18n/resources";

const languageOptions: Array<{ code: SupportedLanguage; labelKey: string }> = [
  { code: "en", labelKey: "English" },
  { code: "da", labelKey: "Danish" },
  { code: "sv", labelKey: "Swedish" },
  { code: "no", labelKey: "Norwegian" },
];

export function LanguageSwitcher() {
  const { i18n, t } = useLocalizedScreen();
  const activeLanguage = (i18n.resolvedLanguage || "en").split("-")[0];

  return (
    <div className="mb-4 flex justify-end">
      <label
        htmlFor="language"
        className="mr-2 self-center text-xs font-medium text-neutral-600"
      >
        {t("Language")}
      </label>
      <select
        id="language"
        value={activeLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none ring-blue-200 focus:ring-2"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}

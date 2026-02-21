import da from "./locales/da/app.json";
import en from "./locales/en/app.json";
import no from "./locales/no/app.json";
import sv from "./locales/sv/app.json";

export const defaultLanguage = "en" as const;

export const supportedLanguages = ["en", "da", "sv", "no"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const resources = {
  en: { translation: en },
  da: { translation: da },
  sv: { translation: sv },
  no: { translation: no },
} as const;

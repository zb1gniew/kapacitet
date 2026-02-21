"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { initI18n } from "@/i18n/client";

initI18n();

export function useLocalizedScreen() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return { i18n, t };
}

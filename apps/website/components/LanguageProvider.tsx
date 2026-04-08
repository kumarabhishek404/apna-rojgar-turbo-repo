"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth } from "@/lib/auth";
import { AppLanguage, resolveLanguage, translate } from "@/lib/i18n";

const STORAGE_KEY = "apna_rojgar_lang";

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "hi") {
      setLanguageState(stored);
      return;
    }

    const auth = getAuth() as { user?: { locale?: unknown } } | null;
    const locale = auth?.user?.locale;
    let detected: AppLanguage = "en";

    if (typeof locale === "string") {
      detected = resolveLanguage(locale);
    } else if (
      locale &&
      typeof locale === "object" &&
      "language" in locale &&
      typeof (locale as { language?: string }).language === "string"
    ) {
      detected = resolveLanguage((locale as { language?: string }).language);
    }

    setLanguageState(detected);
    localStorage.setItem(STORAGE_KEY, detected);
  }, []);

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string, fallback?: string) => translate(language, key, fallback),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

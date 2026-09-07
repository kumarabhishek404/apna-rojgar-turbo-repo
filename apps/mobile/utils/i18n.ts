import { I18n } from "i18n-js";
import { useCallback } from "react";

// Import translation files
import en from "../app/locales/en.json";
import hi from "../app/locales/hi.json";
import mr from "../app/locales/mr.json";
import rj from "../app/locales/rj.json";
import bn from "../app/locales/bn.json";
import gu from "../app/locales/gu.json";
import kn from "../app/locales/kn.json";
import ks from "../app/locales/ks.json";
import ml from "../app/locales/ml.json";
import pa from "../app/locales/pa.json";
import ta from "../app/locales/ta.json";
import te from "../app/locales/te.json";
import ur from "../app/locales/ur.json";

// Create an i18n instance with translation files
const i18n: any = new I18n({
  en, // English
  hi, // Hindi
  mr, // Marathi
  rj, // Rajasthani
  ta, // Tamil
  te, // Telugu
  bn, // Bangali
  gu, // Gujarati
  kn, // Kannad
  ks, // Kashmiri
  ml, // Malayalam
  pa, // Punjabi
  ur, // Urdu
});

/** Default UI is Hindi until persisted `LanguageAtom` hydrates from storage. */
i18n.locale = "hi";

// Enable fallback to default language if a translation key is missing
i18n.fallbacks = true;

export const setI18nLocale = (locale: string) => {
  i18n.locale = locale;
};

/** Worker keys are `{ singular, plural }`. Never show "[object Object]". */
export function humanizeI18nValue(raw: unknown, fallback = ""): string {
  if (raw == null) return fallback;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "[object Object]") return fallback;
    return s;
  }
  if (typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    const pick =
      row.singular ??
      row.one ??
      row.other ??
      row.plural ??
      row.name ??
      row.title ??
      row.label;
    if (pick != null && typeof pick !== "object") return String(pick);
  }
  return fallback;
}

export const getDynamicWorkerType = (key: string, count: number): string => {
  const translations = i18n.t(key);
  if (translations && typeof translations === "object") {
    const row = translations as { singular?: string; plural?: string };
    if (row.singular || row.plural) {
      return count === 1
        ? String(row.singular || row.plural)
        : String(row.plural || row.singular);
    }
  }
  return humanizeI18nValue(translations, key);
};

// Custom hook to use `t` directly
export const useTranslation = () => {
  const t = useCallback(
    (key: string, options?: object) => i18n.t(key, options),
    []
  );
  return { t };
};

export default i18n;

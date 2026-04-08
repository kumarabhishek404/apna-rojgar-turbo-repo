import websiteEn from "@/locales/en.json";
import websiteHi from "@/locales/hi.json";

export type AppLanguage = "en" | "hi";

type LocaleValue = string | Record<string, unknown>;
type LocaleDict = Record<string, LocaleValue>;

function asLocaleDict(raw: unknown): LocaleDict {
  return raw as LocaleDict;
}

const WEBSITE_EN = asLocaleDict(websiteEn);
const WEBSITE_HI = asLocaleDict(websiteHi);

/**
 * Keep compatibility for existing website keys.
 */
export const WEBSITE_KEY_ALIASES: Record<string, string> = {
  logout: "logOut",
  unknown: "notAdded",
};

export const translations: Record<AppLanguage, LocaleDict> = {
  en: WEBSITE_EN,
  hi: WEBSITE_HI,
};

export function translate(language: AppLanguage, key: string, fallback?: string): string {
  const dict = translations[language];
  const resolvedKey = WEBSITE_KEY_ALIASES[key] ?? key;
  const value = dict[resolvedKey];
  if (typeof value === "string" && value !== "") {
    return value;
  }
  if (value && typeof value === "object") {
    const maybeSingular =
      "singular" in value && typeof value.singular === "string" ? value.singular : undefined;
    if (maybeSingular) return maybeSingular;

    const firstString = Object.values(value).find((entry) => typeof entry === "string");
    if (typeof firstString === "string" && firstString !== "") {
      return firstString;
    }
  }
  if (fallback !== undefined) {
    return fallback;
  }
  return key;
}

export function resolveLanguage(value: unknown): AppLanguage {
  if (typeof value === "string" && value.toLowerCase().startsWith("hi")) return "hi";
  return "en";
}

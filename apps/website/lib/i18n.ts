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
  if (typeof value === "string" && value.toLowerCase().startsWith("en")) return "en";
  return "hi";
}

/** Matches `LanguageProvider` storage so API errors use the same language as the UI. */
export function getClientAppLanguage(): AppLanguage {
  if (typeof window === "undefined") return "hi";
  const stored = window.localStorage.getItem("apna_rojgar_lang");
  return stored === "en" ? "en" : "hi";
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

/** Uses locale keys for requirement/skill ids (same as WORKERTYPES / services). */
function skillDisplayName(language: AppLanguage, slug: string): string {
  return translate(language, slug.trim(), slug.trim());
}

/**
 * Maps known English backend messages to the active locale. Unknown text is returned as-is.
 */
export function translateKnownApiMessage(language: AppLanguage, rawMessage: string): string {
  const raw = String(rawMessage).trim();
  if (!raw) return rawMessage;

  const exactKeyByEnglish: Record<string, string> = {
    "You cannot add yourself as a worker when applying as a mediator.":
      "apiErrorApplyMediatorSelfWorker",
    "User not found.": "apiErrorUserNotFound",
    "Please select at least one requirement from the service to apply.":
      "apiErrorApplySelectRequirement",
    "Please enter how many workers you can provide (whole number, at least 1).":
      "apiErrorApplyContractorManpower",
    "You cannot apply as a worker after applying as a mediator.":
      "apiErrorApplyWorkerAfterMediator",
    "You have already applied.": "apiErrorApplyAlreadyApplied",
    "Service not found.": "apiErrorServiceNotFound",
    "Service has no employer assigned.": "apiErrorServiceNoEmployer",
    "You cannot apply to a service you created.": "apiErrorApplyOwnService",
    "You cannot apply in the service which is created by your selected team member.":
      "apiErrorApplyTeamIncludesEmployerCreator",
    "This service is not in a hiring state.": "apiErrorServiceNotHiring",
    "Workers list is required.": "apiErrorWorkersListRequired",
    "Skills mapping is required.": "apiErrorSkillsMappingRequired",
    "Some workers do not have the required skills.": "apiErrorWorkersMissingSkills",
    "Mediator has already applied.": "apiErrorMediatorAlreadyApplied",
  };

  const exactKey = exactKeyByEnglish[raw];
  if (exactKey) {
    return translate(language, exactKey, raw);
  }

  let m = raw.match(
    /^You do not have "([^"]+)" on your profile\. Add it to your skills or apply only for roles you have\.$/,
  );
  if (m) {
    const tmpl = translate(
      language,
      "apiErrorApplyMissingSkillOnProfile",
      'You do not have "{{skill}}" on your profile. Add it to your skills or apply only for roles you have.',
    );
    return fillTemplate(tmpl, { skill: skillDisplayName(language, m[1]) });
  }

  m = raw.match(/^Invalid requirement:\s*(.+)$/);
  if (m) {
    const tmpl = translate(
      language,
      "apiErrorApplyInvalidRequirement",
      "Invalid requirement: {{skill}}",
    );
    return fillTemplate(tmpl, { skill: skillDisplayName(language, m[1].trim()) });
  }

  m = raw.match(/^Skill is missing for worker ID:\s*(.+)$/);
  if (m) {
    const tmpl = translate(
      language,
      "apiErrorSkillMissingForWorkerId",
      "Skill is missing for worker ID: {{workerId}}",
    );
    return fillTemplate(tmpl, { workerId: m[1].trim() });
  }

  return rawMessage;
}

export function localizeApiErrorMessage(rawMessage: string): string {
  return translateKnownApiMessage(getClientAppLanguage(), rawMessage);
}

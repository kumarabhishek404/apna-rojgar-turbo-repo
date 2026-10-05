import TRANSLATION from "./translations.js";
import SERVICETRANSLATION from "./service.translation.js";

/**
 * Get localized message by key and language.
 * @param {string} key - The message key (e.g., 'WELCOME').
 * @param {string} language - The user's language code (e.g., 'en', 'ta').
 * @param {Object} params - The dynamic parameters to replace in the message.
 * @returns {string} - The localized message.
 */

const replacePlaceholdersWithServiceTranslation = (
  title,
  message,
  params,
  selectedLang = "hi",
  serviceTranslation,
) => {
  const langMap = serviceTranslation?.service[selectedLang];

  console.log("params-----", params);

  for (const [placeholder, value] of Object.entries(params)) {
    // Find if the value exists as a key in the translation dictionary
    const translated = langMap?.[value] ?? value;

    // Replace placeholder in the message string
    message = message.replace(`{{${placeholder}}}`, translated);
    title = title.replace(`{{${placeholder}}}`, translated);
  }

  return {
    title,
    message,
  };
};

export const getNotificationMessage = (key, language, params = {}) => {
  console.log("key---", key, "lang---", language);

  if (typeof key !== "string") {
    throw new Error(
      `Invalid notification key type: ${typeof key}. Expected string.`,
    );
  }

  const lang = language || "hi";
  const title =
    TRANSLATION?.titles[lang]?.[key] ??
    TRANSLATION?.titles.hi?.[key] ??
    TRANSLATION?.titles.en?.[key];
  const message =
    TRANSLATION?.messages[lang]?.[key] ??
    TRANSLATION?.messages.hi?.[key] ??
    TRANSLATION?.messages.en?.[key];

  if (!title || !message) {
    throw new Error(
      `Notification key '${key}' not found for language '${language}'`,
    );
  }

  return replacePlaceholdersWithServiceTranslation(
    title,
    message,
    params,
    lang,
    SERVICETRANSLATION,
  );
};

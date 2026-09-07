import * as Speech from "expo-speech";

const LOCALE_BCP47: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
  rj: "hi-IN",
  ks: "hi-IN",
};

export function speechLanguageForAppLocale(locale?: string): string {
  const key = String(locale || "hi").slice(0, 2).toLowerCase();
  return LOCALE_BCP47[key] || LOCALE_BCP47.hi;
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}

export function speakSaathi(
  text: string,
  locale: string,
  onDone?: () => void,
): void {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    onDone?.();
    return;
  }
  stopSpeaking();
  Speech.speak(trimmed, {
    language: speechLanguageForAppLocale(locale),
    pitch: 1,
    rate: 0.95,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

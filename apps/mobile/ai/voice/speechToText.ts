import { Audio } from "expo-av";
import { Platform } from "react-native";

import { speechLanguageForAppLocale, stopSpeaking } from "./textToSpeech";

export type SttResult =
  | { ok: true; text: string }
  | { ok: false; reason: "unavailable" | "denied" | "unclear" | "error" };

type SpeechRecognitionNative = {
  isRecognitionAvailable?: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  addListener: (
    event: string,
    cb: (event: Record<string, unknown>) => void,
  ) => { remove: () => void };
};

let activeNative: SpeechRecognitionNative | null = null;

function loadSpeechRecognitionNative(): SpeechRecognitionNative | null {
  try {
    // Optional native module — missing until an EAS/dev-client rebuild includes it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-speech-recognition") as {
      ExpoSpeechRecognitionModule?: SpeechRecognitionNative;
    };
    const native = mod?.ExpoSpeechRecognitionModule;
    if (typeof native?.start !== "function" || typeof native.addListener !== "function") {
      return null;
    }
    if (
      typeof native.isRecognitionAvailable === "function" &&
      !native.isRecognitionAvailable()
    ) {
      return null;
    }
    return native;
  } catch {
    return null;
  }
}

async function ensureMicPermission(): Promise<boolean> {
  const current = await Audio.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Audio.requestPermissionsAsync();
  return next.granted;
}

function firstTranscript(value: unknown): string {
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string") return first.trim();
    if (first && typeof first === "object" && "transcript" in first) {
      return String((first as { transcript?: unknown }).transcript || "").trim();
    }
  }
  if (typeof value === "string") return value.trim();
  return "";
}

async function transcribeWithNative(
  native: SpeechRecognitionNative,
  lang: string,
): Promise<SttResult> {
  const permission = await native.requestPermissionsAsync();
  if (!permission.granted) return { ok: false, reason: "denied" };

  return new Promise((resolve) => {
    let settled = false;
    const subs: Array<{ remove: () => void }> = [];

    const finish = (result: SttResult) => {
      if (settled) return;
      settled = true;
      activeNative = null;
      clearTimeout(timeout);
      subs.forEach((sub) => {
        try {
          sub.remove();
        } catch {
          // ignore
        }
      });
      resolve(result);
    };

    const timeout = setTimeout(() => {
      try {
        native.abort();
      } catch {
        // ignore
      }
      finish({ ok: false, reason: "unclear" });
    }, 20000);

    subs.push(
      native.addListener("result", (event) => {
        const text = firstTranscript(event?.results);
        if (event?.isFinal === false && !text) return;
        if (text) finish({ ok: true, text });
      }),
    );
    subs.push(
      native.addListener("error", (event) => {
        const code = String(event?.error || "");
        if (code === "not-allowed" || code === "service-not-allowed") {
          finish({ ok: false, reason: "denied" });
          return;
        }
        if (code === "no-speech" || code === "aborted") {
          finish({ ok: false, reason: "unclear" });
          return;
        }
        finish({ ok: false, reason: "error" });
      }),
    );
    subs.push(
      native.addListener("end", () => {
        finish({ ok: false, reason: "unclear" });
      }),
    );

    activeNative = native;
    try {
      native.start({
        lang,
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
        addsPunctuation: false,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
        },
      });
    } catch {
      finish({ ok: false, reason: "unavailable" });
    }
  });
}

async function transcribeWithAndroidIntent(lang: string): Promise<SttResult> {
  const IntentLauncher = await import("expo-intent-launcher");
  const result = await IntentLauncher.startActivityAsync(
    "android.speech.action.RECOGNIZE_SPEECH",
    {
      extra: {
        "android.speech.extra.LANGUAGE_MODEL": "free_form",
        "android.speech.extra.LANGUAGE": lang,
        "android.speech.extra.LANGUAGE_PREFERENCE": lang,
        "android.speech.extra.MAX_RESULTS": 1,
      },
    },
  );

  const cancelled = Number(result.resultCode) === 0;
  if (cancelled) return { ok: false, reason: "unclear" };

  const extra = (result.extra || {}) as Record<string, unknown>;
  const text =
    firstTranscript(extra["android.speech.extra.RESULTS"]) ||
    firstTranscript(extra.RESULTS) ||
    firstTranscript(extra.results) ||
    firstTranscript(result.data);

  if (!text) return { ok: false, reason: "unclear" };
  return { ok: true, text };
}

export async function transcribeSpeech(appLocale: string): Promise<SttResult> {
  stopSpeaking();

  const allowed = await ensureMicPermission();
  if (!allowed) return { ok: false, reason: "denied" };

  const lang = speechLanguageForAppLocale(appLocale);
  const native = loadSpeechRecognitionNative();
  if (native) {
    return transcribeWithNative(native, lang);
  }

  if (Platform.OS === "android") {
    try {
      return await transcribeWithAndroidIntent(lang);
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }

  return { ok: false, reason: "unavailable" };
}

export async function stopTranscription(): Promise<void> {
  if (!activeNative) return;
  try {
    activeNative.stop();
  } catch {
    try {
      activeNative.abort();
    } catch {
      // ignore
    }
  }
  activeNative = null;
}

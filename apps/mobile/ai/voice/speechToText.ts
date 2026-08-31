export type SttResult =
  | { ok: true; text: string }
  | { ok: false; reason: "unavailable" | "denied" | "unclear" | "error" };

/**
 * On-device STT is optional (needs a native module + EAS rebuild).
 * Typed input always works. Do not import a missing package — Metro would fail the bundle.
 */
export async function transcribeSpeech(_appLocale: string): Promise<SttResult> {
  return { ok: false, reason: "unavailable" };
}

export async function stopTranscription(): Promise<void> {
  return;
}

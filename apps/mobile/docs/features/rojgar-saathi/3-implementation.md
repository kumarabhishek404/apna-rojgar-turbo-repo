# 3 — Implementation: Rojgar Saathi

## Implementation Plan

| ID | Layer | File | Story | Depends |
|----|-------|------|-------|---------|
| FE-1 | FE | `ai/intents/*` | US-2 | — |
| FE-2 | FE | `ai/suggestions/*` | US-1 | — |
| FE-3 | FE | `ai/tools/*` | US-2, US-3 | — |
| FE-4 | FE | `ai/agent/*` | US-1–5 | FE-1–3 |
| FE-5 | FE | `ai/voice/*` | US-4 | — |
| FE-6 | FE | `ai/analytics/aiAnalytics.ts` | FR-10 | — |
| FE-7 | FE | `app/screens/rojgarSaathi/index.tsx` | US-1 | FE-4 |
| FE-8 | FE | Home hero + ProfileMenu | US-1 | FE-7 |
| FE-9 | FE | locales en/hi | FR-4 | — |

No new DB. No duplicate REST resources. `[API ADDED]`: none.

## Notes
- STT: try `expo-speech-recognition` if present; else typed input.
- TTS: existing `expo-speech` / `speakText`.

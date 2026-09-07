# 5 — Documentation: Rojgar Saathi

## API Reference
No new backend endpoints. Assistant reads existing authenticated APIs via `API_CLIENT` (`/service/all`, `/worker/booking/all`, `/worker/applied-services`, `/employer/my-services`, `/user/all`).

## ADR-001 — Rule-based NLU
**Context:** Spec asked for intent detection without inventing data.  
**Decision:** On-device Hindi/Hinglish rules + existing REST tools. No LLM.  
**Consequences:** Fast, offline-capable matching; weaker free-form English. Add LLM later behind the same `runRojgarAgent` interface.

## ADR-002 — Suggestion language
**Decision:** Suggestion chip titles always `t(key)` in the selected app language.

## ADR-003 — Voice input
**Decision:** TTS via `expo-speech`. STT optional / not bundled in this MVP so Metro stays green without a new native module. Typed input always works.

## Release notes
**What's new:** Rojgar Saathi on home (mic) and Profile. Namaste + 3–4 useful suggestions in your language. Speak or type for work, bookings, and applications using real app data.

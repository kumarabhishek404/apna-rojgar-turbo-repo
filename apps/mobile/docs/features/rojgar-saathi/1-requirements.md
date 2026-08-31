# 1 — Requirements: Rojgar Saathi

## Requirements Document

**Feature:** Voice-first in-app assistant for rural WORKER / EMPLOYER / MEDIATOR users.

### Functional requirements
- FR-1 Opening UI: Namaste + name, help line, 3–4 suggestions, dominant mic. No command dump.
- FR-2 Role: use currently active app role (`APP_CONTEXT.role`). Never mix worker vs employer chips.
- FR-3 Suggestion engine: score role, urgency, pending actions, nearby work, profile completeness. Max 4.
- FR-4 Suggestions render in **selected app language** (`t()` / i18n locale).
- FR-5 Intents: FIND_WORK, VIEW_BOOKINGS, VIEW_APPLICATIONS, VIEW_NEARBY_WORK, VIEW_ACTIVE_WORK, VIEW_WORKERS, HIRE_WORKERS, POST_WORK, VIEW_WORK_STATUS, VIEW_PROFILE, HELP, GREETING, UNKNOWN, MORE_OPTIONS.
- FR-6 Tools wrap existing `/service/all`, worker bookings, applied services, employer my-services, `/user/all`. Never invent counts.
- FR-7 Conversation slots persist in-session (skill, quantity). Minimum questions.
- FR-8 Confirm before posting/cancelling; MVP navigates to existing screens.
- FR-9 Voice in (STT when available) + voice out (expo-speech). Typed input always available.
- FR-10 Analytics events (no audio blobs).
- FR-11 Identity from session only.

### Non-functional
- NFR-1 Replies 1–3 sentences; lists max 5 then “aur dikhaun?”
- NFR-2 Offline: clear Hindi/English network message.
- NFR-3 Large tap targets; low-literacy copy.

### User stories (summary)
- US-1 Worker opens Saathi → relevant ≤4 chips in their language (FR-1, FR-2, FR-3, FR-4)
- US-2 Worker says “mujhe kaam chahiye” → FIND_WORK uses skills + nearby jobs (FR-5, FR-6)
- US-3 Employer needs workers → HIRE_WORKERS / applications from real data (FR-2, FR-6)
- US-4 Speech fails → “awaaz clear nahi” + 3 options (FR-9)
- US-5 Unknown intent → 3 recovery options, never “Invalid input”

## Gap Analysis
- High: Native STT may need a new EAS build — defer: typed input + TTS always; STT optional.
- Medium: LLM NLU — deferred D-3.
- Medium: Anti-repetition storage — implement lightweight AsyncStorage.

## Architecture Inputs
- Mobile-only module `apps/mobile/ai/*`. No new backend models.
- Screen `/screens/rojgarSaathi`.
- Auth: existing token via API_CLIENT.

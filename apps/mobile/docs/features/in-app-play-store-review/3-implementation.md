# Phase 3 — Implementation

## Implementation Plan

| ID | Layer | File | Implements | Status |
|----|-------|------|------------|--------|
| FE-1 | Frontend | `utils/appStoreReview.ts` | US-1, US-2 — prompt, cooldown, requestReview, fallback | Done |
| FE-2 | Frontend | `app/screens/appFeedback/index.tsx` | US-1 — auto prompt after rating ≥ 4 | Done |
| FE-3 | Frontend | `components/commons/ProfileMenu.tsx` | US-2 — Rate App menu | Done |
| FE-4 | Frontend | `app/locales/*.json` | FR-3 — i18n soft prompt | Done |
| FE-5 | Config | `app.json` `android.playStoreUrl` | Store metadata for expo-store-review | Done |
| FE-6 | Deps | `expo-store-review@~9.0.9` | Play In-App Review API | Done |

## Code Review Findings

| Severity | Finding | Resolution |
|----------|---------|------------|
| Medium | Alert after `router.back()` may race | Delayed prompt 400ms |
| Low | Native dialog language ≠ app locale | Documented; soft prompt is localized |

## Security Review Findings

None — no PII, no new network APIs beyond store OS APIs.

# 3 — Implementation: Account Suspension Lock Screen

## Implementation Plan

| ID | Layer | File | Story |
|----|-------|------|-------|
| FE-1 | Frontend | `utils/userStatus.ts` | US-1 |
| FE-2 | Frontend | `components/commons/AccountSuspendedScreen.tsx` | US-1, US-4 |
| FE-3 | Frontend | `components/commons/AccountAccessGuard.tsx` + `app/_layout.tsx` | US-1 |
| FE-4 | Frontend | `app/screens/auth/login.tsx` | US-2 |
| API-1 | Client API | `app/api/index.tsx` | US-3 |
| FE-5 | Frontend | tabs layout, notifications, deep links | US-1 |
| FE-6 | Frontend | locales (hi + all languages) | US-1 |
| FE-7 | Frontend | profile no longer shows inactive overlay for SUSPENDED | US-1 |

Backend already rejects SUSPENDED users via `userStatus` middleware. `GET /user/info` is intentionally not gated so “Check status” can see reactivation.

## Code Review Findings
- Medium: DISABLED accounts still use the profile overlay, not this lock screen (out of scope).
- Logout keeps the session-clear order: navigate to login, then clear the user atom so the overlay does not flash the previous screen.

## Security Review Findings
- No new privileged APIs.
- Suspended users keep a token so they can read `/user/info` and email support; all other authenticated feature routes remain blocked by backend middleware.

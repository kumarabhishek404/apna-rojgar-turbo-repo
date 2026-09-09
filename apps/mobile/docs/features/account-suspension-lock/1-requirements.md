# 1 — Requirements: Account Suspension Lock Screen

## Requirements Document

### Feature Summary
Suspended users must not use the app. They see one screen that explains the suspension (policy violation) and shows `info@apnarojgarindia.com` so they can email administration to request reactivation. Copy is Hindi-first (app default locale is Hindi).

### Functional Requirements
- **FR-1** If `user.status === SUSPENDED`, the user cannot open tabs, drawers, or other screens.
- **FR-2** The lock screen states that the account is suspended for violating policy.
- **FR-3** The lock screen shows the company support email and can open the mail app.
- **FR-4** Login of a suspended user lands on this screen (no onboarding / home).
- **FR-5** If an admin suspends a user while the app is open, the next API rejection (`User is suspended`) flips the app to this screen.
- **FR-6** If an admin reactivates the account, the user can tap “Check status” and re-enter the app.
- **FR-7** The user may log out from the lock screen.

### Non-Functional Requirements
- **NFR-1** Lock must apply at the root navigator so deep links cannot bypass it.
- **NFR-2** Notifications and in-app banners must not open other screens.
- **NFR-3** Copy exists in all supported app locales; default UI language is Hindi.

### Assumptions
- [ASSUMED] Support email is `info@apnarojgarindia.com` (same as Help screen).
- [ASSUMED] DISABLED / PENDING accounts keep existing profile-overlay behaviour.
- [ASSUMED] Backend `userStatus` middleware already blocks SUSPENDED API access; no backend change required.

## Gap Analysis
| Gap | Risk | Resolution |
|-----|------|------------|
| Mid-session suspend | High | API interceptor persists `SUSPENDED` on the user atom |
| Notification tap bypass | High | Skip notification navigation when suspended |
| Deep link bypass | High | Root overlay + skip home recovery |
| Reactivation without reinstall | Medium | Check-status calls `GET /user/info` (not gated by userStatus) |

## User Stories
- **US-1 (FR-1, FR-2, FR-3)** As a suspended worker, I only see a lock screen with the reason and support email so I know how to ask for reactivation.
- **US-2 (FR-4)** As a suspended worker, when I log in I go straight to the lock screen.
- **US-3 (FR-5)** As a user suspended while using the app, I am locked out immediately after the next API call.
- **US-4 (FR-6, FR-7)** As a suspended worker, I can email admin, re-check status, or log out.

## Test Scenarios
See `4-testing.md`.

## Architecture Inputs
- **Client gate:** `AccountAccessGuard` in `app/_layout.tsx`
- **Status source:** `UserAtom.status` from login, `GET /user/info`, or interceptor
- **API:** existing `User is suspended` message from `userStatus` middleware
- **Email:** `SUPPORT_EMAIL` in `constants/socialLinks.ts`

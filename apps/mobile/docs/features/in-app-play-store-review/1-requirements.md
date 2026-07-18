# Phase 1 — Requirements: In-App Play Store Review

## Requirements Document

### Feature Summary
Let users rate Apna Rojgar on Google Play from inside the Android app using the native In-App Review API, preceded by a clear soft prompt in the user’s selected app language.

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR-1 | After successful App Feedback with rating ≥ 4, show a soft rate prompt (if cooldown allows) |
| FR-2 | Profile menu has a “Rate App” item that always shows the soft prompt |
| FR-3 | Soft prompt strings use `t()` so they follow the selected app language |
| FR-4 | On “Rate now”, call `StoreReview.requestReview()`; if unavailable, open Play Store listing via `openPlayStore()` |
| FR-5 | Never use `&reviewId=0` URLs |
| FR-6 | Auto-prompt respects a 90-day cooldown after any prompt (accept or dismiss) |

### Non-Functional Requirements
| ID | Requirement |
|----|-------------|
| NFR-1 | Soft prompt must be readable and tappable on small Android devices |
| NFR-2 | Failures must not crash the app; log and fall back to Play Store when possible |
| NFR-3 | Native Play dialog language is controlled by Google Play / device — document this limitation |

### Edge Cases
- In-app review unavailable (emulator, sideload, quota) → open Play Store listing
- User dismisses soft prompt → mark cooldown; do not open store
- Explicit Rate App menu → ignore cooldown
- iOS: same API via StoreKit when available; else no-op / store URL if configured

### Language / i18n Scope
Custom UI (Alert title, message, buttons, menu label) is translated for all app locales.  
The Google Play native review sheet is **not** customizable; it uses the Play Store / device language.

---

## Gap Analysis

| Gap | Risk | Disposition |
|-----|------|-------------|
| Play quota may hide native dialog even when API succeeds | Medium | Accept — fallback listing available; document |
| Soft prompt vs Google “don’t ask questions” guideline | Low | Soft prompt is opt-in CTA, not a pre-rating questionnaire |
| Missing translations in some locales | High | Add keys to all 13 locale files |

---

## User Stories

### US-1 → FR-1, FR-3, FR-4, FR-6
**As a** happy user who submitted 4–5★ app feedback  
**I want** a simple “Rate us?” prompt in my language  
**So that** I can leave a Play Store review without hunting for the listing

**AC-1:** Given rating ≥ 4 and cooldown clear, When feedback succeeds, Then soft prompt appears in selected language.  
**AC-2:** Given user taps Rate now, When review API available, Then native dialog is requested.  
**AC-3:** Given API unavailable, When Rate now, Then Play Store listing opens.

### US-2 → FR-2, FR-3, FR-4
**As a** user in Profile  
**I want** a Rate App menu item  
**So that** I can rate whenever I choose

**AC-4:** Given Profile menu, When I tap Rate App, Then soft prompt shows even if cooldown active.

---

## Test Scenarios

| ID | Category | Title | Priority |
|----|----------|-------|----------|
| TS-1 | Positive | Soft prompt after 5★ feedback | Critical |
| TS-2 | Positive | Rate App menu opens soft prompt | Critical |
| TS-3 | Positive | Soft prompt text matches Hindi locale | Critical |
| TS-4 | Negative | Cooldown blocks second auto-prompt | High |
| TS-5 | Edge | Unavailable review → openPlayStore | High |
| TS-6 | Edge | Dismiss Later → no store open | Medium |

---

## Architecture Inputs

### Components
- `utils/appStoreReview.ts` — prompt + review + cooldown
- `app/screens/appFeedback/index.tsx` — auto trigger
- `components/commons/ProfileMenu.tsx` — Rate App item
- Locale JSON files — i18n strings
- `app.json` — `android.playStoreUrl` for store fallback metadata

### Data
- AsyncStorage key `app_store_review_last_prompted_at` (timestamp ms)

### Integrations
- `expo-store-review` → Play In-App Review / StoreKit
- Existing `openPlayStore()` → `market://` then https listing

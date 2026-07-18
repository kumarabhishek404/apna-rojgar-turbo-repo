# Phase 4 — Testing

## Test Plan

| TC | Covers | Steps | Expected |
|----|--------|-------|----------|
| TC-1 | AC-1 | Submit App Feedback with 5★ (Hindi locale) | Soft prompt in Hindi after success |
| TC-2 | AC-4 | Profile → Rate App | Soft prompt always shown |
| TC-3 | AC-2 | Tap Rate now on Play Store build | Native review sheet (when quota allows) |
| TC-4 | AC-3 | Tap Rate now when review unavailable | Play Store listing opens (`market://` / https) |
| TC-5 | FR-6 | Auto-prompt twice within 90 days | Second auto-prompt suppressed |
| TC-6 | AC-4 | Rate App during cooldown | Soft prompt still shown (`force`) |
| TC-7 | FR-3 | Switch language → Rate App | Alert strings match selected locale |

## Coverage Analysis

| AC | Scenarios | Status |
|----|-----------|--------|
| AC-1 | TC-1 | Planned — device / Play install |
| AC-2 | TC-3 | Planned — Play Store build only |
| AC-3 | TC-4 | Planned |
| AC-4 | TC-2, TC-6 | Planned |
| FR-3 | TC-7 | Planned |
| FR-6 | TC-5 | Planned |

**Note:** Google may suppress the native sheet even when `requestReview()` succeeds (quota). Manual verification on a Play-installed production/internal-testing build is required.

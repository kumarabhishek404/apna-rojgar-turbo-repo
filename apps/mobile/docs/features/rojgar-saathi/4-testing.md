# 4 — Testing: Rojgar Saathi

## Test Plan

| AC | Scenarios |
|----|-----------|
| US-1 suggestions ≤4, role-specific, selected language | TC-1 worker Hindi chips, TC-2 employer English chips, TC-3 max 4 |
| US-2 FIND_WORK uses APIs | TC-4 electrician utterance, TC-5 empty jobs copy |
| US-4 STT fail | TC-6 type fallback |
| US-5 unknown | TC-7 recovery 3 options |
| Security | TC-8 worker cannot list other employer private fields (tools use session APIs) |

## Coverage Analysis
Unit: intent detector (manual). Component: Saathi screen 8 states (manual). API: reuse existing authenticated endpoints. E2E: Maestro later.

[UNDER-COVERED] automated unit runner not in mobile package — planned.

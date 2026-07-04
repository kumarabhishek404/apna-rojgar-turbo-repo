# Automation Gap Report

What Maestro **cannot fully automate** today and what is required to close gaps.

---

## Summary

| Category | Count | % of 665 cases |
|----------|------:|---------------:|
| Generated with `automated` tag | 636 | 95.6% |
| Generated with `manual-review` tag | 29 | 4.4% |
| Fully reliable without changes | ~120 | ~18% |
| Partial (flow exists, flaky/text) | ~480 | ~72% |
| Manual only | ~65 | ~10% |

---

## Gap 1: Missing testIDs

**Impact:** High  
**Affected:** All screens except login + tabs  
**Fix:** Implement `docs/screen-name-testids.md` high-priority list  
**Effort:** 2–3 days dev

---

## Gap 2: OTP / SMS

**Impact:** High  
**Affected:** Login, registration  
**Current workaround:** Staging OTP `000000` + `EXPO_PUBLIC_SKIP_OTP`  
**Production:** Cannot automate real SMS — use staging only

---

## Gap 3: Camera, gallery, selfie

**Impact:** Medium  
**Affected:** Register step 5, profile photo  
**Fix options:**
- Test build flag to inject fake image URI
- Maestro `addMedia` (Android 11+ limited)
- Keep manual

---

## Gap 4: Push notifications

**Impact:** Medium  
**Affected:** Notification tap → deep link  
**Fix:** Firebase test messages or Maestro `pushNotification` (limited)  
**Workaround:** Test in-app notifications inbox only

---

## Gap 5: Permissions dialogs

**Impact:** Medium  
**Affected:** Location, camera, notifications  
**Maestro:** `tapOn: "Allow"` — OS/version dependent  
**Fix:** Grant permissions in emulator before suite via `adb shell pm grant`

---

## Gap 6: API failure injection

**Impact:** Low (QA value high)  
**Affected:** Error states, offline, 500/404  
**Fix:** Charles/Proxyman mock, or backend fault-injection env — not Maestro-native

---

## Gap 7: Localization

**Impact:** Medium  
**Affected:** All text-based selectors  
**Fix:** testIDs + run suites per locale (`-e LOCALE=hi`)

---

## Gap 8: Dynamic data

**Impact:** Medium  
**Affected:** Job cards, applicant lists  
**Fix:** Seed staging DB; use `SAMPLE_JOB_ID` env; assert structure not exact text

---

## Gap 9: Admin panel

**Impact:** Low  
**Affected:** Suspend/activate users  
**Fix:** Dedicated admin test account + testIDs on action buttons

---

## Gap 10: Visual / UI design cases

**Impact:** Low for automation  
**Affected:** Module `90 - UI & Cross-cutting` (39 cases)  
**Fix:** Keep manual or add screenshot comparison (Maestro `assertScreenshot` experimental)

---

## Recommended roadmap

1. **Week 1:** Smoke + auth flows green on staging APK  
2. **Week 2:** Add high-priority testIDs (register, service apply, profile logout)  
3. **Week 3:** Stabilize worker/employer E2E with seeded data  
4. **Week 4:** CI secrets + nightly regression  
5. **Ongoing:** Tighten generated flows as testIDs land

---

## Files to track gaps

- `reports/flow-manifest.json` — per-case `automation` field
- `docs/manual-only-tests.md` — explicit manual list
- Manual CSV: `apps/mobile/docs/testing/apna-rojgar-mobile-test-cases.csv`

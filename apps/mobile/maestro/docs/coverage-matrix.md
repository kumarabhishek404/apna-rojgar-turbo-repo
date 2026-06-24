# Test Coverage Matrix — Maestro vs Manual

Generated from **665** manual cases (`scripts/mobile-test-cases/modules/*`) and Maestro output.

| Module | Manual cases | Maestro generated | Hand-crafted | Automation status |
|--------|-------------:|------------------:|-------------:|-------------------|
| 01 - App Launch | 27 | 27 | 0 | **Partial** — launch/assert; force update manual |
| 02 - Language Selection | 20 | 20 | 0 | **Partial** — UI; Hindi screenshot manual |
| 03 - Login | 19 | 19 | 4 | **Automated** — testIDs + auth helpers |
| 04–07 Registration | 23 | 23 | 0 | **Partial** — needs register testIDs |
| 10 - Home Tab | 32 | 32 | 0 | **Partial** — scroll/assert; API mock manual |
| 11 - Work Tab | 38 | 38 | 0 | **Partial** — search/filter text selectors |
| 12 - People Tab | 26 | 26 | 0 | **Partial** |
| 13 - Activity Tab | 44 | 44 | 0 | **Partial** — sub-tab index params |
| 14 - Profile Tab | 41 | 41 | 0 | **Partial** — photo upload manual |
| 20 - Service Detail | 39 | 39 | 0 | **Partial** — apply flow needs testIDs |
| 21 - Post Job Wizard | 41 | 41 | 0 | **Partial** — multi-step; image step manual |
| 22 - User Profile | 32 | 32 | 0 | **Partial** |
| 23 - Bookings | 26 | 26 | 0 | **Partial** |
| 24 - Attendance | 18 | 18 | 0 | **Partial** |
| 25 - Team & Mediator | 22 | 22 | 0 | **Partial** |
| 26 - Reviews | 18 | 18 | 0 | **Partial** |
| 27 - Notifications | 26 | 26 | 0 | **Partial** — push manual |
| 28 - Deep Links | 15 | 15 | 1 | **Automated** — `job-deep-link.yaml` |
| 29 - Experience | 11 | 11 | 0 | **Partial** |
| 31 - Help & Support | 38 | 38 | 0 | **Partial** |
| 40 - Admin Panel | 50 | 50 | 1 | **Partial** — admin-smoke.yaml |
| 50 - Accessibility & Inputs | 20 | 20 | 0 | **Manual** — TTS, camera, map |
| 90 - UI & Cross-cutting | 39 | 39 | 0 | **Manual** — visual/locale checks |

---

## Suite coverage

| Suite | Flows | Est. runtime | When to run |
|-------|------:|-------------|-------------|
| Smoke | 1 | ~3 min | Every PR |
| Role E2E (×3) | 3 | ~10 min | Nightly |
| Admin smoke | 1 | ~2 min | Nightly |
| Hand-crafted auth/tabs | 5 | ~5 min | PR optional |
| Generated (full) | 665 | Hours | Weekly / release candidate |

---

## Flow coverage matrix (business journeys)

| Journey | Automated | Partial | Manual only |
|---------|-----------|---------|-------------|
| Worker login → browse → apply | | ✓ | |
| Employer login → post job | | ✓ | |
| Mediator team apply | | ✓ | |
| Admin user management | | ✓ | |
| OTP resend / invalid | ✓ | | |
| Session restore | ✓ | | |
| Deep link to job | ✓ | | |
| Push notification open | | | ✓ |
| Camera / selfie registration | | | ✓ |
| Biometric login | | | ✓ |
| Offline / API 500 injection | | | ✓ |
| Hindi UI visual regression | | | ✓ |

---

## Legend

- **Automated** — Reliable Maestro run with testIDs / stable text
- **Partial** — Flow exists; may need testIDs, test data, or human verification
- **Manual only** — Cannot automate without test hooks or device features

Regenerate: `pnpm generate:maestro-flows`  
Manifest: `reports/flow-manifest.json`

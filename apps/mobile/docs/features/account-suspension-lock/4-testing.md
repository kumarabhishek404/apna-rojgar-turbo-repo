# 4 — Testing: Account Suspension Lock Screen

## Test Plan

| ID | Covers | Type | Steps | Expected |
|----|--------|------|-------|----------|
| TC-1 | AC US-1 | Manual / Maestro | Log in as SUSPENDED user | `account-suspended-screen` visible; tabs not usable |
| TC-2 | AC US-1 | Manual | Confirm Hindi (or selected locale) title + policy text + `info@apnarojgarindia.com` | Exact copy from locales |
| TC-3 | AC US-1 | Manual | Tap email | Mail app opens with reactivation subject/body |
| TC-4 | AC US-2 | Manual | Complete OTP as suspended user | Lock screen, no register/home |
| TC-5 | AC US-3 | Manual | Suspend user in admin while app is open; trigger any API | Overlay appears without logout |
| TC-6 | AC US-4 | Manual | Admin sets ACTIVE; tap Check status | Overlay dismissed, app usable |
| TC-7 | AC US-4 | Manual | Tap Log out | Login screen; can sign in as another user |
| TC-8 | Security | Manual | Tap a push notification while suspended | Stays on lock screen |
| TC-9 | Security | Manual | Open a job deep link while suspended | Stays on lock screen |
| TC-10 | Edge | Manual | Android back | Stays on lock screen |

Maestro flow `TC-GLB-024` now asserts `account-suspended-screen` instead of logout.

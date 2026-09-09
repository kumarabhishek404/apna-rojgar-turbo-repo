# 5 — Documentation: Account Suspension Lock Screen

## Architecture Decision Records

### ADR-001 — Overlay lock instead of logging the user out
Suspended users keep their session and see a full-screen overlay. Logging them out hid the reason and the support email. Overlay keeps Expo Router mounted so logout and “check status” still work.

### ADR-002 — Skip Stitch
This is a system lock screen, visually aligned with the existing red inactive-account card. No separate visual exploration.

## Release Notes

**What's new:** If administration suspends an account for policy violations, that person can no longer use the app. They only see a message explaining the suspension and the email `info@apnarojgarindia.com` to request reactivation.

**How to ask for access again:** Open the email button on that screen, or write to `info@apnarojgarindia.com`. After an admin reactivates the account, tap **स्थिति जाँचें** / **Check status**.

## Operator note
Admin suspend/activate remains the existing admin users flow. No new API. Client lock is driven by `user.status === "SUSPENDED"`.

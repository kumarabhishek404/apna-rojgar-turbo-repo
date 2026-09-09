# 2 — Prototype: Account Suspension Lock Screen

**Approach:** Extend existing product (InactiveAccountMessage / ForceUpdateScreen).

**Stitch:** Skipped (D-6) — single system lock screen.

## Screen inventory

### S-1 Account suspended (lock)

| State | Behaviour |
|-------|-----------|
| Default | Red card: title, policy message, `info@apnarojgarindia.com`, email button, check-status, logout |
| Loading | Full-screen loader while checking status or logging out |
| Empty | N/A — screen only exists when status is SUSPENDED |
| Success | Check-status + ACTIVE → overlay dismissed, app resumes |
| Error | Mailer failed → toast with the email address; check-status still suspended → info toast |
| Validation | N/A |
| Permission | N/A — this screen *is* the permission-denied state |
| Offline | Check-status fails with existing refresh-user error handling; email button still works |

Android back button is consumed so the user cannot return to previous screens.

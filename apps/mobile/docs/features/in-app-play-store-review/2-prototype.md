# Phase 2 — Prototype

**Status:** Skipped (D-4)

No custom screens. Soft prompt uses React Native `Alert` (existing pattern). Native review UI is owned by Google Play / App Store.

### Soft prompt (selected language)

| Element | i18n key |
|---------|----------|
| Menu label | `rateApp` |
| Alert title | `rateAppTitle` |
| Alert message | `rateAppMessage` |
| Primary action | `rateAppNow` |
| Cancel | `rateAppLater` |

### Interaction states (soft prompt)

| State | Behavior |
|-------|----------|
| Default | Alert with title/message/buttons in selected locale |
| Loading | N/A (native review may take a moment) |
| Empty | N/A |
| Success | Native sheet shown, or Play Store listing opened |
| Error | Logged; fallback to `openPlayStore()` on Android |
| Validation | N/A |
| Permission | N/A |
| Offline | `openPlayStore()` may still open Play app if installed |

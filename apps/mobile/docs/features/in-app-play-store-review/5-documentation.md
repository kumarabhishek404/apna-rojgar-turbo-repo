# Phase 5 — Documentation

## Architecture Decision Records

### ADR-001 — Soft prompt in app language + native store review

**Context:** Users need a clear way to rate the app; `&reviewId=0` URLs fail in browsers; Play’s review sheet language is OS-controlled.

**Decision:** Show a localized `Alert` (`t()`) first, then `expo-store-review` / Play Store listing fallback.

**Alternatives:** Direct `requestReview()` with no soft prompt; open listing only; `react-native-in-app-review`.

**Consequences:** Soft prompt is understandable and multilingual; native sheet may still appear in device/Play language.

### ADR-002 — Skip Stitch prototyping

**Context:** No custom review UI screens.

**Decision:** Skip Phase 2 visual generation.

## Release Notes

### What’s New
- Rate Apna Rojgar from the app: after a positive App Feedback, or anytime from Profile → **Rate App**.
- The “Rate us?” message appears in your selected language.
- Opens Google Play’s in-app review when available; otherwise opens the Play Store listing.

## Developer notes

```ts
import { promptForAppReview } from "@/utils/appStoreReview";

// Explicit (ignores cooldown)
await promptForAppReview({ force: true });

// After positive feedback (cooldown applies)
promptForAppReviewAfterPositiveFeedback(rating);
```

**Testing tip:** Native dialog only reliably appears on apps installed from Play (internal testing / production), not Expo Go.

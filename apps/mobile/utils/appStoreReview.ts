import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { t } from "@/utils/translationHelper";
import { openPlayStore } from "@/utils/openExternalLink";

const KEYS = {
  lastPromptedAt: "app_store_review_last_prompted_at",
  /** Set when user taps "Rate now" — Play API does not confirm a submitted review. */
  completed: "app_store_review_completed",
  firstSeenAt: "app_store_review_first_seen_at",
  sessionCount: "app_store_review_session_count",
} as const;

/** Gap between soft prompts after "Maybe later". */
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
/** Wait before the first automatic prompt. */
const MIN_DAYS_BEFORE_FIRST_AUTO = 3;
/** Minimum app opens (authenticated sessions) before first automatic prompt. */
const MIN_SESSIONS_BEFORE_FIRST_AUTO = 4;
/** Delay so home UI settles before Alert. */
const AUTO_PROMPT_DELAY_MS = 3000;

type PromptOptions = {
  /** Profile → Rate App: skip cooldown / eligibility; still respects completed for soft prompt. */
  force?: boolean;
};

async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Non-blocking.
  }
}

export async function hasCompletedAppReview(): Promise<boolean> {
  return (await getItem(KEYS.completed)) === "true";
}

async function markAppReviewCompleted(): Promise<void> {
  await setItem(KEYS.completed, "true");
}

async function markPrompted(): Promise<void> {
  await setItem(KEYS.lastPromptedAt, String(Date.now()));
}

async function canShowAfterCooldown(): Promise<boolean> {
  const last = await getItem(KEYS.lastPromptedAt);
  if (!last) return true;
  const lastMs = Number(last);
  if (!Number.isFinite(lastMs)) return true;
  return Date.now() - lastMs >= COOLDOWN_MS;
}

/**
 * Track sessions for auto-prompt eligibility (first open + count).
 */
async function recordSessionForReviewEligibility(): Promise<{
  sessionCount: number;
  daysSinceFirstSeen: number;
}> {
  let firstSeenRaw = await getItem(KEYS.firstSeenAt);
  if (!firstSeenRaw) {
    firstSeenRaw = String(Date.now());
    await setItem(KEYS.firstSeenAt, firstSeenRaw);
  }

  const prevCount = Number((await getItem(KEYS.sessionCount)) || "0");
  const sessionCount = Number.isFinite(prevCount) ? prevCount + 1 : 1;
  await setItem(KEYS.sessionCount, String(sessionCount));

  const firstSeenMs = Number(firstSeenRaw);
  const daysSinceFirstSeen = Number.isFinite(firstSeenMs)
    ? (Date.now() - firstSeenMs) / (24 * 60 * 60 * 1000)
    : 0;

  return { sessionCount, daysSinceFirstSeen };
}

async function isEligibleForAutoPrompt(): Promise<boolean> {
  if (await hasCompletedAppReview()) return false;

  const { sessionCount, daysSinceFirstSeen } =
    await recordSessionForReviewEligibility();

  if (!(await canShowAfterCooldown())) return false;

  return (
    sessionCount >= MIN_SESSIONS_BEFORE_FIRST_AUTO &&
    daysSinceFirstSeen >= MIN_DAYS_BEFORE_FIRST_AUTO
  );
}

/**
 * Opens the native Play / App Store in-app review sheet when available.
 * Falls back to the Play Store listing (no &reviewId=0).
 */
export async function launchAppStoreReview(): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
      return;
    }
  } catch (error) {
    console.warn("[appStoreReview] requestReview failed:", error);
  }

  if (Platform.OS === "android") {
    await openPlayStore();
  }
}

function showSoftPromptAlert(): void {
  Alert.alert(t("rateAppTitle"), t("rateAppMessage"), [
    {
      text: t("rateAppLater"),
      style: "cancel",
      onPress: () => {
        // Time-gap only — will ask again after cooldown.
        void markPrompted();
      },
    },
    {
      text: t("rateAppNow"),
      onPress: () => {
        void (async () => {
          // Treat as reviewed for our app — never auto-prompt again.
          await markAppReviewCompleted();
          await markPrompted();
          await launchAppStoreReview();
        })();
      },
    },
  ]);
}

/**
 * Soft “Rate us?” Alert in the selected app language, then native review / listing.
 *
 * - Auto: skipped if already completed, or cooldown not elapsed.
 * - force (menu): if completed, opens store flow without soft prompt; else shows prompt.
 */
export async function promptForAppReview(
  options: PromptOptions = {},
): Promise<void> {
  const force = options.force === true;
  const completed = await hasCompletedAppReview();

  if (completed) {
    if (force) {
      await launchAppStoreReview();
    }
    return;
  }

  if (!force && !(await canShowAfterCooldown())) {
    return;
  }

  showSoftPromptAlert();
}

/**
 * Call after a positive in-app feedback submit (rating ≥ 4).
 * Respects completed flag + cooldown (does not increment session eligibility).
 */
export function promptForAppReviewAfterPositiveFeedback(
  rating: number,
): void {
  if (typeof rating !== "number" || rating < 4) return;
  void promptForAppReview({ force: false });
}

/**
 * Automatic prompt for logged-in users who have not reviewed yet.
 * Call once when main tabs become ready. Uses time gap + min sessions/days.
 */
export async function maybeAutoPromptForAppReview(): Promise<void> {
  try {
    if (!(await isEligibleForAutoPrompt())) {
      return;
    }

    // Mark cooldown immediately so a remount does not double-prompt.
    await markPrompted();

    setTimeout(() => {
      void (async () => {
        if (await hasCompletedAppReview()) return;
        showSoftPromptAlert();
      })();
    }, AUTO_PROMPT_DELAY_MS);
  } catch (error) {
    console.warn("[appStoreReview] auto prompt failed:", error);
  }
}

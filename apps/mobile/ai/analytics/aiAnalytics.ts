import { trackEvent } from "@/utils/analytics";
import { AnalyticsEvents } from "@/utils/analyticsEvents";

export function trackSaathi(event: string, props?: Record<string, unknown>) {
  trackEvent(event as any, {
    surface: "rojgar_saathi",
    ...(props || {}),
  });
}

export const SaathiEvents = {
  OPENED: AnalyticsEvents.AI_OPENED,
  SUGGESTION_SHOWN: AnalyticsEvents.AI_SUGGESTION_SHOWN,
  SUGGESTION_CLICKED: AnalyticsEvents.AI_SUGGESTION_CLICKED,
  VOICE_STARTED: AnalyticsEvents.AI_VOICE_STARTED,
  VOICE_COMPLETED: AnalyticsEvents.AI_VOICE_COMPLETED,
  INTENT_DETECTED: AnalyticsEvents.AI_INTENT_DETECTED,
  INTENT_FAILED: AnalyticsEvents.AI_INTENT_FAILED,
  ACTION_STARTED: AnalyticsEvents.AI_ACTION_STARTED,
  ACTION_COMPLETED: AnalyticsEvents.AI_ACTION_COMPLETED,
  RESPONSE_RATED: AnalyticsEvents.AI_RESPONSE_RATED,
} as const;

/**
 * Canonical event names for analytics. Keep stable — backend dashboards depend on these strings.
 */
export const AnalyticsEvents = {
  SESSION_START: "session_start",
  APP_FOREGROUND: "app_foreground",
  APP_BACKGROUND: "app_background",

  SERVICE_VIEW: "service_view",
  PROFILE_VIEW: "profile_view",

  SERVICE_APPLY_SUCCESS: "service_apply_success",
  SERVICE_UNAPPLY_SUCCESS: "service_unapply_success",

  WORKER_BOOKING_REQUEST_SUCCESS: "worker_booking_request_success",

  /** User tapped a tel: link — never log phone numbers, only context ids. */
  CALL_TAP: "call_tap",

  AI_OPENED: "ai_opened",
  AI_SUGGESTION_SHOWN: "ai_suggestion_shown",
  AI_SUGGESTION_CLICKED: "ai_suggestion_clicked",
  AI_VOICE_STARTED: "ai_voice_started",
  AI_VOICE_COMPLETED: "ai_voice_completed",
  AI_INTENT_DETECTED: "ai_intent_detected",
  AI_INTENT_FAILED: "ai_intent_failed",
  AI_ACTION_STARTED: "ai_action_started",
  AI_ACTION_COMPLETED: "ai_action_completed",
  AI_RESPONSE_RATED: "ai_response_rated",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsCallMeta = {
  source?: string;
  serviceId?: string;
  viewedUserId?: string;
  workerUserId?: string;
  bookingId?: string;
};

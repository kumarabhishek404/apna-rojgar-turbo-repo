export type SaathiIntent =
  | "FIND_WORK"
  | "VIEW_BOOKINGS"
  | "VIEW_APPLICATIONS"
  | "VIEW_NEARBY_WORK"
  | "VIEW_ACTIVE_WORK"
  | "VIEW_WORKERS"
  | "HIRE_WORKERS"
  | "POST_WORK"
  | "APPLY_JOB"
  | "BOOK_WORKER"
  | "SELECT_RESULT"
  | "VIEW_WORK_STATUS"
  | "VIEW_PROFILE"
  | "HELP"
  | "GREETING"
  | "MORE_OPTIONS"
  | "CONFIRM_YES"
  | "CONFIRM_NO"
  | "SHOW_MORE"
  | "UNKNOWN";

export type DetectedIntent = {
  intent: SaathiIntent;
  skill?: string;
  quantity?: number;
  dateHint?: "today" | "tomorrow" | "soon" | string;
  locationHint?: string;
  distanceKm?: number;
  payPerDay?: number;
  durationDays?: number;
  selectedIndex?: number;
  raw: string;
  source?: "gemini" | "rules" | "suggestion";
};

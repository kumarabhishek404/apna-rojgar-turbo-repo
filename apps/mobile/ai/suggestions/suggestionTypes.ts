import type { AppUserRole } from "@/utils/resolveDisplayUserRole";

export type SuggestionId =
  | "find_work"
  | "nearby_work"
  | "applications"
  | "bookings"
  | "today_booking"
  | "hire_workers"
  | "active_work"
  | "employer_applications"
  | "post_work"
  | "available_workers"
  | "pending_requirements"
  | "profile"
  | "more"
  | "confirm_yes"
  | "confirm_no";

export type SuggestionChip = {
  id: SuggestionId;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  intent:
    | "FIND_WORK"
    | "VIEW_NEARBY_WORK"
    | "VIEW_APPLICATIONS"
    | "VIEW_BOOKINGS"
    | "HIRE_WORKERS"
    | "VIEW_ACTIVE_WORK"
    | "POST_WORK"
    | "APPLY_JOB"
    | "BOOK_WORKER"
    | "VIEW_WORKERS"
    | "VIEW_PROFILE"
    | "MORE_OPTIONS"
    | "CONFIRM_YES"
    | "CONFIRM_NO";
  score: number;
  icon: string;
  replyKey?: string;
};

export type UpcomingBooking = {
  id: string;
  startDate?: string;
  hoursUntil: number | null;
  title?: string;
  address?: string;
};

export type SaathiSnapshot = {
  role: AppUserRole;
  userName: string;
  locale: string;
  skills: string[];
  primarySkill?: string;
  profileIncomplete: boolean;
  locationLabel?: string;
  address?: string;
  geoLocation?: unknown;
  userId?: string;
  upcomingBookings: UpcomingBooking[];
  applications: { total: number; pending: number; accepted: number };
  applicationRows?: Array<{ id: string; title: string; status: string }>;
  nearbyJobs: { count: number; nearestKm: number | null; skill?: string };
  postedWorks: Array<{
    id: string;
    status?: string;
    type?: string;
    appliedCount: number;
    neededCount: number;
    selectedCount: number;
  }>;
  bookedWorkersCount: number;
  teamMemberCount: number;
};

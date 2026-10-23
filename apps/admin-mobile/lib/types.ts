export type AdminUser = {
  _id: string;
  name?: string;
  mobile?: string;
  countryCode?: string;
  role?: string;
  status?: string;
  registrationSource?: string | null;
  createdAt?: string;
  profilePicture?: string;
  email?: { value?: string; isVerified?: boolean } | string;
  gender?: string;
  age?: string;
  address?: string;
  verification?: string;
  skills?: Array<{ skill?: string; pricePerDay?: number | null } | string>;
  rating?: { average?: number; count?: number };
  dateOfBirth?: string;
  aadhaarNumber?: string;
  updatedAt?: string;
  notificationConsent?: boolean;
  numberOfWorkersInTeam?: number;
  geoLocation?: { coordinates?: number[] };
  likedUsers?: unknown[];
  likedServices?: unknown[];
  likedBy?: unknown[];
  bookingRequestBy?: unknown[];
  myBookings?: unknown[];
  bookedBy?: unknown[];
  savedAddresses?: unknown[];
  workDetails?: Record<string, unknown>;
  serviceDetails?: Record<string, unknown>;
  mediatorDetails?: Record<string, unknown>;
  earnings?: { work?: number; rewards?: number };
  spent?: { work?: number; tip?: number };
  locale?: { language?: string };
};

export type UserStats = {
  total: number;
  admin: number;
  workers: number;
  mediators: number;
  employers: number;
  unassigned: number;
  verification: { pending: number; applied: number; completed: number };
};

export type CityOption = { city: string; count: number };
export type SkillOption = { skill: string; count: number };

export type ServicePerson = {
  _id?: string;
  name?: string;
  mobile?: string;
  role?: string;
  countryCode?: string;
  profilePicture?: string;
  status?: string;
  registrationSource?: string;
  address?: string;
  email?: { value?: string };
};

export type AdminService = {
  _id: string;
  jobID?: string;
  bookingType?: string;
  status?: string;
  type?: string;
  subType?: string;
  description?: string;
  address?: string;
  startDate?: string;
  duration?: number;
  images?: string[];
  facilities?: Record<string, boolean>;
  selectedUsers?: unknown[];
  likedBy?: unknown[];
  uploadStatus?: string;
  appliedSkill?: unknown;
  requirements?: Array<{
    name?: string;
    count?: number;
    payPerDay?: number;
    food?: boolean;
    living?: boolean;
    pf?: boolean;
    insurance?: boolean;
  }>;
  appliedUsers?: Array<{
    user?: ServicePerson | string;
    skill?: string;
    appliedSkills?: string[];
    applicantType?: string;
    status?: string;
    workers?: Array<{ worker?: ServicePerson | string; skill?: string; status?: string }>;
  }>;
  employer?: ServicePerson | string;
  bookedWorker?: ServicePerson | string | null;
  createdAt?: string;
  listingFeature?: {
    enabled?: boolean;
    days?: number;
    expiresAt?: string;
  };
  geoLocation?: { coordinates?: number[] };
  socialMediaPromotion?: {
    enabled?: boolean;
    status?: string;
    orderId?: string;
    amount?: number;
    paidAt?: string;
  };
};

export type ServiceStats = {
  total?: number;
  hiring?: number;
  completed?: number;
  cancelled?: number;
  pending?: number;
  rejected?: number;
  promoted?: number;
  featured?: number;
};

export type ErrorLog = {
  _id: string;
  message?: string;
  apiRoute?: string;
  method?: string;
  statusCode?: number;
  createdAt?: string;
  user?: { name?: string; mobile?: string };
};

export type AnalyticsKpis = {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  sessionStarts: number;
  appForeground: number;
  appBackground: number;
  serviceViews: number;
  profileViews: number;
  callTaps: number;
  serviceApplies: number;
  serviceUnapplies: number;
  bookingRequests: number;
};

export type DailyPoint = {
  date: string;
  [eventName: string]: string | number;
};

export type AnalyticsSummary = {
  kpis: AnalyticsKpis;
  dailySessions: DailyPoint[];
  dailyViews: DailyPoint[];
  dailyCalls: DailyPoint[];
  dailyConversions: DailyPoint[];
  byCategory: Array<{ category: string; count: number }>;
  byPlatform: Array<{ platform: string; count: number }>;
  byHourWeekday: Array<{
    name: string;
    data: Array<{ x: string; y: number }>;
  }>;
  byEvent: Array<{ eventName: string; count: number }>;
};

export type AppEvent = {
  _id: string;
  eventName?: string;
  platform?: string;
  sessionId?: string;
  serverTimestamp?: string;
  userId?: { name?: string; mobile?: string };
};

export function emailOf(user?: { email?: AdminUser["email"] }) {
  const email = user?.email;
  if (!email) return "";
  if (typeof email === "string") return email;
  return email.value || "";
}

export function personName(value: ServicePerson | string | null | undefined) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.name?.trim() || value.mobile || "Unnamed";
}

export function missingProfileFields(user: AdminUser) {
  const missing: string[] = [];
  if (!user.name?.trim()) missing.push("Name");
  if (!user.address?.trim()) missing.push("Address");
  if (!user.gender?.trim()) missing.push("Gender");
  return missing;
}

export function formatWhen(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shortDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(5);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

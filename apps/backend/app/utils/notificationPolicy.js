const IST_TIMEZONE = "Asia/Kolkata";

export const NOTIFICATION_PRIORITIES = {
  URGENT: "URGENT",
  HIGH: "HIGH",
  NORMAL: "NORMAL",
  LOW: "LOW",
};

export const NOTIFICATION_CATEGORIES = {
  TRANSACTIONAL: "TRANSACTIONAL",
  REMINDER: "REMINDER",
  DISCOVERY: "DISCOVERY",
  SYSTEM: "SYSTEM",
};

const DISCOVERY_TYPES = new Set([
  "NEW_SERVICE_LIVE",
  "NEW_SERVICE_ARRIVED_OF_SKILL",
]);

const REMINDER_TYPES = new Set([
  "PENDING_REQUEST_REMINDER",
  "EMPLOYER_PENDING_APPLICATIONS_REMINDER",
  "PENDING_DIRECT_BOOKING_REMINDER",
  "PROFILE_COMPLETION_REMINDER",
]);

const PROMO_TYPES = new Set(["PAID_SERVICE_PROMOTION"]);

const URGENT_TYPES = new Set([
  "PROFILE_SUSPEND",
  "SYSTEM_ERROR_ALERT",
  "ADMIN_NEW_USER_ALERT",
  "ADMIN_NEW_SERVICE_ALERT",
  "SERVICE_CANCELLED",
  "SERVICE_CANCELLED_BY_EMPLOYER",
  "SERVICE_DIRECT_BOOKING_CANCELLED_BY_EMPLOYER",
  "BOOKING_CANCELLED_BY_EMPLOYER",
  "BOOKING_CANCELLED_BY_MEDIATOR",
  "BOOKING_CANCELLED_BY_USER",
]);

const HIGH_PRIORITY_TYPES = new Set([
  "SELECTED_IN_SERVICE",
  "SELECTED_AS_MEDIATOR",
  "GET_A_BOOKING_INVITATION_FROM_EMPLOYER",
  "BOOKING_REQUEST_ACCEPTED_BY_USER",
  "BOOKING_REQUEST_REJECTED_BY_USER",
  "GET_AN_TEAM_JOINING_INVITATION_FROM_MEDIATOR",
  "ACCEPTED_TEAM_JOINING_REQUEST_BY_WORKER",
  "REJECTED_TEAM_JOINING_REQUEST_BY_WORKER",
]);

const numberFromEnv = (name, fallback) => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const getNotificationPolicy = (type) => {
  const normalizedType = String(type || "").trim().toUpperCase();

  if (DISCOVERY_TYPES.has(normalizedType)) {
    return {
      category: NOTIFICATION_CATEGORIES.DISCOVERY,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      cooldownHours: numberFromEnv("NOTIFICATION_DISCOVERY_COOLDOWN_HOURS", 12),
      dailyCap: numberFromEnv("NOTIFICATION_DISCOVERY_DAILY_CAP", 3),
      respectQuietHours: true,
      digestWindowMinutes: numberFromEnv(
        "NOTIFICATION_DISCOVERY_DIGEST_MINUTES",
        60,
      ),
    };
  }

  if (PROMO_TYPES.has(normalizedType)) {
    return {
      category: NOTIFICATION_CATEGORIES.DISCOVERY,
      priority: NOTIFICATION_PRIORITIES.LOW,
      cooldownHours: numberFromEnv("NOTIFICATION_PROMO_COOLDOWN_HOURS", 7 * 24),
      dailyCap: numberFromEnv("NOTIFICATION_PROMO_DAILY_CAP", 1),
      respectQuietHours: true,
      digestWindowMinutes: 0,
    };
  }

  if (REMINDER_TYPES.has(normalizedType)) {
    const isProfileReminder =
      normalizedType === "PROFILE_COMPLETION_REMINDER";
    const isEmployerApplications =
      normalizedType === "EMPLOYER_PENDING_APPLICATIONS_REMINDER";
    return {
      category: NOTIFICATION_CATEGORIES.REMINDER,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      cooldownHours: isProfileReminder
        ? numberFromEnv("NOTIFICATION_PROFILE_COOLDOWN_HOURS", 25 * 24)
        : isEmployerApplications
          ? numberFromEnv(
              "NOTIFICATION_EMPLOYER_APPLICATION_COOLDOWN_HOURS",
              24,
            )
          : numberFromEnv("NOTIFICATION_REMINDER_COOLDOWN_HOURS", 48),
      dailyCap: numberFromEnv("NOTIFICATION_REMINDER_DAILY_CAP", 3),
      respectQuietHours: true,
      digestWindowMinutes: 0,
    };
  }

  if (
    normalizedType === "SYSTEM_ERROR_ALERT" ||
    normalizedType === "ADMIN_NEW_USER_ALERT" ||
    normalizedType === "ADMIN_NEW_SERVICE_ALERT"
  ) {
    return {
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      cooldownHours: 0,
      dailyCap: 0,
      respectQuietHours: false,
      digestWindowMinutes: 0,
    };
  }

  return {
    category: NOTIFICATION_CATEGORIES.TRANSACTIONAL,
    priority: URGENT_TYPES.has(normalizedType)
      ? NOTIFICATION_PRIORITIES.URGENT
      : HIGH_PRIORITY_TYPES.has(normalizedType)
        ? NOTIFICATION_PRIORITIES.HIGH
        : NOTIFICATION_PRIORITIES.NORMAL,
    cooldownHours: 0,
    dailyCap: 0,
    respectQuietHours: false,
    digestWindowMinutes: 0,
  };
};

const getIstClock = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return { hour: value("hour"), minute: value("minute") };
};

export const getQuietHoursState = (date = new Date()) => {
  const startHour = numberFromEnv("NOTIFICATION_QUIET_START_HOUR_IST", 21);
  const endHour = numberFromEnv("NOTIFICATION_QUIET_END_HOUR_IST", 8);
  const { hour, minute } = getIstClock(date);
  const isQuiet = hour >= startHour || hour < endHour;

  if (!isQuiet) {
    return { isQuiet: false, scheduledFor: null };
  }

  const minutesUntilEnd =
    hour >= startHour
      ? (24 - hour + endHour) * 60 - minute
      : (endHour - hour) * 60 - minute;

  return {
    isQuiet: true,
    scheduledFor: new Date(date.getTime() + Math.max(1, minutesUntilEnd) * 60_000),
  };
};

export const getIstDayStart = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type) =>
    parts.find((part) => part.type === type)?.value || "";
  return new Date(
    `${value("year")}-${value("month")}-${value("day")}T00:00:00+05:30`,
  );
};

export const buildNotificationDedupKey = (type, data = {}) => {
  const target =
    data.serviceId ||
    data.invitationId ||
    data.requestId ||
    data.actionBy ||
    data.actionOn ||
    "general";
  return `${String(type || "UNKNOWN").toUpperCase()}:${String(target)}`;
};

export const enrichNotificationData = (data = {}) => {
  const normalized = { ...data };
  const serviceId =
    normalized.serviceId ||
    (normalized.type === "JOB" ? normalized.id : null);

  if (serviceId && !normalized.url) {
    normalized.url = `apnarojgar://job/${serviceId}`;
    normalized.type = normalized.type || "JOB";
    normalized.id = normalized.id || String(serviceId);
  } else if (!normalized.url) {
    normalized.url = "apnarojgar://screens/notifications";
    normalized.type = normalized.type || "NOTIFICATIONS";
  }

  return normalized;
};

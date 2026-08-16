import { router } from "expo-router";

const TEAM_TYPES = new Set([
  "GET_AN_TEAM_JOINING_INVITATION_FROM_MEDIATOR",
  "TEAM_JOINING_INVITATION_CANCELLERD_BY_MEDIATOR",
  "REMOVED_FROM_TEAM_BY_MEDIATOR",
  "ACCEPTED_TEAM_JOINING_REQUEST_BY_WORKER",
  "REJECTED_TEAM_JOINING_REQUEST_BY_WORKER",
  "WOREKR_LEFT_FROM_TEAM",
]);

const PROFILE_TYPES = new Set([
  "PROFILE_ACTIVE",
  "PROFILE_SUSPEND",
  "PROFILE_COMPLETION_REMINDER",
]);

function asId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id?: unknown })._id || "").trim();
  }
  return String(value).trim();
}

/**
 * Open the user-facing screen for a notification.
 * Admin accounts use the same employer/worker/mediator screens — no admin routes.
 */
export function openNotificationTarget(payload: {
  type?: unknown;
  data?: Record<string, unknown> | null;
} | null | undefined) {
  const data = (payload?.data || {}) as Record<string, unknown>;
  const type = String(payload?.type || data.type || "").toUpperCase();
  const serviceId = asId(data.serviceId);

  if (serviceId) {
    router.push({
      pathname: "/screens/service/[id]",
      params: { id: serviceId },
    });
    return;
  }

  if (TEAM_TYPES.has(type)) {
    router.push({
      pathname: "/screens/teamRequests",
      params: { title: "teamJoiningRequest", initialCategory: "RECEIVED" },
    });
    return;
  }

  if (PROFILE_TYPES.has(type)) {
    router.push("/(tabs)/fifth");
    return;
  }

  if (type === "SYSTEM_ERROR_ALERT") {
    router.push("/screens/notifications");
    return;
  }

  router.push("/(tabs)/fourth");
}

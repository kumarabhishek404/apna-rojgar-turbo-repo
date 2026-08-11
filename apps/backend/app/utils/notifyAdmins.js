import { Expo } from "expo-server-sdk";
import Notification from "../models/notification.model.js";
import db from "../models/index.js";
import User from "../models/user.model.js";
import { getNotificationMessage } from "./notificationHelper.js";

const Device = db.device;
const expo = new Expo();

const ADMIN_MOBILE = String(process.env.ADMIN_MOBILE || "").trim();
const DEFAULT_THROTTLE_MS = 3 * 60 * 1000;
const lastNotifiedAt = new Map();

const canDeliverNotifications = () => process.env.NODE_ENV === "production";

/**
 * Active admin accounts: role ADMIN, plus ADMIN_MOBILE bridge user.
 */
export const getAdminUsers = async () => {
  const query = {
    status: "ACTIVE",
    $or: [{ role: "ADMIN" }],
  };

  if (ADMIN_MOBILE) {
    query.$or.push({ mobile: ADMIN_MOBILE });
  }

  return User.find(query).select(
    "_id name mobile role locale.language notificationConsent status",
  );
};

/**
 * Notify every admin with an in-app record + Expo push.
 * Intended for system events (errors, new users, new services).
 */
export const notifyAllAdmins = async ({
  key,
  params = {},
  data = {},
  throttleKey = null,
  throttleMs = DEFAULT_THROTTLE_MS,
  bypassQuietHours = true,
} = {}) => {
  if (!key) {
    console.warn("[notifyAllAdmins] Missing notification key.");
    return { success: false, sent: 0, reason: "MISSING_KEY" };
  }

  if (!canDeliverNotifications()) {
    console.log(
      `[notifyAllAdmins] Skipped '${key}' in '${process.env.NODE_ENV || "development"}' mode.`,
    );
    return { success: false, sent: 0, reason: "NON_PRODUCTION" };
  }

  if (throttleKey) {
    const now = Date.now();
    const previous = lastNotifiedAt.get(throttleKey) || 0;
    if (now - previous < throttleMs) {
      return { success: false, sent: 0, reason: "THROTTLED" };
    }
    lastNotifiedAt.set(throttleKey, now);
  }

  try {
    const admins = await getAdminUsers();
    if (!admins.length) {
      console.warn("[notifyAllAdmins] No active admin users found.");
      return { success: false, sent: 0, reason: "NO_ADMINS" };
    }

    const adminIds = admins.map((admin) => admin._id);
    const devices = await Device.find({
      userId: { $in: adminIds },
      isActive: true,
    });

    const devicesByUser = new Map();
    for (const device of devices) {
      if (!Expo.isExpoPushToken(device.pushToken)) continue;
      const userKey = String(device.userId);
      if (!devicesByUser.has(userKey)) devicesByUser.set(userKey, []);
      devicesByUser.get(userKey).push(device);
    }

    const pushMessages = [];
    let saved = 0;
    let sent = 0;

    for (const admin of admins) {
      const language = admin?.locale?.language || "hi";
      const localizedMessage = getNotificationMessage(key, language, {
        appName: "KAARYA",
        ...params,
      });

      if (!localizedMessage?.title || !localizedMessage?.message) {
        console.warn(
          `[notifyAllAdmins] Missing template '${key}' for language '${language}'.`,
        );
        continue;
      }

      const payload = {
        ...data,
        type: data.type || key,
        url: data.url || "apnarojgar://screens/notifications",
      };

      const notification = await Notification.create({
        userId: admin._id,
        category: "SYSTEM",
        priority: "URGENT",
        type: key,
        title: localizedMessage.title,
        body: localizedMessage.message,
        data: payload,
        status: "PENDING",
        source: "ADMIN",
      });
      saved += 1;

      const adminDevices = devicesByUser.get(String(admin._id)) || [];
      if (adminDevices.length === 0) {
        notification.failureReason = "NO_VALID_PUSH_TOKEN";
        await notification.save();
        continue;
      }

      for (const device of adminDevices) {
        pushMessages.push({
          to: device.pushToken,
          sound: "default",
          priority: "high",
          title: localizedMessage.title,
          body: localizedMessage.message,
          data: {
            ...payload,
            notificationId: String(notification._id),
          },
        });
      }

      notification.status = "SENT";
      notification.sentAt = new Date();
      notification.deliveryAttempts = 1;
      await notification.save();
      sent += 1;
    }

    if (pushMessages.length > 0) {
      const chunks = expo.chunkPushNotifications(pushMessages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (pushError) {
          console.error("[notifyAllAdmins] Expo push chunk failed:", pushError);
        }
      }
    }

    console.log(
      `[notifyAllAdmins] key=${key} admins=${admins.length} saved=${saved} sent=${sent} pushes=${pushMessages.length} bypassQuietHours=${bypassQuietHours}`,
    );

    return {
      success: sent > 0 || saved > 0,
      admins: admins.length,
      saved,
      sent,
      pushes: pushMessages.length,
    };
  } catch (error) {
    console.error("[notifyAllAdmins] Failed:", error);
    return {
      success: false,
      sent: 0,
      reason: error?.message || "NOTIFY_FAILED",
    };
  }
};

export const notifyAdminsOfError = async ({
  message,
  source = "backend",
  route = "unknown",
  errorLogId = null,
}) =>
  notifyAllAdmins({
    key: "SYSTEM_ERROR_ALERT",
    params: {
      source,
      route: String(route).slice(0, 80),
      errorMessage: String(message || "Unknown error").slice(0, 120),
    },
    data: {
      type: "SYSTEM_ERROR_ALERT",
      errorLogId: errorLogId ? String(errorLogId) : "",
      source,
      route: String(route).slice(0, 120),
      url: "apnarojgar://screens/notifications",
    },
    throttleKey: `${source}:${String(message || "").slice(0, 80)}`,
    throttleMs: DEFAULT_THROTTLE_MS,
  });

export const notifyAdminsOfNewUser = async (user) => {
  if (!user?._id) return { success: false, sent: 0, reason: "MISSING_USER" };

  const name = user.name || "New user";
  const mobile = user.mobile || "-";
  const source = user.registrationSource || "unknown";

  return notifyAllAdmins({
    key: "ADMIN_NEW_USER_ALERT",
    params: {
      userName: name,
      mobile,
      registrationSource: source,
    },
    data: {
      type: "ADMIN_NEW_USER",
      userId: String(user._id),
      mobile: String(mobile),
      url: "apnarojgar://screens/notifications",
    },
    throttleKey: null,
  });
};

export const notifyAdminsOfNewService = async (service, employer = null) => {
  if (!service?._id) {
    return { success: false, sent: 0, reason: "MISSING_SERVICE" };
  }

  const employerName =
    employer?.name || service?.employer?.name || "Employer";
  const serviceName =
    service?.type || service?.subType || service?.jobID || "New work";
  const jobID = service?.jobID || "-";

  return notifyAllAdmins({
    key: "ADMIN_NEW_SERVICE_ALERT",
    params: {
      employerName,
      serviceName,
      jobID,
    },
    data: {
      type: "JOB",
      id: String(service._id),
      serviceId: String(service._id),
      jobID: String(jobID),
      url: `apnarojgar://job/${service._id}`,
    },
    throttleKey: null,
  });
};

export default notifyAllAdmins;

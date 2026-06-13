import { Expo } from "expo-server-sdk";
import Notification from "../models/notification.model.js";
import db from "../models/index.js";
import User from "../models/user.model.js";
import { getNotificationMessage } from "./notificationHelper.js";

const ADMIN_MOBILE = process.env.ADMIN_MOBILE?.trim() || "6397308499";
const THROTTLE_MS = 3 * 60 * 1000;
const lastNotifiedAt = new Map();

let expo = new Expo();
const Device = db.device;

const canDeliverNotifications = () => process.env.NODE_ENV === "production";

/**
 * Sends a push notification to the admin user when a system error is logged.
 * Throttled to avoid flooding on repeated failures.
 */
const notifyAdminOnError = async ({
  message,
  source = "backend",
  route = "unknown",
  errorLogId = null,
}) => {
  if (!canDeliverNotifications()) {
    console.log(
      `[notifyAdminOnError] Skipped in '${process.env.NODE_ENV || "development"}' mode.`,
    );
    return;
  }

  const throttleKey = `${source}:${String(message || "").slice(0, 80)}`;
  const now = Date.now();
  if (now - (lastNotifiedAt.get(throttleKey) || 0) < THROTTLE_MS) {
    return;
  }
  lastNotifiedAt.set(throttleKey, now);

  try {
    const admin = await User.findOne({ mobile: ADMIN_MOBILE }).select(
      "_id locale.language status notificationConsent",
    );

    if (!admin) {
      console.warn(
        `[notifyAdminOnError] Admin user not found for mobile ${ADMIN_MOBILE}`,
      );
      return;
    }

    if (admin.status !== "ACTIVE") {
      console.log("[notifyAdminOnError] Admin account is not active.");
      return;
    }

    const language = admin?.locale?.language || "hi";
    const truncatedMessage = String(message || "Unknown error").slice(0, 120);
    const localizedMessage = getNotificationMessage(
      "SYSTEM_ERROR_ALERT",
      language,
      {
        source,
        route: String(route).slice(0, 80),
        errorMessage: truncatedMessage,
      },
    );

    const data = {
      type: "SYSTEM_ERROR_ALERT",
      errorLogId: errorLogId ? String(errorLogId) : "",
      source,
      route: String(route).slice(0, 120),
    };

    const notification = await Notification.create({
      userId: admin._id,
      type: "SYSTEM_ERROR_ALERT",
      title: localizedMessage?.title,
      body: localizedMessage?.message,
      data,
      status: "PENDING",
    });

    const devices = await Device.find({ userId: admin._id, isActive: true });
    const messages = devices
      .filter((device) => Expo.isExpoPushToken(device.pushToken))
      .map((device) => ({
        to: device.pushToken,
        sound: "default",
        title: localizedMessage?.title,
        body: localizedMessage?.message,
        data,
      }));

    if (messages.length === 0) {
      console.log("[notifyAdminOnError] No active admin devices with valid tokens.");
      return;
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    notification.status = "SENT";
    await notification.save();

    console.log(
      `[notifyAdminOnError] Alert sent to admin (${ADMIN_MOBILE}) for error ${errorLogId || "n/a"}.`,
    );
  } catch (err) {
    console.error("[notifyAdminOnError] Failed to notify admin:", err);
  }
};

export default notifyAdminOnError;

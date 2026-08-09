import { Expo } from "expo-server-sdk";
import Notification from "../models/notification.model.js";
import db from "../models/index.js";
import User from "../models/user.model.js";
import { getNotificationMessage } from "../utils/notificationHelper.js";
import logError from "../utils/addErrorLog.js";
import NotificationMetric from "../models/notificationMetric.model.js";
import {
  buildNotificationDedupKey,
  enrichNotificationData,
  getIstDayStart,
  getNotificationPolicy,
  getQuietHoursState,
} from "../utils/notificationPolicy.js";

let expo = new Expo();
const Device = db.device;
const isProd = process.env.NODE_ENV === "production";

/**
 * Allow real push delivery only from deployed production runtime.
 * Local/dev sessions must never send notifications to real users.
 */
const canDeliverNotifications = () => isProd;

const recordNotificationMetric = async (metric) => {
  try {
    await NotificationMetric.create(metric);
  } catch (error) {
    console.error("[Notification Metric] Failed to record metric:", error);
  }
};

const getValidDevices = async (userId) => {
  const devices = await Device.find({ userId, isActive: true });
  return devices.filter((device) => Expo.isExpoPushToken(device.pushToken));
};

const deliverStoredNotification = async (notification, devices) => {
  const messages = devices.map((device) => ({
    to: device.pushToken,
    sound: notification.priority === "LOW" ? undefined : "default",
    title: notification.title,
    body: notification.body,
    data: {
      ...(notification.data?.toObject?.() || notification.data || {}),
      notificationId: String(notification._id),
    },
    priority:
      notification.priority === "URGENT" || notification.priority === "HIGH"
        ? "high"
        : "default",
  }));

  if (messages.length === 0) {
    notification.status = "FAILED";
    notification.failureReason = "NO_VALID_PUSH_TOKEN";
    notification.deliveryAttempts += 1;
    await notification.save();
    return { success: false, message: "No valid Expo push tokens found" };
  }

  const tickets = [];
  try {
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
  } catch (error) {
    notification.status = "FAILED";
    notification.failureReason = error?.message || "EXPO_SEND_FAILED";
    notification.deliveryAttempts += 1;
    await notification.save();
    return { success: false, message: notification.failureReason };
  }

  const successfulTickets = tickets.filter((ticket) => ticket.status === "ok");
  notification.providerTickets = tickets;
  notification.deliveryAttempts += 1;
  notification.sentAt = new Date();
  notification.scheduledFor = null;

  if (successfulTickets.length === 0) {
    notification.status = "FAILED";
    notification.failureReason =
      tickets.find((ticket) => ticket.message)?.message ||
      "EXPO_PROVIDER_REJECTED";
    await notification.save();
    return { success: false, message: notification.failureReason };
  }

  notification.status = "SENT";
  notification.failureReason = "";
  await notification.save();
  return {
    success: true,
    message: "Notification sent successfully",
    tickets,
  };
};

const sendBatchNotifications = async (userIds, messageData, req) => {
  try {
    if (!canDeliverNotifications()) {
      console.log(
        `[Notification] Skipped batch send in '${process.env.NODE_ENV || "development"}' mode.`,
      );
      return {
        success: false,
        message: "Notification delivery disabled outside production",
      };
    }

    // Fetch users with notification consent
    const consentedUsers = await User.find({
      _id: { $in: userIds },
      notificationConsent: true,
    }).select("_id");

    const consentedUserIds = consentedUsers.map((user) => user._id);

    // Fetch devices of consented users
    const devices = await Device.find({
      userId: { $in: consentedUserIds },
      isActive: true,
    });

    if (devices.length === 0) {
      console.log("No active devices found for consented users.");
      return {
        success: false,
        message: "No active devices found for consented users",
      };
    }

    // Prepare push notification messages
    const messages = devices.map((device) => ({
      to: device.pushToken,
      sound: "default",
      title: messageData.title,
      body: messageData.body,
      data: messageData.data || {},
    }));

    const validMessages = messages.filter((message) =>
      Expo.isExpoPushToken(message.to)
    );

    if (validMessages.length === 0) {
      return {
        success: false,
        message: "No valid Expo push tokens found",
      };
    }

    const chunks = expo.chunkPushNotifications(validMessages);
    const tickets = [];
    const errors = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending chunk:", error);
        errors.push({ chunk, error: error.message });
      }
    }

    const results = {
      successful: tickets.filter((ticket) => ticket.status === "ok").length,
      failed: tickets.filter((ticket) => ticket.status === "error").length,
      tickets,
      errors,
    };

    return results;
  } catch (error) {
    logError(error, req, 500);
    console.error("Batch send error:", error);
    throw new Error("Failed to send batch notifications");
  }
};

export const handleRegisterDeviceController = async (req, res) => {
  const {
    pushToken,
    deviceType = "UNKNOWN",
    notificationConsent,
    userId = null,
  } = req.body;

  // const userId = req.user ? req.user._id : null;
  console.log("req---", req.user);

  try {
    // 1. Validate push token
    if (!Expo.isExpoPushToken(pushToken)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid push token" });
    }

    const operations = [];

    // 2. Update user notification consent (only if it's explicitly passed)
    if (userId && typeof notificationConsent === "boolean") {
      operations.push(
        User.updateOne(
          { _id: userId },
          { $set: { notificationConsent } }
        ).exec()
      );
    }

    // 3. Upsert the current device directly
    operations.push(
      Device.updateOne(
        { pushToken },
        {
          $set: {
            userId: userId || null,
            deviceType,
            isActive: true,
          },
        },
        { upsert: true }
      ).exec()
    );

    // 4. Deactivate all *other* devices of the same user (if logged in)
    if (userId) {
      operations.push(
        Device.updateMany(
          {
            userId,
            pushToken: { $ne: pushToken },
            isActive: true,
          },
          { $set: { isActive: false } }
        ).exec()
      );
    }

    // 5. Run all DB operations in parallel
    await Promise.allSettled(operations);

    // 6. Return success response
    return res.status(200).json({
      success: true,
      userId,
      message: "Device registered or updated successfully",
    });
  } catch (error) {
    console.error("Device registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while registering the device",
      error: error?.message,
    });
  }
};

/**
 * Sends a notification to a user with localized messages and dynamic placeholders.
 * @param {string} userId - The user ID to send the notification to.
 * @param {string} key - The notification key to identify the message template.
 * @param {Object} params - Dynamic data for the message template placeholders.
 * @param {Object} data - Additional data to send with the notification.
 * @returns {Object} - Result of the notification operation.
 */
export const handleSendNotificationController = async (
  userId,
  key,
  params = {},
  data = {},
  req,
  options = {},
) => {
  try {
    if (!canDeliverNotifications()) {
      console.log(
        `[Notification] Skipped send in '${process.env.NODE_ENV || "development"}' mode for user ${userId}.`,
      );
      return {
        success: false,
        message: "Notification delivery disabled outside production",
      };
    }

    const policy = getNotificationPolicy(key);
    const enrichedData = enrichNotificationData(data);
    const dedupKey =
      options.dedupKey || buildNotificationDedupKey(key, enrichedData);
    const metricBase = {
      userId,
      notificationType: key,
      category: policy.category,
      dedupKey,
      source: options.source || "EVENT",
    };

    const user = await User.findById(userId).select(
      "locale.language status notificationConsent",
    );

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is ACTIVE and has given notification consent
    if (user.status !== "ACTIVE" || user.notificationConsent !== true) {
      console.log(
        `Skipping notification: User ${userId} is either inactive or has disabled notifications.`
      );
      await recordNotificationMetric({
        ...metricBase,
        event: "SKIPPED",
        reason:
          user.status !== "ACTIVE" ? "USER_INACTIVE" : "CONSENT_DISABLED",
      });
      return {
        success: false,
        message: "User is inactive or has disabled notifications",
      };
    }

    const language = user?.locale?.language || "hi";
    const devices = await getValidDevices(userId);

    if (devices.length === 0) {
      console.log(`No active devices found for user ${userId}.`);
      await recordNotificationMetric({
        ...metricBase,
        event: "SKIPPED",
        reason: "NO_VALID_PUSH_TOKEN",
      });
      return {
        success: false,
        message: "No active devices found",
      };
    }

    if (policy.cooldownHours > 0) {
      const cooldownBoundary = new Date(
        Date.now() - policy.cooldownHours * 60 * 60 * 1000,
      );
      const existing = await Notification.exists({
        userId,
        dedupKey,
        status: { $in: ["PENDING", "SENT"] },
        createdAt: { $gte: cooldownBoundary },
      });
      if (existing) {
        await recordNotificationMetric({
          ...metricBase,
          event: "SKIPPED",
          reason: "COOLDOWN_DUPLICATE",
        });
        return {
          success: false,
          skipped: true,
          reason: "COOLDOWN",
          message: "Notification skipped by cooldown policy",
        };
      }
    }

    if (policy.dailyCap > 0) {
      const sentToday = await Notification.countDocuments({
        userId,
        category: policy.category,
        status: "SENT",
        createdAt: { $gte: getIstDayStart() },
      });
      if (sentToday >= policy.dailyCap) {
        await recordNotificationMetric({
          ...metricBase,
          event: "SKIPPED",
          reason: "DAILY_CAP",
        });
        return {
          success: false,
          skipped: true,
          reason: "DAILY_CAP",
          message: "Notification skipped by daily cap",
        };
      }
    }

    const localizedMessage = getNotificationMessage(key, language, {
      appName: "KAARYA",
      ...params,
    });

    if (!localizedMessage?.title || !localizedMessage?.message) {
      await recordNotificationMetric({
        ...metricBase,
        event: "SKIPPED",
        reason: "MISSING_TEMPLATE",
      });
      return {
        success: false,
        skipped: true,
        reason: "MISSING_TEMPLATE",
        message: `Missing notification template for ${key}`,
      };
    }

    const quietHours = policy.respectQuietHours
      ? getQuietHoursState()
      : { isQuiet: false, scheduledFor: null };
    const digestScheduledFor =
      policy.digestWindowMinutes > 0
        ? new Date(Date.now() + policy.digestWindowMinutes * 60 * 1000)
        : null;
    const scheduledFor = quietHours.scheduledFor || digestScheduledFor;

    if (policy.digestWindowMinutes > 0) {
      const pendingDigest = await Notification.findOne({
        userId,
        category: policy.category,
        type: key,
        status: "PENDING",
        scheduledFor: { $ne: null },
      }).sort({ createdAt: -1 });

      if (pendingDigest) {
        const serviceIds = new Set(
          (pendingDigest.data?.serviceIds || []).map(String),
        );
        if (enrichedData.serviceId) {
          serviceIds.add(String(enrichedData.serviceId));
          pendingDigest.data.serviceId = enrichedData.serviceId;
          pendingDigest.data.id = String(enrichedData.serviceId);
          pendingDigest.data.url = enrichedData.url;
        }
        pendingDigest.data.serviceIds = [...serviceIds];
        pendingDigest.title = localizedMessage.title;
        pendingDigest.body = localizedMessage.message;
        await pendingDigest.save();

        return {
          success: true,
          queued: true,
          merged: true,
          message: "Notification merged into discovery digest",
          scheduledFor: pendingDigest.scheduledFor,
        };
      }
    }

    const notification = await Notification.create({
      userId,
      category: policy.category,
      priority: policy.priority,
      type: key,
      title: localizedMessage?.title,
      body: localizedMessage?.message,
      data: {
        ...enrichedData,
        serviceIds: enrichedData.serviceId ? [enrichedData.serviceId] : [],
      },
      dedupKey,
      status: "PENDING",
      scheduledFor,
      source: options.source || "EVENT",
    });

    if (scheduledFor) {
      return {
        success: true,
        queued: true,
        message: quietHours.isQuiet
          ? "Notification queued until quiet hours end"
          : "Notification queued for discovery digest",
        scheduledFor,
      };
    }

    return await deliverStoredNotification(notification, devices);
  } catch (error) {
    logError(error, req, 500);
    throw new Error("Failed to send notification");
  }
};

/**
 * Deliver non-critical notifications deferred by quiet-hours policy.
 */
export const processQueuedNotifications = async (limit = 100) => {
  if (!canDeliverNotifications()) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const queued = await Notification.find({
    status: "PENDING",
    scheduledFor: { $ne: null, $lte: new Date() },
    deliveryAttempts: { $lt: 3 },
  })
    .sort({ scheduledFor: 1 })
    .limit(limit);

  const summary = { processed: queued.length, sent: 0, failed: 0, skipped: 0 };

  for (const notification of queued) {
    try {
      const user = await User.findById(notification.userId).select(
        "status notificationConsent",
      );
      if (
        !user ||
        user.status !== "ACTIVE" ||
        user.notificationConsent !== true
      ) {
        notification.status = "FAILED";
        notification.failureReason = "USER_INELIGIBLE";
        notification.deliveryAttempts += 1;
        await notification.save();
        summary.skipped += 1;
        continue;
      }

      const devices = await getValidDevices(notification.userId);
      const result = await deliverStoredNotification(notification, devices);
      if (result.success) {
        summary.sent += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      notification.deliveryAttempts += 1;
      notification.failureReason = error?.message || "DEFERRED_SEND_FAILED";
      if (notification.deliveryAttempts >= 3) {
        notification.status = "FAILED";
        notification.scheduledFor = null;
      } else {
        notification.scheduledFor = new Date(Date.now() + 60 * 60 * 1000);
      }
      await notification.save();
      summary.failed += 1;
      logError(error, null, 500, "cronJob - processQueuedNotifications");
    }
  }

  return summary;
};

export const handlebroadcastNotificationController = async (
  userIds,
  message,
  req
) => {
  try {
    if (!canDeliverNotifications()) {
      console.log(
        `[Notification] Skipped broadcast in '${process.env.NODE_ENV || "development"}' mode.`,
      );
      return {
        success: false,
        message: "Notification delivery disabled outside production",
      };
    }

    // Fetch users who have enabled notification consent
    const usersWithConsent = await User.find({
      _id: { $in: userIds },
      notificationConsent: true,
    }).select("_id");

    const consentedUserIds = usersWithConsent.map((user) => user._id);

    if (consentedUserIds.length === 0) {
      return {
        success: false,
        message: "No users with notification consent found",
      };
    }

    // Fetch devices of consented users
    const devices = await Device.find({
      userId: { $in: consentedUserIds },
      isActive: true,
    });

    if (devices.length === 0) {
      return {
        success: false,
        message: "No active devices found for consented users",
      };
    }

    // Save notifications in the database
    await Notification.insertMany(
      consentedUserIds.map((userId) => ({
        userId,
        ...message,
      }))
    );

    // Send batch notifications
    return await sendBatchNotifications(consentedUserIds, message, req);
  } catch (error) {
    logError(error, req, 500);
    throw new Error("Failed to broadcast notification");
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const { _id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const notifications = await Notification.find({
      userId: _id,
      status: "SENT",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("data.actionBy", "name profilePicture email mobile")
      .populate("data.actionOn", "name profilePicture email mobile");

    const total = await Notification.countDocuments({
      userId: _id,
      status: "SENT",
    });

    res.status(200).json({
      success: true,
      message: "All notifications fetched",
      notifications,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit),
        total: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch notifications",
    });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { _id } = req.user;

    const unreadCount = await Notification.countDocuments({
      userId: _id,
      status: "SENT",
      read: false,
    });

    res.status(200).json({
      success: true,
      message: "Unread notifications fetched successfully",
      unreadCount,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch unread notifications",
    });
  }
};

export const handleUpdateNotificationConsent = async (req, res) => {
  try {
    const { notificationConsent } = req.body;
    const { _id } = req.user;

    if (typeof notificationConsent !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "notificationConsent must be a boolean value",
      });
    }

    // Update notificationConsent in User model
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: { notificationConsent } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!notificationConsent) {
      await Promise.all([
        Device.updateMany(
          { userId: _id, isActive: true },
          { $set: { isActive: false } },
        ),
        recordNotificationMetric({
          event: "OPT_OUT",
          reason: "USER_PREFERENCE",
          userId: _id,
          source: "EVENT",
        }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: `Notification ${
        notificationConsent ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update notification settings",
    });
  }
};

export const handleDeactivateDevices = async (req, res) => {
  try {
    const { _id } = req.user;
    const result = await Device.updateMany(
      { userId: _id, isActive: true },
      { $set: { isActive: false } },
    );

    return res.status(200).json({
      success: true,
      message: "Notification devices deactivated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate notification devices",
    });
  }
};

export const handleMarkAsReadNotification = async (req, res) => {
  const { notificationIds } = req.body;
  const userId = req.user?._id;

  if (
    !notificationIds ||
    !Array.isArray(notificationIds) ||
    notificationIds.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid or missing 'notificationIds'. It should be a non-empty array.",
    });
  }

  try {
    // Mark read and stamp first-open time for inbox visibility tracking.
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, userId, status: "SENT" },
      [
        {
          $set: {
            read: true,
            openedAt: { $ifNull: ["$openedAt", "$$NOW"] },
            openCount: {
              $cond: [
                { $eq: [{ $type: "$openedAt" }, "date"] },
                { $ifNull: ["$openCount", 0] },
                { $add: [{ $ifNull: ["$openCount", 0] }, 1] },
              ],
            },
          },
        },
      ],
    );

    res.status(200).json({
      success: true,
      message: "Notifications marked as read successfully.",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while marking notifications as read.",
      error: error.message,
    });
  }
};

export const handleNotificationOpened = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "notificationId is required",
      });
    }

    // First open stamps openedAt; later opens only bump openCount.
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id, status: "SENT" },
      [
        {
          $set: {
            read: true,
            openedAt: { $ifNull: ["$openedAt", "$$NOW"] },
            openCount: { $add: [{ $ifNull: ["$openCount", 0] }, 1] },
          },
        },
      ],
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification open recorded",
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Failed to record notification open",
    });
  }
};

import { Expo } from "expo-server-sdk";
import Notification from "../models/notification.model.js";
import db from "../models/index.js";
import User from "../models/user.model.js";
import { getNotificationMessage } from "../utils/notificationHelper.js";
import logError from "../utils/addErrorLog.js";

let expo = new Expo();
const Device = db.device;

const sendBatchNotifications = async (userIds, messageData, req) => {
  try {
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
  // category = null,
  key,
  params = {},
  data = {},
  req
) => {
  try {
    // Fetch user details including notificationConsent
    const user = await User.findById(userId).select(
      "locale.language status notificationConsent"
    );

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is ACTIVE and has given notification consent
    if (user.status !== "ACTIVE" || user.notificationConsent !== true) {
      console.log(
        `Skipping notification: User ${userId} is either inactive or has disabled notifications.`
      );
      return {
        success: false,
        message: "User is inactive or has disabled notifications",
      };
    }

    console.log('user---', user);
    

    const language = user?.locale?.language || "hi";

    // Fetch active devices of the user
    const devices = await Device.find({ userId, isActive: true });

    if (devices.length === 0) {
      console.log(`No active devices found for user ${userId}.`);
      return {
        success: false,
        message: "No active devices found",
      };
    }

    // Get localized message
    const localizedMessage = getNotificationMessage(key, language, {
      appName: "KAARYA",
      ...params,
    });

    // Save notification in the database
    const notification = await Notification.create({
      userId,
      // category: category,
      type: key,
      title: localizedMessage?.title,
      body: localizedMessage?.message,
      data,
      status: "PENDING",
    });

    // Prepare push notification messages
    const messages = devices.map((device) => ({
      to: device.pushToken,
      title: localizedMessage?.title,
      body: localizedMessage?.message,
      data,
    }));

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    // Update notification status
    notification.status = "SENT";
    await notification.save();

    console.log(`Notification sent successfully to user ${userId}.`);
    return { success: true, message: "Notification sent successfully" };
  } catch (error) {
    logError(error, req, 500);
    throw new Error("Failed to send notification");
  }
};

export const handlebroadcastNotificationController = async (
  userIds,
  message,
  req
) => {
  try {
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
    return await sendBatchNotifications(devices, message, req);
  } catch (error) {
    logError(error, req, 500);
    throw new Error("Failed to broadcast notification");
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const { _id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const notifications = await Notification.find({ userId: _id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("data.actionBy", "name profilePicture email mobile")
      .populate("data.actionOn", "name profilePicture email mobile");

    const total = await Notification.countDocuments({ userId: _id });

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

    // ✅ Fetch unread notifications for the user
    const unreadNotifications = await Notification.find({
      userId: _id,
      read: false,
    }).sort({ createdAt: -1 }); // Optional: Sort by latest

    const unreadCount = unreadNotifications.length;

    res.status(200).json({
      success: true,
      message: "Unread notifications fetched successfully",
      unreadCount,
      unreadNotifications, // ✅ Added the unread notifications details
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

export const handleMarkAsReadNotification = async (req, res) => {
  const { notificationIds } = req.body;

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
    // Update the `read` field to true for the given notification IDs
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { read: true } }
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

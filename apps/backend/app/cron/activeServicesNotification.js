import cron from "node-cron";
import Service from "../models/service.model.js";
import User from "../models/user.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

// In-memory store to track notifications sent per service per user
const lastNotificationTimes = new Map();

/**
 * Get nearby users with required skills, sorted by proximity to service geoLocation.
 */
const getNearbyUsersWithSkills = async (service) => {
  try {
    const users = await User.find({
      _id: { $ne: service.employer }, // Exclude employer

      // ✅ Only users who have at least 1 skill
      skills: { $exists: true, $not: { $size: 0 } },

      notificationConsent: true,
    }).select("name skills");

    console.log(
      `📍 [Cron] Found ${users.length} users with skills for service ${service._id}`,
    );

    return users;
  } catch (error) {
    logError(error, null, 500, "cronJob - getUsersWithSkills");
    console.error("❌ [Cron] Error fetching users:", error);
    return [];
  }
};

/**
 * Check if a notification can be sent based on timing rules.
 */
const canSendNotification = (userId, serviceId) => {
  const userKey = `${userId}_${serviceId}`;
  const lastSent = lastNotificationTimes.get(userKey);

  if (!lastSent) return true;

  const hoursSinceLastSent = (Date.now() - lastSent) / (1000 * 60 * 60);
  return hoursSinceLastSent >= 5; // At least 5-hour gap
};

/**
 * Send notifications to users sorted by proximity.
 */
const sendNotificationToUsers = async (users, serviceId) => {
  for (const user of users) {
    if (canSendNotification(user._id.toString(), serviceId)) {
      try {
        handleSendNotificationController(
          user._id,
          getEnglishTitles()?.NEW_SERVICE_ARRIVED_OF_SKILL,
          {
            workerName: user.name,
          },
          {
            actionBy: null,
            actionOn: user._id,
          },
          null,
        );

        console.log(
          `✅ [Cron] Notification sent to ${user.name} for service ${serviceId}`,
        );
        lastNotificationTimes.set(`${user._id}_${serviceId}`, Date.now());
      } catch (error) {
        logError(error, null, 500, "cronJob - sendNotificationToUsers");
        console.error(
          `❌ [Cron] Error sending notification to ${user.name} for service ${serviceId}:`,
          error,
        );
      }
    } else {
      console.log(
        `⏳ [Cron] Skipping ${user.name} for service ${serviceId} - Already notified recently.`,
      );
    }
  }
};

/**
 * Main function to notify users for active services.
 */
const notifyUsersForActiveServices = async () => {
  try {
    console.log(
      "🚀 [Cron] Job Execution Started:",
      new Date().toLocaleString(),
    );
    const services = await Service.find({ status: "HIRING" });

    for (const service of services) {
      const matchedUsers = await getNearbyUsersWithSkills(service);

      if (matchedUsers.length) {
        await sendNotificationToUsers(matchedUsers, service._id.toString());
      }
    }

    console.log("🎯 [Cron] All notifications processed successfully.");
  } catch (error) {
    logError(error, null, 500, "cronJob - notifyUsersForActiveServices");
    console.error("❌ [Cron] Error in cron job:", error);
  }
};

/**
 * Schedule the cron job (Runs every hour).
 */
const scheduleNotifiyLiveServiceOfUserSkills = () => {
  cron.schedule("0 * * * *", async () => {
    console.log(
      "⏰ [Cron] Schedule Triggered at:",
      new Date().toLocaleString(),
    );
    await notifyUsersForActiveServices();
  });
};

export default scheduleNotifiyLiveServiceOfUserSkills;

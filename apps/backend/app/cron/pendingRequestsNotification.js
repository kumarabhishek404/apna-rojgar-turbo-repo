import cron from "node-cron";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import User from "../models/user.model.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

/**
 * Cron job function to notify users with pending booking or team joining requests
 */
const notifyUsersWithPendingRequests = async () => {
  try {
    // Fetch users with pending requests
    const usersWithPendingRequests = await User.find({
      $or: [
        { bookingRequestBy: { $exists: true, $not: { $size: 0 } } },
        { teamJoiningRequestBy: { $exists: true, $not: { $size: 0 } } },
      ],
      notificationConsent: true,
    });

    console.log(
      `🚀 [Cron] Found ${usersWithPendingRequests.length} users with pending requests.`,
    );

    // Send notifications to each user
    for (const user of usersWithPendingRequests) {
      try {
        handleSendNotificationController(
          user._id,
          getEnglishTitles()?.PENDING_REQUEST_REMINDER,
          {
            workerName: user.name,
          },
          {
            actionBy: null,
            actionOn: user._id,
          },
        );

        console.log(
          `✅ [Cron] Notification sent to user: ${user.name} (${user._id})`,
        );
      } catch (error) {
        logError(error, null, 500, "cronJob - notifyUsersWithPendingRequests");
        console.error(
          `❌ [Cron] Error sending notification to user: ${user.name} (${user._id}):`,
          error,
        );
      }
    }

    console.log("🎯 [Cron] Pending request notifications successfully sent.");
  } catch (error) {
    logError(error, null, 500, "cronJob - notifyUsersWithPendingRequests");
    console.error(
      "❌ [Cron] Error in notifyUsersWithPendingRequests cron job:",
      error,
    );
  }
};

const scheduleNotifyUsersWithPendingRequests = () => {
  cron.schedule("0 10 * * 1", async () => {
    console.log("⏰ [Cron] Running notifyUsersWithPendingRequests...");
    await notifyUsersWithPendingRequests();
  });
};

export default scheduleNotifyUsersWithPendingRequests;

import cron from "node-cron";
import User from "../models/user.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

// Function to determine missing fields
const getMissingFields = (user) => {
  const missingFields = [];
  if (!user.name) missingFields.push("📝 Name");
  if (!user.gender) missingFields.push("⚧️ Gender");
  if (!user.address) missingFields.push("🏠 Address");
  if (!user.profilePicture) missingFields.push("🖼️ Profile Picture");
  if (!user.geoLocation || !user.geoLocation[0] || !user.geoLocation[1])
    missingFields.push("📍 Location");
  if (!user.mobile) missingFields.push("📱 Mobile Number");
  return missingFields;
};

// Function to send notifications for incomplete profiles
const notifyIncompleteProfiles = async () => {
  try {
    console.log("🚀 [Cron] Checking users for incomplete profiles...");

    const users = await User.find({ notificationConsent: true });
    let notifiedUsers = 0;

    for (const user of users) {
      try {
        const missingFields = getMissingFields(user);

        if (missingFields.length > 0) {
          handleSendNotificationController(
            user._id,
            getEnglishTitles()?.PROFILE_COMPLETION_REMINDER,
            {
              workerName: user.name,
              missingDetails: missingFields.join(", "),
            },
            {
              actionBy: null,
              actionOn: user._id,
            },
          );

          console.log(
            `✅ [Cron] Notification sent to ${user.name} (${user._id})`,
          );
          notifiedUsers++;
        }
      } catch (error) {
        logError(error, null, 500, "cronJob - notifyUsersForCompletingProfile");
        console.error(
          `❌ [Cron] Error sending notification to ${user.name} (${user._id}):`,
          error,
        );
      }
    }

    console.log(
      `🎯 [Cron] Completed profile notification job. Notified: ${notifiedUsers} users.`,
    );
  } catch (error) {
    logError(error, null, 500, "cronJob - notifyUsersForCompletingProfile");
    console.error(
      "❌ [Cron] Error in notifyUsersForCompletingProfile cron job:",
      error,
    );
  }
};

const scheduleNotifyUsersForCompletingProfile = () => {
  cron.schedule(
    "0 10 1 * *",
    async () => {
      console.log("⏰ [Cron] Running notifyUsersForCompletingProfile...");
      await notifyIncompleteProfiles();
    },
    {
      timezone: "Asia/Kolkata", // ✅ IST fix
    },
  );
};

export default scheduleNotifyUsersForCompletingProfile;

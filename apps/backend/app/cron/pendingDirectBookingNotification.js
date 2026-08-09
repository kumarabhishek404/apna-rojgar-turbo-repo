import cron from "node-cron";
import Invitation from "../models/invitation.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

const NOTIFICATION_KEY = getEnglishTitles()?.PENDING_DIRECT_BOOKING_REMINDER;

/**
 * Remind workers/mediators about unanswered direct booking invitations.
 */
export const notifyPendingDirectBookings = async () => {
  try {
    const invitations = await Invitation.find({ status: "PENDING" })
      .select("_id employer bookedWorker appliedSkill address")
      .populate("employer", "name")
      .populate("bookedWorker", "name notificationConsent status");

    console.log(
      `🚀 [Cron] Found ${invitations.length} pending direct booking invitations.`,
    );

    let sent = 0;
    for (const invitation of invitations) {
      const worker = invitation.bookedWorker;
      if (
        !worker?._id ||
        worker.status !== "ACTIVE" ||
        worker.notificationConsent !== true
      ) {
        continue;
      }

      try {
        const result = await handleSendNotificationController(
          worker._id,
          NOTIFICATION_KEY,
          {
            workerName: worker.name,
            employerName: invitation.employer?.name || "Employer",
            serviceName:
              invitation.appliedSkill?.name ||
              invitation.appliedSkill?.skill ||
              "work",
          },
          {
            actionBy: invitation.employer?._id || null,
            actionOn: worker._id,
            invitationId: invitation._id,
            url: "apnarojgar://screens/notifications",
            type: "NOTIFICATIONS",
          },
          null,
          { source: "CRON" },
        );
        if (result?.success) sent += 1;
        console.log(
          `${result?.success ? "✅" : "⏭️"} [Cron] Direct booking reminder ${result?.queued ? "queued" : result?.success ? "sent" : "skipped"} for ${worker.name}`,
        );
      } catch (error) {
        logError(error, null, 500, "cronJob - notifyPendingDirectBookings");
      }
    }

    console.log(`🎯 [Cron] Direct booking reminders done. sent=${sent}`);
  } catch (error) {
    logError(error, null, 500, "cronJob - notifyPendingDirectBookings");
    console.error("❌ [Cron] Error in notifyPendingDirectBookings:", error);
  }
};

const scheduleNotifyPendingDirectBookings = () => {
  cron.schedule(
    "30 10 * * 1,3,5",
    async () => {
      console.log("⏰ [Cron] Running notifyPendingDirectBookings...");
      await notifyPendingDirectBookings();
    },
    { timezone: "Asia/Kolkata" },
  );
};

export default scheduleNotifyPendingDirectBookings;

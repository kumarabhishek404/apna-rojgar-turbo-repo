import cron from "node-cron";
import { processQueuedNotifications } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";

export const runQueuedNotifications = async () => {
  try {
    const summary = await processQueuedNotifications();
    if (summary.processed > 0) {
      console.log(
        `[Notification Queue] processed=${summary.processed}, sent=${summary.sent}, failed=${summary.failed}, skipped=${summary.skipped}`,
      );
    }
    return summary;
  } catch (error) {
    logError(error, null, 500, "cronJob - queuedNotifications");
    console.error("[Notification Queue] Processing failed:", error);
    return { processed: 0, sent: 0, failed: 1, skipped: 0 };
  }
};

const scheduleQueuedNotifications = () => {
  cron.schedule(
    "*/15 * * * *",
    runQueuedNotifications,
    { timezone: "Asia/Kolkata" },
  );
};

export default scheduleQueuedNotifications;

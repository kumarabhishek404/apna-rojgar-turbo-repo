import cron from "node-cron";
import CronJobState from "../models/cronJobState.model.js";
import logError from "../utils/addErrorLog.js";
import { publishNextPendingBlogFromGoogle } from "../utils/blogGoogleImport.js";
import { isGoogleBlogImportEnabled } from "../utils/googleSheets.js";

export const DAILY_BLOG_PUBLISH_JOB_KEY = "daily_blog_publish_from_google";

const isCronEnabled = () =>
  process.env.CRON_DAILY_BLOG_PUBLISH_ENABLED !== "false";

export const runDailyBlogPublish = async () => {
  if (!isGoogleBlogImportEnabled()) {
    console.log(
      "⏭️ [Cron] Daily blog publish skipped (Google blog import not enabled)",
    );
    return { skipped: true, reason: "import disabled" };
  }

  const now = new Date();
  let state = await CronJobState.findOne({ jobKey: DAILY_BLOG_PUBLISH_JOB_KEY });
  if (!state) {
    state = new CronJobState({ jobKey: DAILY_BLOG_PUBLISH_JOB_KEY });
  }

  try {
    const result = await publishNextPendingBlogFromGoogle();
    state.lastRunAt = now;
    state.lastRunStatus = result.failed ? "failed" : "success";
    state.rowsExported = result.skipped || result.failed ? 0 : 1;
    if (result.spreadsheetId) state.spreadsheetId = result.spreadsheetId;
    if (result.documentId) state.spreadsheetId = result.documentId;
    await state.save();

    if (result.skipped) {
      console.log(`⏭️ [Cron] Daily blog publish: ${result.reason}`);
    } else if (result.failed) {
      console.error(`❌ [Cron] Daily blog publish failed: ${result.message}`);
    } else {
      console.log(`🎯 [Cron] Daily blog publish: ${result.message}`);
    }

    return result;
  } catch (error) {
    state.lastRunAt = now;
    state.lastRunStatus = "failed";
    state.rowsExported = 0;
    await state.save();
    logError(error, null, 500, "cronJob - dailyBlogPublish");
    console.error("❌ [Cron] Daily blog publish failed:", error);
    throw error;
  }
};

const scheduleDailyBlogPublish = () => {
  if (!isCronEnabled()) {
    console.log(
      "⏭️ [Cron] Daily blog publish scheduler disabled (CRON_DAILY_BLOG_PUBLISH_ENABLED=false)",
    );
    return;
  }

  // Every day at 09:00 IST — one pending Google Doc tab → website blog
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("⏰ [Cron] Running dailyBlogPublish...");
      try {
        await runDailyBlogPublish();
      } catch {
        // already logged
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("✅ [Cron] Daily blog publish scheduled (09:00 Asia/Kolkata)");
};

export default scheduleDailyBlogPublish;

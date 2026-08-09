import cron from "node-cron";
import Service from "../models/service.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

const NOTIFICATION_KEY = getEnglishTitles()?.PAID_SERVICE_PROMOTION;

/**
 * Promote paid social-media boost to employers with unpaid hiring services.
 */
export const notifyEmployersAboutPaidServicePromo = async () => {
  try {
    const services = await Service.find({
      status: "HIRING",
      bookingType: "byService",
      $or: [
        { "socialMediaPromotion.status": { $in: ["NONE", "FAILED", null] } },
        { "socialMediaPromotion.status": { $exists: false } },
        { "socialMediaPromotion.enabled": { $ne: true } },
      ],
    })
      .select("_id employer type jobID socialMediaPromotion")
      .populate("employer", "name notificationConsent status");

    const byEmployer = new Map();
    for (const service of services) {
      const employer = service.employer;
      const employerId = employer?._id?.toString();
      if (!employerId) continue;
      if (
        employer.status !== "ACTIVE" ||
        employer.notificationConsent !== true
      ) {
        continue;
      }
      if (service.socialMediaPromotion?.status === "PAID") continue;
      if (service.socialMediaPromotion?.enabled === true) continue;

      if (!byEmployer.has(employerId)) {
        byEmployer.set(employerId, {
          employer,
          serviceId: service._id,
          serviceName: service.type || service.jobID || "work",
        });
      }
    }

    console.log(
      `🚀 [Cron] Found ${byEmployer.size} employers for paid-service promo.`,
    );

    let sent = 0;
    for (const [, payload] of byEmployer) {
      try {
        const result = await handleSendNotificationController(
          payload.employer._id,
          NOTIFICATION_KEY,
          {
            workerName: payload.employer.name,
            serviceName: payload.serviceName,
          },
          {
            actionBy: null,
            actionOn: payload.employer._id,
            serviceId: payload.serviceId,
          },
          null,
          { source: "CRON" },
        );
        if (result?.success) sent += 1;
        console.log(
          `${result?.success ? "✅" : "⏭️"} [Cron] Paid promo ${result?.queued ? "queued" : result?.success ? "sent" : "skipped"} for ${payload.employer.name}`,
        );
      } catch (error) {
        logError(
          error,
          null,
          500,
          "cronJob - notifyEmployersAboutPaidServicePromo",
        );
      }
    }

    console.log(`🎯 [Cron] Paid-service promo done. sent=${sent}`);
  } catch (error) {
    logError(
      error,
      null,
      500,
      "cronJob - notifyEmployersAboutPaidServicePromo",
    );
    console.error(
      "❌ [Cron] Error in notifyEmployersAboutPaidServicePromo:",
      error,
    );
  }
};

const scheduleNotifyEmployersAboutPaidServicePromo = () => {
  cron.schedule(
    "0 12 * * 4",
    async () => {
      console.log(
        "⏰ [Cron] Running notifyEmployersAboutPaidServicePromo...",
      );
      await notifyEmployersAboutPaidServicePromo();
    },
    { timezone: "Asia/Kolkata" },
  );
};

export default scheduleNotifyEmployersAboutPaidServicePromo;

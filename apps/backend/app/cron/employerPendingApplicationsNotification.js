import cron from "node-cron";
import Service from "../models/service.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

const NOTIFICATION_KEY =
  getEnglishTitles()?.EMPLOYER_PENDING_APPLICATIONS_REMINDER;

/**
 * Remind employers about pending applications on their hiring services.
 */
export const notifyEmployersAboutPendingApplications = async () => {
  try {
    const services = await Service.find({
      status: "HIRING",
      "appliedUsers.status": "PENDING",
    })
      .select("_id employer type jobID appliedUsers")
      .populate("employer", "name notificationConsent status");

    const byEmployer = new Map();

    for (const service of services) {
      const employerId = service.employer?._id?.toString();
      if (!employerId) continue;
      if (
        service.employer?.status !== "ACTIVE" ||
        service.employer?.notificationConsent !== true
      ) {
        continue;
      }

      const pendingCount = (service.appliedUsers || []).filter(
        (entry) => entry?.status === "PENDING",
      ).length;
      if (pendingCount === 0) continue;

      const current = byEmployer.get(employerId) || {
        employer: service.employer,
        applicantCount: 0,
        serviceId: service._id,
        serviceName: service.type || service.jobID || "work",
      };
      current.applicantCount += pendingCount;
      if (!current.serviceId) current.serviceId = service._id;
      byEmployer.set(employerId, current);
    }

    console.log(
      `🚀 [Cron] Found ${byEmployer.size} employers with pending applications.`,
    );

    let sent = 0;
    for (const [, payload] of byEmployer) {
      try {
        const result = await handleSendNotificationController(
          payload.employer._id,
          NOTIFICATION_KEY,
          {
            workerName: payload.employer.name,
            applicantCount: String(payload.applicantCount),
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
          `${result?.success ? "✅" : "⏭️"} [Cron] Employer applications reminder ${result?.queued ? "queued" : result?.success ? "sent" : "skipped"} for ${payload.employer.name}`,
        );
      } catch (error) {
        logError(
          error,
          null,
          500,
          "cronJob - notifyEmployersAboutPendingApplications",
        );
      }
    }

    console.log(
      `🎯 [Cron] Employer pending-application reminders done. sent=${sent}`,
    );
  } catch (error) {
    logError(
      error,
      null,
      500,
      "cronJob - notifyEmployersAboutPendingApplications",
    );
    console.error(
      "❌ [Cron] Error in notifyEmployersAboutPendingApplications:",
      error,
    );
  }
};

const scheduleNotifyEmployersAboutPendingApplications = () => {
  cron.schedule(
    "0 11 * * *",
    async () => {
      console.log(
        "⏰ [Cron] Running notifyEmployersAboutPendingApplications...",
      );
      await notifyEmployersAboutPendingApplications();
    },
    { timezone: "Asia/Kolkata" },
  );
};

export default scheduleNotifyEmployersAboutPendingApplications;

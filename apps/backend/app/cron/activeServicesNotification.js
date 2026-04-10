import cron from "node-cron";
import Service from "../models/service.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

const NOTIFICATION_KEY = getEnglishTitles()?.NEW_SERVICE_ARRIVED_OF_SKILL;
const RECENT_SERVICE_WINDOW_HOURS = Number(
  process.env.CRON_RECENT_SERVICE_WINDOW_HOURS || 6,
);
const DEDUP_WINDOW_HOURS = Number(
  process.env.CRON_SERVICE_NOTIFY_DEDUP_HOURS || 12,
);

const normalizeSkillName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const extractNormalizedSkillSet = (skillItems = []) => {
  const set = new Set();

  for (const item of skillItems) {
    if (typeof item === "string") {
      const normalized = normalizeSkillName(item);
      if (normalized) set.add(normalized);
      continue;
    }

    if (item && typeof item === "object") {
      const candidates = [item.name, item.skill, item.value, item.label];
      for (const candidate of candidates) {
        const normalized = normalizeSkillName(candidate);
        if (normalized) set.add(normalized);
      }
    }
  }

  return set;
};

const getServiceRequiredSkills = (service) => {
  const requirements = Array.isArray(service?.requirements)
    ? service.requirements
    : [];
  const requiredSkills = new Set();

  for (const requirement of requirements) {
    const normalized = normalizeSkillName(requirement?.name);
    if (normalized) requiredSkills.add(normalized);
  }

  return requiredSkills;
};

/**
 * Get users that match at least one required service skill.
 */
const getUsersWithMatchingSkills = async (service) => {
  try {
    const requiredSkills = getServiceRequiredSkills(service);
    if (requiredSkills.size === 0) {
      console.log(
        `⏭️ [Cron] Skipping service ${service._id} - no requirements to match skills.`,
      );
      return [];
    }

    const users = await User.find({
      _id: { $ne: service.employer }, // Exclude employer
      skills: { $exists: true, $not: { $size: 0 } },
      notificationConsent: true,
      status: "ACTIVE",
    }).select("name skills status");

    const matchedUsers = users.filter((user) => {
      const userSkills = extractNormalizedSkillSet(user.skills);
      for (const skill of requiredSkills) {
        if (userSkills.has(skill)) return true;
      }
      return false;
    });

    console.log(
      `📍 [Cron] Found ${matchedUsers.length} skill-matched users for service ${service._id}`,
    );

    return matchedUsers;
  } catch (error) {
    logError(error, null, 500, "cronJob - getUsersWithSkills");
    console.error("❌ [Cron] Error fetching users:", error);
    return [];
  }
};

/**
 * Persistent dedup check using notification records in DB.
 */
const canSendNotification = async (userId, serviceId) => {
  const dedupBoundary = new Date(
    Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000,
  );

  const existing = await Notification.exists({
    userId,
    type: NOTIFICATION_KEY,
    "data.serviceId": serviceId,
    status: { $in: ["PENDING", "SENT"] },
    createdAt: { $gte: dedupBoundary },
  });

  return !existing;
};

/**
 * Send notifications with await + result counters.
 */
const sendNotificationToUsers = async (users, serviceId) => {
  const summary = {
    sent: 0,
    skippedDedup: 0,
    skippedGuard: 0,
    failed: 0,
  };

  for (const user of users) {
    const userId = user._id.toString();
    const shouldSend = await canSendNotification(userId, serviceId);

    if (shouldSend) {
      try {
        const result = await handleSendNotificationController(
          user._id,
          NOTIFICATION_KEY,
          {
            workerName: user.name,
          },
          {
            actionBy: null,
            actionOn: user._id,
            serviceId,
          },
          null,
        );

        if (result?.success) {
          summary.sent += 1;
          console.log(
            `✅ [Cron] Notification sent to ${user.name} for service ${serviceId}`,
          );
        } else {
          summary.skippedGuard += 1;
          console.log(
            `⏭️ [Cron] Notification skipped for ${user.name} (${result?.message || "guarded"})`,
          );
        }
      } catch (error) {
        summary.failed += 1;
        logError(error, null, 500, "cronJob - sendNotificationToUsers");
        console.error(
          `❌ [Cron] Error sending notification to ${user.name} for service ${serviceId}:`,
          error,
        );
      }
    } else {
      summary.skippedDedup += 1;
      console.log(
        `⏳ [Cron] Skipping ${user.name} for service ${serviceId} - Already notified recently.`,
      );
    }
  }

  return summary;
};

/**
 * Main function to notify users for active services.
 */
const notifyUsersForActiveServices = async () => {
  try {
    const startedAt = Date.now();
    console.log(
      "🚀 [Cron] Job Execution Started:",
      new Date().toLocaleString(),
    );
    const recentBoundary = new Date(
      Date.now() - RECENT_SERVICE_WINDOW_HOURS * 60 * 60 * 1000,
    );
    const services = await Service.find({
      status: "HIRING",
      createdAt: { $gte: recentBoundary },
    }).select("_id employer requirements createdAt");

    const totals = {
      servicesScanned: services.length,
      usersMatched: 0,
      sent: 0,
      skippedDedup: 0,
      skippedGuard: 0,
      failed: 0,
    };

    for (const service of services) {
      const matchedUsers = await getUsersWithMatchingSkills(service);
      totals.usersMatched += matchedUsers.length;

      if (matchedUsers.length) {
        const result = await sendNotificationToUsers(
          matchedUsers,
          service._id.toString(),
        );
        totals.sent += result.sent;
        totals.skippedDedup += result.skippedDedup;
        totals.skippedGuard += result.skippedGuard;
        totals.failed += result.failed;
      }
    }

    console.log(
      `🎯 [Cron] Completed. services=${totals.servicesScanned}, matchedUsers=${totals.usersMatched}, sent=${totals.sent}, skippedDedup=${totals.skippedDedup}, skippedGuard=${totals.skippedGuard}, failed=${totals.failed}, elapsedMs=${Date.now() - startedAt}`,
    );
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

import User from "../models/user.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import { getEnglishTitles } from "./translations.js";
import logError from "./addErrorLog.js";

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

export const getServiceRequiredSkills = (service) => {
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

export const getUsersWithMatchingSkills = async (service, employerId) => {
  const requiredSkills = getServiceRequiredSkills(service);
  if (requiredSkills.size === 0) return [];

  const users = await User.find({
    _id: { $ne: employerId },
    skills: { $exists: true, $not: { $size: 0 } },
    notificationConsent: true,
    status: "ACTIVE",
  }).select("_id name skills");

  return users.filter((user) => {
    const userSkills = extractNormalizedSkillSet(user.skills);
    for (const skill of requiredSkills) {
      if (userSkills.has(skill)) return true;
    }
    return false;
  });
};

/**
 * Fire-and-forget: notify only workers whose skills match the service requirements.
 */
export const notifyMatchedUsersInBackground = (service, employerId, request) => {
  setImmediate(async () => {
    try {
      const matchedUsers = await getUsersWithMatchingSkills(service, employerId);
      if (!matchedUsers.length) return;

      const notificationKey = getEnglishTitles()?.NEW_SERVICE_ARRIVED_OF_SKILL;

      for (const user of matchedUsers) {
        try {
          await handleSendNotificationController(
            user._id,
            notificationKey,
            { workerName: user.name },
            {
              actionBy: service?.employer,
              actionOn: user._id,
              serviceId: service._id?.toString(),
            },
            request,
          );
        } catch (err) {
          console.error(
            `[ServiceNotify] Failed for user ${user._id}:`,
            err?.message,
          );
        }
      }
    } catch (error) {
      await logError(error, request);
      console.error("[ServiceNotify] Background notification failed:", error);
    }
  });
};

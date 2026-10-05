import User from "../models/user.model.js";
import { handleSendNotificationController } from "../controllers/notification.controller.js";
import {
  getWhatsappGroupLabelForRole,
  getWhatsappGroupLinkForRole,
  normalizePublicRole,
} from "./whatsappGroups.js";

/**
 * Send a one-time welcome push with the role WhatsApp group link.
 * Safe to call from role-save and device-register — deduped per user.
 */
export async function sendWelcomeWhatsappGroupNotification(userId, options = {}) {
  if (!userId) return { success: false, reason: "NO_USER" };

  const user = await User.findById(userId)
    .select("role status notificationConsent locale")
    .lean();

  if (!user) return { success: false, reason: "USER_NOT_FOUND" };

  const role = normalizePublicRole(options.role || user.role);
  const groupUrl = getWhatsappGroupLinkForRole(role);
  if (!groupUrl) {
    return { success: false, reason: "NO_ROLE_GROUP" };
  }

  const groupLabel = getWhatsappGroupLabelForRole(role);

  return handleSendNotificationController(
    userId,
    "WELCOME_WHATSAPP_GROUP",
    {
      groupLabel: groupLabel || "",
      groupLink: groupUrl,
    },
    {
      url: groupUrl,
      type: "WELCOME_WHATSAPP_GROUP",
      role,
    },
    options.req || null,
    {
      dedupKey: `WELCOME_WHATSAPP_GROUP:${String(userId)}`,
      source: options.source || "REGISTRATION",
    },
  );
}

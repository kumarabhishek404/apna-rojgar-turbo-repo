import cron from "node-cron";
import User from "../models/user.model.js";
import CronJobState from "../models/cronJobState.model.js";
import logError from "../utils/addErrorLog.js";
import { formatSheetDate } from "../utils/formatSheetDate.js";
import { formatSkillLabels } from "../utils/skillLabels.js";
import {
  appendRows,
  ensureExportSpreadsheet,
  getNextSerialNumber,
  getSpreadsheetUrl,
  isGoogleSheetsEnabled,
  getStatsSpreadsheetId,
  migrateRegistrationSheetsToRoles,
  REGISTRATION_EXPORT_ROLES,
  REGISTRATION_ROLE_SHEET_CONFIGS,
} from "../utils/googleSheets.js";

export const WEEKLY_REGISTRATIONS_JOB_KEY = "weekly_registrations_export";
export const REGISTRATION_EXPORT_LAYOUT_VERSION = 2;

const isCronEnabled = () =>
  process.env.CRON_WEEKLY_REGISTRATIONS_ENABLED !== "false";

const formatSkills = (skills = []) => formatSkillLabels(skills);

const formatMobile = (user) => user.mobile || "";

const formatEmail = (user) => user.email?.value || "";

const formatRating = (user) => {
  const average = user.rating?.average;
  const count = user.rating?.count ?? 0;
  if (count === 0 || average == null) return "";
  return String(average);
};

const mapUserToRow = (user, serialNumber) => [
  String(serialNumber),
  user.name || "",
  user.status || "",
  user.countryCode || "91",
  formatMobile(user),
  user.role || "",
  user.role === "MEDIATOR" && user.numberOfWorkersInTeam != null
    ? String(user.numberOfWorkersInTeam)
    : "",
  formatSkills(user.skills),
  formatRating(user),
  user.address || "",
  user.gender || "",
  user.age || "",
  formatEmail(user),
  user.aadhaarNumber || "",
  formatSheetDate(user.createdAt),
  user.profilePicture || "",
];

const buildUserQuery = (lastExportAt) => {
  const query = {
    status: { $ne: "DELETED" },
    role: { $in: REGISTRATION_EXPORT_ROLES },
  };

  if (lastExportAt) {
    query.createdAt = { $gt: lastExportAt };
  }

  return query;
};

const groupUsersByRole = (users) => {
  const grouped = Object.fromEntries(
    REGISTRATION_EXPORT_ROLES.map((role) => [role, []]),
  );

  for (const user of users) {
    if (!grouped[user.role]) continue;
    grouped[user.role].push(user);
  }

  return grouped;
};

const emptyByRole = () =>
  Object.fromEntries(REGISTRATION_EXPORT_ROLES.map((role) => [role, 0]));

export const exportWeeklyRegistrations = async () => {
  if (!isGoogleSheetsEnabled()) {
    console.log(
      "⏭️ [Cron] Weekly registrations export skipped (GOOGLE_SHEETS_ENABLED is not true)",
    );
    return {
      skipped: true,
      reason: "GOOGLE_SHEETS_ENABLED is not true",
      spreadsheetId: null,
      rowsExported: 0,
      spreadsheetUrl: null,
      byRole: emptyByRole(),
    };
  }

  const now = new Date();
  let state = await CronJobState.findOne({
    jobKey: WEEKLY_REGISTRATIONS_JOB_KEY,
  });

  if (!state) {
    state = await CronJobState.create({
      jobKey: WEEKLY_REGISTRATIONS_JOB_KEY,
    });
  }

  try {
    const { spreadsheetId, created } = await ensureExportSpreadsheet(
      REGISTRATION_ROLE_SHEET_CONFIGS.WORKER,
      getStatsSpreadsheetId() || state.spreadsheetId,
    );

    if (created || state.spreadsheetId !== spreadsheetId) {
      state.spreadsheetId = spreadsheetId;
      await state.save();
    }

    const needsRoleBackfill =
      state.layoutVersion !== REGISTRATION_EXPORT_LAYOUT_VERSION;
    if (needsRoleBackfill) {
      await migrateRegistrationSheetsToRoles(spreadsheetId);
      state.lastExportAt = null;
      console.log(
        "🔄 [Cron] Registration sheets split by role; re-exporting all users",
      );
    }

    const users = await User.find(buildUserQuery(state.lastExportAt))
      .sort({ createdAt: 1 })
      .select(
        "name mobile countryCode address skills profilePicture role numberOfWorkersInTeam createdAt status gender aadhaarNumber age email rating",
      );

    console.log(
      `🚀 [Cron] Weekly registrations export: ${users.length} user(s) to export`,
    );

    const byRole = emptyByRole();

    if (!users.length) {
      state.lastRunAt = now;
      state.lastRunStatus = "success";
      state.rowsExported = 0;
      state.layoutVersion = REGISTRATION_EXPORT_LAYOUT_VERSION;
      await state.save();

      return {
        skipped: false,
        spreadsheetId,
        rowsExported: 0,
        spreadsheetUrl: getSpreadsheetUrl(spreadsheetId),
        byRole,
      };
    }

    const grouped = groupUsersByRole(users);

    for (const role of REGISTRATION_EXPORT_ROLES) {
      const roleUsers = grouped[role];
      const sheetConfig = REGISTRATION_ROLE_SHEET_CONFIGS[role];
      if (!roleUsers.length) continue;

      const startingSerial = await getNextSerialNumber(
        spreadsheetId,
        sheetConfig.tabName,
      );
      const rows = roleUsers.map((user, index) =>
        mapUserToRow(user, startingSerial + index),
      );
      await appendRows(spreadsheetId, sheetConfig.tabName, rows);
      byRole[role] = roleUsers.length;
      console.log(
        `📎 [Cron] Appended ${roleUsers.length} ${role} row(s) to "${sheetConfig.tabName}"`,
      );
    }

    state.spreadsheetId = spreadsheetId;
    state.lastExportAt = now;
    state.lastRunAt = now;
    state.lastRunStatus = "success";
    state.rowsExported = users.length;
    state.layoutVersion = REGISTRATION_EXPORT_LAYOUT_VERSION;
    await state.save();

    console.log(
      `🎯 [Cron] Weekly registrations export complete: ${users.length} row(s) appended`,
    );

    return {
      skipped: false,
      spreadsheetId,
      rowsExported: users.length,
      spreadsheetUrl: getSpreadsheetUrl(spreadsheetId),
      byRole,
    };
  } catch (error) {
    state.lastRunAt = now;
    state.lastRunStatus = "failed";
    state.rowsExported = 0;
    await state.save();

    logError(error, null, 500, "cronJob - weeklyRegistrationsExport");
    console.error("❌ [Cron] Weekly registrations export failed:", error);
    throw error;
  }
};

const scheduleWeeklyRegistrationsExport = () => {
  if (!isCronEnabled()) {
    console.log(
      "⏭️ [Cron] Weekly registrations export scheduler disabled (CRON_WEEKLY_REGISTRATIONS_ENABLED=false)",
    );
    return;
  }

  // Every day at 05:00 IST — incremental rows since lastExportAt → Google Sheets
  cron.schedule(
    "0 5 * * *",
    async () => {
      console.log("⏰ [Cron] Running weeklyRegistrationsExport...");
      try {
        await exportWeeklyRegistrations();
      } catch {
        // exportWeeklyRegistrations already logs errors
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log(
    "✅ [Cron] Registrations export scheduled (05:00 Asia/Kolkata daily)",
  );
};

export default scheduleWeeklyRegistrationsExport;

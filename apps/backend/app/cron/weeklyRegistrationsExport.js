import cron from "node-cron";
import User from "../models/user.model.js";
import CronJobState from "../models/cronJobState.model.js";
import logError from "../utils/addErrorLog.js";
import {
  appendRows,
  ensureExportSpreadsheet,
  getNextSerialNumber,
  getSpreadsheetUrl,
  isGoogleSheetsEnabled,
  REGISTRATION_SHEET_CONFIG,
} from "../utils/googleSheets.js";

export const WEEKLY_REGISTRATIONS_JOB_KEY = "weekly_registrations_export";

const isCronEnabled = () =>
  process.env.CRON_WEEKLY_REGISTRATIONS_ENABLED !== "false";

const formatRegistrationDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const formatSkills = (skills = []) =>
  skills
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      return item.skill || "";
    })
    .filter(Boolean)
    .join(", ");

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
  formatRegistrationDate(user.createdAt),
  user.profilePicture || "",
];

const buildUserQuery = (lastExportAt) => {
  const query = {
    status: { $ne: "DELETED" },
  };

  if (lastExportAt) {
    query.createdAt = { $gt: lastExportAt };
  }

  return query;
};

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

  const users = await User.find(buildUserQuery(state.lastExportAt))
    .sort({ createdAt: 1 })
    .select(
      "name mobile countryCode address skills profilePicture role numberOfWorkersInTeam createdAt status gender aadhaarNumber age email rating",
    );

  console.log(
    `🚀 [Cron] Weekly registrations export: ${users.length} user(s) to export`,
  );

  if (!users.length) {
    state.lastRunAt = now;
    state.lastRunStatus = "success";
    state.rowsExported = 0;
    await state.save();

    const spreadsheetId =
      state.spreadsheetId ||
      process.env[REGISTRATION_SHEET_CONFIG.envSpreadsheetIdKey]?.trim() ||
      null;

    return {
      skipped: false,
      spreadsheetId,
      rowsExported: 0,
      spreadsheetUrl: spreadsheetId ? getSpreadsheetUrl(spreadsheetId) : null,
    };
  }

  try {
    const { spreadsheetId, created } = await ensureExportSpreadsheet(
      REGISTRATION_SHEET_CONFIG,
      state.spreadsheetId,
    );

    if (created || state.spreadsheetId !== spreadsheetId) {
      state.spreadsheetId = spreadsheetId;
      await state.save();
    }

    const startingSerial = await getNextSerialNumber(spreadsheetId);
    const rows = users.map((user, index) =>
      mapUserToRow(user, startingSerial + index),
    );
    await appendRows(spreadsheetId, rows);

    state.spreadsheetId = spreadsheetId;
    state.lastExportAt = now;
    state.lastRunAt = now;
    state.lastRunStatus = "success";
    state.rowsExported = users.length;
    await state.save();

    console.log(
      `🎯 [Cron] Weekly registrations export complete: ${users.length} row(s) appended`,
    );

    return {
      skipped: false,
      spreadsheetId,
      rowsExported: users.length,
      spreadsheetUrl: getSpreadsheetUrl(spreadsheetId),
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

  cron.schedule(
    "0 10 * * 5",
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
};

export default scheduleWeeklyRegistrationsExport;

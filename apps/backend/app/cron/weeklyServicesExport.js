import cron from "node-cron";
import Service from "../models/service.model.js";
import CronJobState from "../models/cronJobState.model.js";
import logError from "../utils/addErrorLog.js";
import { formatSheetDate } from "../utils/formatSheetDate.js";
import { getSkillLabel } from "../utils/skillLabels.js";
import {
  appendRows,
  ensureExportSpreadsheet,
  getNextSerialNumber,
  getSpreadsheetUrl,
  isGoogleSheetsEnabled,
  getStatsSpreadsheetId,
  SERVICE_SHEET_CONFIG,
} from "../utils/googleSheets.js";

export const WEEKLY_SERVICES_JOB_KEY = "weekly_services_export";

const isCronEnabled = () =>
  process.env.CRON_WEEKLY_SERVICES_ENABLED !== "false";

const formatRequirements = (requirements = []) =>
  requirements
    .map((item) => {
      if (!item?.name) return "";
      const skillLabel = getSkillLabel(item.name);
      const perks = [
        item.food ? "Food" : "",
        item.living ? "Living" : "",
        item.pf ? "PF" : "",
        item.insurance ? "Insurance" : "",
      ]
        .filter(Boolean)
        .join("/");
      const perksSuffix = perks ? ` [${perks}]` : "";
      return `${skillLabel} x${item.count} @${item.payPerDay}/day${perksSuffix}`;
    })
    .filter(Boolean)
    .join("; ");

const formatFacilities = (facilities = {}) => {
  const parts = [];
  if (facilities.food) parts.push("Food");
  if (facilities.living) parts.push("Living");
  if (facilities.travelling) parts.push("Travel");
  if (facilities.esi_pf) parts.push("ESI/PF");
  return parts.join(", ");
};

const formatAppliedSkill = (appliedSkill) => {
  if (!appliedSkill) return "";
  if (typeof appliedSkill === "string") return getSkillLabel(appliedSkill);
  return getSkillLabel(
    appliedSkill.skill || appliedSkill.name || appliedSkill.label || "",
  );
};

const formatImages = (images = []) =>
  (Array.isArray(images) ? images : []).filter(Boolean).join(", ");

const mapServiceToRow = (service, serialNumber) => {
  const employer = service.employer || {};
  const promotion = service.socialMediaPromotion || {};

  return [
    String(serialNumber),
    service.jobID || "",
    service.status || "",
    formatSheetDate(service.createdAt),
    employer.name || "",
    employer.countryCode || "91",
    employer.mobile || "",
    getSkillLabel(service.type),
    getSkillLabel(service.subType),
    service.bookingType || "",
    service.address || "",
    formatSheetDate(service.startDate),
    formatSheetDate(service.endDate),
    service.duration != null ? String(service.duration) : "",
    formatRequirements(service.requirements),
    formatFacilities(service.facilities),
    service.description || "",
    promotion.enabled ? "Yes" : "No",
    promotion.status || "",
    promotion.amount != null && promotion.amount > 0
      ? String(promotion.amount)
      : "",
    formatAppliedSkill(service.appliedSkill),
    formatImages(service.images),
    service.uploadStatus || "",
  ];
};

const buildServiceQuery = (lastExportAt) => {
  const query = {};

  if (lastExportAt) {
    query.createdAt = { $gt: lastExportAt };
  }

  return query;
};

export const exportWeeklyServices = async () => {
  if (!isGoogleSheetsEnabled()) {
    console.log(
      "⏭️ [Cron] Weekly services export skipped (GOOGLE_SHEETS_ENABLED is not true)",
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
    jobKey: WEEKLY_SERVICES_JOB_KEY,
  });

  if (!state) {
    state = await CronJobState.create({
      jobKey: WEEKLY_SERVICES_JOB_KEY,
    });
  }

  const services = await Service.find(buildServiceQuery(state.lastExportAt))
    .sort({ createdAt: 1 })
    .populate("employer", "name mobile countryCode")
    .select(
      "jobID status createdAt type subType bookingType address startDate endDate duration requirements facilities description socialMediaPromotion appliedSkill images uploadStatus employer",
    )
    .lean();

  console.log(
    `🚀 [Cron] Weekly services export: ${services.length} service(s) to export`,
  );

  if (!services.length) {
    state.lastRunAt = now;
    state.lastRunStatus = "success";
    state.rowsExported = 0;
    await state.save();

    const spreadsheetId = getStatsSpreadsheetId() || state.spreadsheetId;

    return {
      skipped: false,
      spreadsheetId,
      rowsExported: 0,
      spreadsheetUrl: spreadsheetId ? getSpreadsheetUrl(spreadsheetId) : null,
    };
  }

  try {
    const { spreadsheetId, created } = await ensureExportSpreadsheet(
      SERVICE_SHEET_CONFIG,
      getStatsSpreadsheetId() || state.spreadsheetId,
    );

    if (created || state.spreadsheetId !== spreadsheetId) {
      state.spreadsheetId = spreadsheetId;
      await state.save();
    }

    const startingSerial = await getNextSerialNumber(
      spreadsheetId,
      SERVICE_SHEET_CONFIG.tabName,
    );
    const rows = services.map((service, index) =>
      mapServiceToRow(service, startingSerial + index),
    );
    await appendRows(
      spreadsheetId,
      SERVICE_SHEET_CONFIG.tabName,
      rows,
    );

    state.spreadsheetId = spreadsheetId;
    state.lastExportAt = now;
    state.lastRunAt = now;
    state.lastRunStatus = "success";
    state.rowsExported = services.length;
    await state.save();

    console.log(
      `🎯 [Cron] Weekly services export complete: ${services.length} row(s) appended`,
    );

    return {
      skipped: false,
      spreadsheetId,
      rowsExported: services.length,
      spreadsheetUrl: getSpreadsheetUrl(spreadsheetId),
    };
  } catch (error) {
    state.lastRunAt = now;
    state.lastRunStatus = "failed";
    state.rowsExported = 0;
    await state.save();

    logError(error, null, 500, "cronJob - weeklyServicesExport");
    console.error("❌ [Cron] Weekly services export failed:", error);
    throw error;
  }
};

const scheduleWeeklyServicesExport = () => {
  if (!isCronEnabled()) {
    console.log(
      "⏭️ [Cron] Weekly services export scheduler disabled (CRON_WEEKLY_SERVICES_ENABLED=false)",
    );
    return;
  }

  cron.schedule(
    "0 10 * * 5",
    async () => {
      console.log("⏰ [Cron] Running weeklyServicesExport...");
      try {
        await exportWeeklyServices();
      } catch {
        // exportWeeklyServices already logs errors
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );
};

export default scheduleWeeklyServicesExport;

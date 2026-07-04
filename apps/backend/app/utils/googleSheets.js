import http from "http";
import https from "https";
import { google } from "googleapis";

export const REGISTRATION_EXPORT_HEADERS = [
  "Serial Number",
  "Name",
  "Status",
  "Country Code",
  "Mobile",
  "Role",
  "Team Workers",
  "Skills",
  "Rating",
  "Address",
  "Gender",
  "Age",
  "Email",
  "Aadhaar Number",
  "Registration Date",
  "Profile Picture",
];

export const SERVICE_EXPORT_HEADERS = [
  "Serial Number",
  "Job ID",
  "Status",
  "Created Date",
  "Employer Name",
  "Employer Country Code",
  "Employer Mobile",
  "Type",
  "Sub Type",
  "Booking Type",
  "Address",
  "Start Date",
  "End Date",
  "Duration (Days)",
  "Requirements",
  "Facilities",
  "Description",
  "Social Media Promotion",
  "Promotion Status",
  "Promotion Amount",
  "Applied Skill",
  "Images",
  "Upload Status",
];

export const REGISTRATION_SHEET_CONFIG = {
  headers: REGISTRATION_EXPORT_HEADERS,
  title: "Apna Rojgar - Weekly Registrations",
  envSpreadsheetIdKey: "GOOGLE_SHEETS_SPREADSHEET_ID",
};

export const SERVICE_SHEET_CONFIG = {
  headers: SERVICE_EXPORT_HEADERS,
  title: "Apna Rojgar - Weekly Services",
  envSpreadsheetIdKey: "GOOGLE_SHEETS_SERVICES_SPREADSHEET_ID",
};

const SHEET_RANGE = "Sheet1!A1";

export const isGoogleSheetsEnabled = () =>
  process.env.GOOGLE_SHEETS_ENABLED === "true";

export const getSpreadsheetUrl = (spreadsheetId) =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

const getPrivateKey = () => {
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not configured");
  }
  return rawKey.replace(/\\n/g, "\n").trim();
};

const googleHttpAgent = new http.Agent({ keepAlive: false });
const googleHttpsAgent = new https.Agent({ keepAlive: false });

const getGoogleAuthOptions = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!email) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured");
  }

  const transporterOptions = {
    agent: (parsedUrl) =>
      parsedUrl.protocol === "https:" ? googleHttpsAgent : googleHttpAgent,
  };

  if (typeof globalThis.fetch === "function") {
    transporterOptions.fetchImplementation = globalThis.fetch.bind(globalThis);
  }

  return {
    email,
    key: getPrivateKey(),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
    transporterOptions,
  };
};

let cachedAuthClient = null;

const getAuthClient = () => {
  if (!cachedAuthClient) {
    cachedAuthClient = new google.auth.JWT(getGoogleAuthOptions());
  }
  return cachedAuthClient;
};

const wrapGoogleApiError = (error, action, envSpreadsheetIdKey) => {
  const status = error?.response?.status ?? error?.code;
  const apiError = error?.response?.data?.error;
  const message = apiError?.message || error?.message;
  const reason = apiError?.errors?.[0]?.reason;

  if (reason === "storageQuotaExceeded") {
    throw new Error(
      `Google Drive storage quota exceeded for service account "${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}". ` +
        "Create a Google Sheet in your Gmail account, share it with the service account as Editor, " +
        `then set ${envSpreadsheetIdKey} in env.`,
    );
  }

  if (status === 403) {
    throw new Error(
      `Google Sheets ${action} failed (403): ${message}. ` +
        "Create a sheet in your Gmail, share it with the service account as Editor, " +
        `and set ${envSpreadsheetIdKey} instead of auto-creating.`,
    );
  }

  throw error;
};

const getSheetsClient = async () => {
  const auth = getAuthClient();
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
};

const getDriveClient = async () => {
  const auth = getAuthClient();
  await auth.authorize();
  return google.drive({ version: "v3", auth });
};

const shareSpreadsheetWithEmail = async (spreadsheetId, email) => {
  if (!email) return;

  const drive = await getDriveClient();
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: email,
    },
    sendNotificationEmail: true,
  });
};

const getHeaderRange = (headers) => {
  const columnCount = headers.length;
  let col = "";
  let num = columnCount;
  while (num > 0) {
    const rem = (num - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    num = Math.floor((num - 1) / 26);
  }
  return `Sheet1!A1:${col}1`;
};

const spreadsheetHasHeaderRow = async (spreadsheetId, headers) => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: getHeaderRange(headers),
  });
  const firstRow = response.data.values?.[0] || [];
  return headers.every((header, index) => firstRow[index] === header);
};

const writeHeaderRow = async (spreadsheetId, headers) => {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [headers],
    },
  });
};

const createSpreadsheetViaDrive = async (title, envSpreadsheetIdKey) => {
  const drive = await getDriveClient();
  try {
    const response = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
      fields: "id",
    });
    return response.data.id;
  } catch (error) {
    wrapGoogleApiError(error, "spreadsheet creation", envSpreadsheetIdKey);
  }
};

const initializeSpreadsheet = async (
  spreadsheetId,
  sheetConfig,
  { shareOnCreate = false } = {},
) => {
  const hasHeaders = await spreadsheetHasHeaderRow(
    spreadsheetId,
    sheetConfig.headers,
  ).catch(() => false);

  if (!hasHeaders) {
    await writeHeaderRow(spreadsheetId, sheetConfig.headers);
  }

  if (shareOnCreate) {
    await shareSpreadsheetWithEmail(
      spreadsheetId,
      process.env.GOOGLE_SHEETS_SHARE_WITH_EMAIL?.trim(),
    );
  }
};

export const ensureExportSpreadsheet = async (
  sheetConfig,
  existingSpreadsheetId = "",
) => {
  if (!isGoogleSheetsEnabled()) {
    throw new Error("Google Sheets export is disabled (GOOGLE_SHEETS_ENABLED)");
  }

  const envSpreadsheetId =
    process.env[sheetConfig.envSpreadsheetIdKey]?.trim() || "";
  const spreadsheetId = existingSpreadsheetId || envSpreadsheetId || "";

  if (spreadsheetId) {
    await initializeSpreadsheet(spreadsheetId, sheetConfig);
    return { spreadsheetId, created: false };
  }

  const newSpreadsheetId = await createSpreadsheetViaDrive(
    sheetConfig.title,
    sheetConfig.envSpreadsheetIdKey,
  );

  if (!newSpreadsheetId) {
    throw new Error("Failed to create Google Spreadsheet");
  }

  await initializeSpreadsheet(newSpreadsheetId, sheetConfig, {
    shareOnCreate: true,
  });

  return { spreadsheetId: newSpreadsheetId, created: true };
};

/** @deprecated Use ensureExportSpreadsheet(REGISTRATION_SHEET_CONFIG) */
export const ensureSpreadsheet = async (existingSpreadsheetId = "") =>
  ensureExportSpreadsheet(REGISTRATION_SHEET_CONFIG, existingSpreadsheetId);

export const appendRows = async (spreadsheetId, rows) => {
  if (!rows.length) return;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });
};

export const getNextSerialNumber = async (spreadsheetId) => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A:A",
  });
  const rowCount = response.data.values?.length || 0;
  return rowCount <= 1 ? 1 : rowCount;
};

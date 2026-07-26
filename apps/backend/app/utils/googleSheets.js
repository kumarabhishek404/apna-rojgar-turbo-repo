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

export const STATS_SPREADSHEET_TITLE = "Apna Rojgar Stats";

export const REGISTRATION_SHEET_CONFIG = {
  headers: REGISTRATION_EXPORT_HEADERS,
  tabName: "Weekly Registrations",
  dateColumnIndexes: [REGISTRATION_EXPORT_HEADERS.indexOf("Registration Date")],
};

export const SERVICE_SHEET_CONFIG = {
  headers: SERVICE_EXPORT_HEADERS,
  tabName: "Weekly Services",
  dateColumnIndexes: [
    SERVICE_EXPORT_HEADERS.indexOf("Created Date"),
    SERVICE_EXPORT_HEADERS.indexOf("Start Date"),
    SERVICE_EXPORT_HEADERS.indexOf("End Date"),
  ],
};

export const BLOG_QUEUE_HEADERS = [
  "Title",
  "Slug",
  "Excerpt",
  "Content",
  "Cover Image URL",
  "Google Doc ID",
  "Status",
  "Posted At",
  "Error",
];

export const BLOG_QUEUE_SHEET_CONFIG = {
  headers: BLOG_QUEUE_HEADERS,
  tabName: "Blog Queue",
  dateColumnIndexes: [BLOG_QUEUE_HEADERS.indexOf("Posted At")],
};

/** @deprecated Use GOOGLE_SHEETS_SPREADSHEET_ID only; kept as fallback for older env. */
const LEGACY_SERVICES_SPREADSHEET_ID_KEY = "GOOGLE_SHEETS_SERVICES_SPREADSHEET_ID";
const STATS_SPREADSHEET_ID_KEY = "GOOGLE_SHEETS_SPREADSHEET_ID";

export const getStatsSpreadsheetId = () =>
  process.env[STATS_SPREADSHEET_ID_KEY]?.trim() ||
  process.env[LEGACY_SERVICES_SPREADSHEET_ID_KEY]?.trim() ||
  "";

export const getBlogSpreadsheetId = () =>
  process.env.GOOGLE_BLOG_SHEET_ID?.trim() || getStatsSpreadsheetId();

/** Google Doc that holds blog drafts as Document tabs. */
export const getBlogDocumentId = () => {
  const raw =
    process.env.GOOGLE_BLOG_DOC_ID?.trim() ||
    process.env.GOOGLE_BLOG_DOCUMENT_ID?.trim() ||
    "";
  if (!raw) return "";
  const fromUrl = raw.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return fromUrl?.[1] || raw;
};

export const isGoogleSheetsEnabled = () =>
  process.env.GOOGLE_SHEETS_ENABLED === "true";

export const isGoogleBlogImportEnabled = () =>
  process.env.GOOGLE_BLOG_IMPORT_ENABLED === "true";

/** @internal shared JWT auth for Sheets / Drive / Docs */
export const getGoogleAuthClient = () => getAuthClient();

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
      "https://www.googleapis.com/auth/documents",
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

const wrapGoogleApiError = (error, action) => {
  const status = error?.response?.status ?? error?.code;
  const apiError = error?.response?.data?.error;
  const message = apiError?.message || error?.message;
  const reason = apiError?.errors?.[0]?.reason;

  if (reason === "storageQuotaExceeded") {
    throw new Error(
      `Google Drive storage quota exceeded for service account "${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}". ` +
        "Create a Google Sheet in your Gmail account, share it with the service account as Editor, " +
        `then set ${STATS_SPREADSHEET_ID_KEY} in env.`,
    );
  }

  if (status === 403) {
    throw new Error(
      `Google Sheets ${action} failed (403): ${message}. ` +
        "Create a sheet in your Gmail, share it with the service account as Editor, " +
        `and set ${STATS_SPREADSHEET_ID_KEY} instead of auto-creating.`,
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

const quoteSheetTab = (tabName) => `'${tabName.replace(/'/g, "''")}'`;

const getTabRange = (tabName, cellRange) =>
  `${quoteSheetTab(tabName)}!${cellRange}`;

const columnIndexToLetter = (columnCount) => {
  let col = "";
  let num = columnCount;
  while (num > 0) {
    const rem = (num - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
};

const getHeaderRange = (tabName, headers) => {
  const lastCol = columnIndexToLetter(headers.length);
  return getTabRange(tabName, `A1:${lastCol}1`);
};

const getSpreadsheetTabs = async (spreadsheetId) => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
  return response.data.sheets || [];
};

const findTabByName = (tabs, tabName) =>
  tabs.find((tab) => tab.properties?.title === tabName);

const batchUpdateSpreadsheet = async (spreadsheetId, requests) => {
  if (!requests.length) return;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
};

const ensureSheetTab = async (spreadsheetId, tabName) => {
  const tabs = await getSpreadsheetTabs(spreadsheetId);
  if (findTabByName(tabs, tabName)) return;

  const defaultTab = tabs.find((tab) => tab.properties?.title === "Sheet1");
  if (defaultTab && tabs.length === 1) {
    await batchUpdateSpreadsheet(spreadsheetId, [
      {
        updateSheetProperties: {
          properties: {
            sheetId: defaultTab.properties.sheetId,
            title: tabName,
          },
          fields: "title",
        },
      },
    ]);
    return;
  }

  await batchUpdateSpreadsheet(spreadsheetId, [
    {
      addSheet: {
        properties: { title: tabName },
      },
    },
  ]);
};

const spreadsheetHasHeaderRow = async (spreadsheetId, tabName, headers) => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: getHeaderRange(tabName, headers),
  });
  const firstRow = response.data.values?.[0] || [];
  return headers.every((header, index) => firstRow[index] === header);
};

const writeHeaderRow = async (spreadsheetId, tabName, headers) => {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: getTabRange(tabName, "A1"),
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [headers],
    },
  });
};

const createSpreadsheetViaDrive = async (title) => {
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
    wrapGoogleApiError(error, "spreadsheet creation");
  }
};

const DATE_COLUMN_NUMBER_FORMAT = {
  type: "DATE",
  pattern: "dd/mm/yyyy",
};

const getTabSheetId = async (spreadsheetId, tabName) => {
  const tabs = await getSpreadsheetTabs(spreadsheetId);
  const tab = findTabByName(tabs, tabName);
  return tab?.properties?.sheetId ?? null;
};

const applyDateColumnFormats = async (
  spreadsheetId,
  tabName,
  columnIndexes = [],
) => {
  const sheetId = await getTabSheetId(spreadsheetId, tabName);
  if (sheetId == null || !columnIndexes.length) return;

  const requests = columnIndexes
    .filter((index) => index >= 0)
    .map((columnIndex) => ({
      repeatCell: {
        range: {
          sheetId,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 1,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: DATE_COLUMN_NUMBER_FORMAT,
          },
        },
        fields: "userEnteredFormat.numberFormat",
      },
    }));

  await batchUpdateSpreadsheet(spreadsheetId, requests);
};

const initializeSheetTab = async (spreadsheetId, sheetConfig) => {
  await ensureSheetTab(spreadsheetId, sheetConfig.tabName);

  const hasHeaders = await spreadsheetHasHeaderRow(
    spreadsheetId,
    sheetConfig.tabName,
    sheetConfig.headers,
  ).catch(() => false);

  if (!hasHeaders) {
    await writeHeaderRow(
      spreadsheetId,
      sheetConfig.tabName,
      sheetConfig.headers,
    );
  }

  await applyDateColumnFormats(
    spreadsheetId,
    sheetConfig.tabName,
    sheetConfig.dateColumnIndexes,
  );
};

const initializeStatsSpreadsheet = async (
  spreadsheetId,
  { shareOnCreate = false } = {},
) => {
  // Only registration + services tabs — never create Blog Queue here.
  // Blog Queue is initialized only via ensureBlogQueueSpreadsheet when blog import runs.
  await initializeSheetTab(spreadsheetId, REGISTRATION_SHEET_CONFIG);
  await initializeSheetTab(spreadsheetId, SERVICE_SHEET_CONFIG);

  if (shareOnCreate) {
    await shareSpreadsheetWithEmail(
      spreadsheetId,
      process.env.GOOGLE_SHEETS_SHARE_WITH_EMAIL?.trim(),
    );
  }
};

export const ensureBlogQueueSpreadsheet = async (existingSpreadsheetId = "") => {
  if (!isGoogleBlogImportEnabled()) {
    throw new Error("Google blog import is disabled (GOOGLE_BLOG_IMPORT_ENABLED)");
  }

  const spreadsheetId =
    existingSpreadsheetId || getBlogSpreadsheetId() || "";

  if (!spreadsheetId) {
    throw new Error(
      "Set GOOGLE_BLOG_SHEET_ID (or GOOGLE_SHEETS_SPREADSHEET_ID) for the Blog Queue sheet",
    );
  }

  await initializeSheetTab(spreadsheetId, BLOG_QUEUE_SHEET_CONFIG);
  return { spreadsheetId, created: false };
};

export const readSheetRows = async (spreadsheetId, tabName) => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: getTabRange(tabName, "A:Z"),
  });
  return response.data.values || [];
};

export const updateSheetRowValues = async (
  spreadsheetId,
  tabName,
  rowNumber,
  values,
) => {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: getTabRange(tabName, `A${rowNumber}`),
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
};

/**
 * Export a Google Doc as plain text. Doc must be shared with the service account.
 */
export const exportGoogleDocPlainText = async (docId) => {
  const drive = await getDriveClient();
  try {
    const response = await drive.files.export(
      {
        fileId: docId,
        mimeType: "text/plain",
      },
      { responseType: "text" },
    );
    return String(response.data || "").trim();
  } catch (error) {
    wrapGoogleApiError(error, "Google Doc export");
  }
};

export const extractGoogleDocId = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{25,}$/.test(raw)) return raw;
  const match = raw.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || "";
};

export const ensureExportSpreadsheet = async (
  sheetConfig,
  existingSpreadsheetId = "",
) => {
  if (!isGoogleSheetsEnabled()) {
    throw new Error("Google Sheets export is disabled (GOOGLE_SHEETS_ENABLED)");
  }

  const spreadsheetId =
    existingSpreadsheetId || getStatsSpreadsheetId() || "";

  if (spreadsheetId) {
    await initializeStatsSpreadsheet(spreadsheetId);
    return { spreadsheetId, created: false };
  }

  const newSpreadsheetId = await createSpreadsheetViaDrive(
    STATS_SPREADSHEET_TITLE,
  );

  if (!newSpreadsheetId) {
    throw new Error("Failed to create Google Spreadsheet");
  }

  await initializeStatsSpreadsheet(newSpreadsheetId, {
    shareOnCreate: true,
  });

  return { spreadsheetId: newSpreadsheetId, created: true };
};

/** @deprecated Use ensureExportSpreadsheet(REGISTRATION_SHEET_CONFIG) */
export const ensureSpreadsheet = async (existingSpreadsheetId = "") =>
  ensureExportSpreadsheet(REGISTRATION_SHEET_CONFIG, existingSpreadsheetId);

export const appendRows = async (spreadsheetId, tabName, rows) => {
  if (!rows.length) return;

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: getTabRange(tabName, "A1"),
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });
};

export const getNextSerialNumber = async (spreadsheetId, tabName) => {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: getTabRange(tabName, "A:A"),
  });
  const rowCount = response.data.values?.length || 0;
  return rowCount <= 1 ? 1 : rowCount;
};

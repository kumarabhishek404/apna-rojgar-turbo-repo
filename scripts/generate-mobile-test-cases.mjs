#!/usr/bin/env node
/**
 * Generates apps/mobile/docs/testing/apna-rojgar-android-test-cases.xlsx
 * — one sheet per screen, enriched for new QA testers.
 * Run: node scripts/generate-mobile-test-cases.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { allTestCases } from "./mobile-test-cases/index.js";
import {
  enrichTestCase,
  groupByScreen,
  toSheetName,
} from "./mobile-test-cases/enrich.js";
import { getSheetInfo } from "./mobile-test-cases/screen-groups.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "apps/mobile/docs/testing");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "apna-rojgar-android-test-cases.xlsx");

const TEST_DATE = "2026-05-30";
const APP_VERSION = "1.3.1";

const COLUMNS = [
  { header: "S.No", key: "sno", width: 6 },
  { header: "Test ID", key: "testId", width: 13 },
  { header: "Sub-Screen", key: "screenName", width: 20 },
  { header: "Test Case Title", key: "title", width: 34 },
  { header: "Test Type", key: "testType", width: 14 },
  { header: "Role", key: "role", width: 11 },
  { header: "Pre-requisites", key: "prerequisites", width: 34 },
  { header: "Steps", key: "steps", width: 48 },
  { header: "Expected Result", key: "expectedResult", width: 38 },
  { header: "Actual Result", key: "actualResult", width: 28 },
  { header: "Status", key: "status", width: 12 },
  { header: "Test Date", key: "testDate", width: 11 },
  { header: "Tester Name", key: "testerName", width: 14 },
  { header: "Device / Android Version", key: "device", width: 22 },
  { header: "Screenshots", key: "screenshots", width: 22 },
  { header: "Found Issues", key: "foundIssues", width: 28 },
  { header: "Suggestions", key: "suggestions", width: 22 },
  { header: "Notes", key: "notes", width: 24 },
];

const STATUS_OPTIONS = '"Not Tested,Pass,Fail,Blocked,N/A"';

const THIN_BORDER = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

function styleHeaderRow(sheet, rowNum = 1) {
  const headerRow = sheet.getRow(rowNum);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1565C0" },
  };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 28;
}

function addScreenBanner(sheet, sheetGroup, cases, startRow = 1) {
  const info = getSheetInfo(sheetGroup);
  sheet.mergeCells(`A${startRow}:P${startRow}`);
  const titleCell = sheet.getCell(`A${startRow}`);
  titleCell.value = `SCREEN AREA: ${sheetGroup}`;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1565C0" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE3F2FD" },
  };
  titleCell.alignment = { vertical: "middle", wrapText: true };
  sheet.getRow(startRow).height = 24;

  const descRow = startRow + 1;
  sheet.mergeCells(`A${descRow}:P${descRow}`);
  const descCell = sheet.getCell(`A${descRow}`);
  descCell.value = `How to open: ${info.howToReach}  ·  ${cases.length} cases`;
  descCell.alignment = { vertical: "middle", wrapText: true };
  descCell.font = { size: 10 };
  sheet.getRow(descRow).height = 28;

  return startRow + 3;
}

function populateCaseRows(sheet, cases, headerRowNum) {
  COLUMNS.forEach((col, i) => {
    sheet.getCell(headerRowNum, i + 1).value = col.header;
    sheet.getColumn(i + 1).width = col.width;
  });
  styleHeaderRow(sheet, headerRowNum);
  // No frozen panes — full-page scroll (default) in Excel / Google Sheets

  const dataStart = headerRowNum + 1;

  cases.forEach((tc, index) => {
    const rowNum = dataStart + index;
    const row = sheet.getRow(rowNum);
    row.values = [
      index + 1,
      tc.testId,
      tc.screenName,
      tc.title,
      tc.testType,
      tc.role,
      tc.prerequisites,
      tc.steps,
      tc.expectedResult,
      "",
      "Not Tested",
      TEST_DATE,
      "",
      "",
      "",
      "",
      tc.suggestions || "",
      tc.notes || "",
    ];
    row.alignment = { vertical: "top", wrapText: true };
    row.height = 56;

    // Uniform white cells with grid borders (no per-type background fill)
    for (let col = 1; col <= COLUMNS.length; col++) {
      const cell = row.getCell(col);
      cell.border = THIN_BORDER;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    }

    row.getCell(11).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [STATUS_OPTIONS],
    };
  });

  sheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: dataStart + cases.length - 1, column: COLUMNS.length },
  };
}

function buildHowToTestRows() {
  return [
    ["How to Test — Quick Start"],
    [""],
    ["App", "Apna Rojgar Android v" + APP_VERSION],
    ["Setup", "Read Test Accounts → install staging APK → pick a screen tab"],
    [""],
    ["Per test case"],
    ["1", "Read the blue banner once — it shows how to open that screen."],
    ["2", "Pre-requisites = account + setup only (one short line)."],
    ["3", "Steps = what to tap/show on the phone, in order."],
    ["4", "Expected Result = what you should see if it passes."],
    ["5", "Mark Status. Add screenshot + Found Issues if Fail."],
    [""],
    ["Status", "Meaning"],
    ["Pass", "Expected Result matched"],
    ["Fail", "Did not match — note what you saw"],
    ["Blocked", "Cannot test (no account, API down)"],
    ["N/A", "Not in this build / not applicable"],
    ["Not Tested", "Default until you run it"],
    [""],
    ["Test type", "Meaning"],
    ["Availability", "Element is visible"],
    ["Functionality", "Action works end-to-end"],
    ["UI Design", "Looks correct (layout, text, spacing)"],
    [""],
    ["Tip", "Staging OTP is often 000000 — see Test Accounts"],
  ];
}

function buildTestAccountRows() {
  return [
    ["Test Accounts & Data Setup"],
    [""],
    ["Role", "What to prepare", "Example use"],
    [
      "Worker",
      "Mobile registered as Worker; at least 1 skill on profile; 1+ active job on server to apply to",
      "Apply to job, accept booking invitation, view Activity → Applied Jobs",
    ],
    [
      "Employer",
      "Mobile registered as Employer; 1 posted job; 1+ worker booked for attendance tests",
      "Post job wizard, select applicants, mark attendance, complete booking",
    ],
    [
      "Mediator",
      "Mobile registered as Mediator; 2+ team members; pending team requests optional",
      "Apply to job with team, manage team requests, People tab active works",
    ],
    [
      "Admin",
      "Mobile with Admin role on backend; permission to suspend/activate users",
      "Users tab, Services tab, Requests tab, All Feedback screen",
    ],
    [
      "Guest",
      "A mobile number NOT yet registered (or logged-out state)",
      "Full registration flow Step 1 → 5, login validation errors",
    ],
    [""],
    ["ENVIRONMENT"],
    ["Variable", "Location", "Notes"],
    ["EXPO_PUBLIC_BASE_URL", "apps/mobile/.env", "Must point to staging/dev API for test data"],
    ["Dev OTP", "000000", "Works on staging/dev only — do NOT use in production"],
    ["App version", APP_VERSION, "Verify in Profile or About if shown"],
    [""],
    ["DISPOSABLE ACCOUNTS"],
    ["Use a throwaway number for: Delete Account tests, full registration flow tests."],
    ["Never delete or suspend accounts other testers rely on without team agreement."],
  ];
}

function buildReadmeRows(screenCount, totalCases) {
  return [
    ["Apna Rojgar — Android Manual Test Cases (By Screen)"],
    [""],
    ["Document Version", "2.0"],
    ["App Version", APP_VERSION],
    ["Generated Date", TEST_DATE],
    ["Platform", "Android"],
    ["Total Test Cases", totalCases],
    ["Screen Sheets", screenCount],
    [""],
    ["WORKBOOK STRUCTURE"],
    ["README", "This sheet — overview"],
    ["How to Test", "Step-by-step guide for new testers"],
    ["Test Accounts", "Roles, test data, environment variables"],
    ["Screen Index", "List of all screen tabs and case counts"],
    ["Summary", "Counts by module, role, and test type"],
    ["<Screen Name>", "One tab per screen — cases for that screen only"],
    [""],
    ["GOOGLE SHEETS"],
    ["File → Import → Upload this .xlsx. All screen tabs will import as separate sheets."],
    [""],
    ["COLUMN QUICK REFERENCE"],
    ["Pre-requisites", "Account role + short setup (one line)"],
    ["Steps", "Actions to perform on the phone — follow in order"],
    ["Expected Result", "What should happen if the test passes"],
    ["Actual Result", "What you actually saw (your words)"],
    ["Status", "Pass / Fail / Blocked / N/A / Not Tested"],
  ];
}

function buildIndexRows(screenGroups) {
  const rows = [
    ["Screen Index — open the sheet tab listed in 'Sheet Tab' column"],
    [""],
    ["#", "Screen Area", "Sheet Tab", "Test Cases", "Example Sub-Screens"],
  ];
  let i = 0;
  const usedNames = new Set(["README", "How to Test", "Test Accounts", "Screen Index", "Summary"]);
  const sorted = [...screenGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [sheetGroup, cases] of sorted) {
    i += 1;
    const sheetTab = toSheetName(sheetGroup, usedNames);
    const subScreens = [...new Set(cases.map((c) => c.screenName))].slice(0, 4).join(", ");
    rows.push([i, sheetGroup, sheetTab, cases.length, subScreens]);
  }
  return rows;
}

function buildSummaryRows(cases, screenCount) {
  const byModule = {};
  const byRole = {};
  const byType = {};

  for (const tc of cases) {
    byModule[tc.module] = (byModule[tc.module] || 0) + 1;
    byRole[tc.role] = (byRole[tc.role] || 0) + 1;
    byType[tc.testType] = (byType[tc.testType] || 0) + 1;
  }

  return [
    ["Summary — Apna Rojgar Android Test Cases"],
    [""],
    ["Total Test Cases", cases.length],
    ["Screen Sheets", screenCount],
    ["Generated", TEST_DATE],
    ["App Version", APP_VERSION],
    [""],
    ["BY MODULE", "Count"],
    ...Object.entries(byModule).sort((a, b) => b[1] - a[1]),
    [""],
    ["BY ROLE", "Count"],
    ...Object.entries(byRole).sort((a, b) => b[1] - a[1]),
    [""],
    ["BY TEST TYPE", "Count"],
    ...Object.entries(byType).sort((a, b) => b[1] - a[1]),
    [""],
    ["EXECUTION TRACKING (update during test run)"],
    ["Pass", 0],
    ["Fail", 0],
    ["Blocked", 0],
    ["Not Tested", cases.length],
    ["N/A", 0],
  ];
}

async function main() {
  const screenGroups = groupByScreen(allTestCases);
  const enriched = [];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Apna Rojgar QA";
  workbook.created = new Date();

  // README
  const readme = workbook.addWorksheet("README");
  for (const row of buildReadmeRows(screenGroups.size, enriched.length)) {
    readme.addRow(row);
  }
  readme.getColumn(1).width = 28;
  readme.getColumn(2).width = 60;
  readme.getRow(1).font = { bold: true, size: 14 };

  // How to Test
  const howTo = workbook.addWorksheet("How to Test");
  for (const row of buildHowToTestRows()) {
    howTo.addRow(row);
  }
  howTo.getColumn(1).width = 18;
  howTo.getColumn(2).width = 70;
  howTo.getRow(1).font = { bold: true, size: 14 };

  // Test Accounts
  const accounts = workbook.addWorksheet("Test Accounts");
  for (const row of buildTestAccountRows()) {
    accounts.addRow(row);
  }
  accounts.getColumn(1).width = 14;
  accounts.getColumn(2).width = 55;
  accounts.getColumn(3).width = 45;
  accounts.getRow(1).font = { bold: true, size: 14 };

  // Screen Index
  const index = workbook.addWorksheet("Screen Index");
  for (const row of buildIndexRows(screenGroups)) {
    index.addRow(row);
  }
  index.getRow(1).font = { bold: true, size: 12 };
  index.getRow(3).font = { bold: true };
  [6, 28, 22, 12, 40].forEach((w, i) => {
    index.getColumn(i + 1).width = w;
  });

  // Per-screen sheets (sorted alphabetically by screen name)
  const usedSheetNames = new Set([
    "README",
    "How to Test",
    "Test Accounts",
    "Screen Index",
    "Summary",
  ]);
  const sortedScreens = [...screenGroups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [sheetGroup, cases] of sortedScreens) {
    const enrichedCases = cases.map((tc) => enrichTestCase(tc, { sheetGroup }));
    enriched.push(...enrichedCases);

    const sheetLabel = toSheetName(sheetGroup, usedSheetNames);
    const sheet = workbook.addWorksheet(sheetLabel);
    const headerRow = addScreenBanner(sheet, sheetGroup, enrichedCases, 1);
    populateCaseRows(sheet, enrichedCases, headerRow);
  }

  // Summary
  const summary = workbook.addWorksheet("Summary");
  for (const row of buildSummaryRows(enriched, screenGroups.size)) {
    summary.addRow(row);
  }
  summary.getColumn(1).width = 32;
  summary.getColumn(2).width = 12;
  summary.getRow(1).font = { bold: true, size: 14 };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await workbook.xlsx.writeFile(OUTPUT_FILE);

  console.log(
    `Generated ${enriched.length} test cases across ${screenGroups.size} screen sheets → ${OUTPUT_FILE}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

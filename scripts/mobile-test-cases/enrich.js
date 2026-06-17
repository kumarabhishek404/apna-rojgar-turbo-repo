/**
 * Formats raw test cases into short, demo-friendly steps for new testers.
 * Navigation lives on each sheet banner — not repeated in every row.
 */
import { getSheetGroup } from "./screen-groups.js";
import { formatNumberedSteps } from "./navigation.js";

function roleLine(role) {
  if (role === "Guest") return "Logged out";
  if (role === "All") return "Any test account";
  return `${role} account`;
}

function compactSetup(raw, role) {
  if (!raw?.trim()) return "";

  let text = raw.trim().replace(/\s+/g, " ");

  if (role === "Guest") {
    text = text
      .replace(
        /App is installed fresh OR user has logged out[^.]*\.\s*/i,
        ""
      )
      .replace(/No active session\.\s*/i, "")
      .replace(/Logged out\.?\s*/gi, "")
      .trim();
  }

  text = text.replace(/\(see Test Accounts sheet\)/gi, "").trim();
  text = text.replace(/ask QA lead for[^.;,)]+/gi, "use team test data");
  text = text.replace(/EXPO_PUBLIC_BASE_URL points to staging/gi, "staging API");

  return text.replace(/\.\s*$/, "").trim();
}

function expandPrerequisites(raw, tc) {
  const role = tc.role || "All";
  const setup = compactSetup(raw, role);
  const account = roleLine(role);

  if (!setup) return account;
  if (setup.toLowerCase().includes(account.toLowerCase())) return setup;
  return `${account} · ${setup}`;
}

function stripSheetContext(line, sheetGroup) {
  if (!sheetGroup) return line;

  const label = sheetGroup.replace(/^\d+\s-\s/, "").toLowerCase();

  if (label.includes("login")) {
    line = line.replace(/^Open the app while logged out[^.]*\.\s*/i, "");
    line = line.replace(/^On the Login screen,\s*/i, "");
  }
  if (label.includes("home tab")) {
    line = line.replace(/^On the Home tab,\s*/i, "");
    line = line.replace(/^From the Home tab,\s*/i, "");
  }
  if (label.includes("register")) {
    line = line.replace(/^On the registration screen,\s*/i, "");
  }

  return line
    .replace(/\s*\(e\.g\.[^)]+\)/gi, "")
    .replace(/\s*— use your team's test number/gi, "")
    .replace(/\s*— use team test number/gi, "")
    .replace(/\(or ask QA lead for staging OTP\)/gi, "(staging: 000000)")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function expandSteps(rawSteps, sheetGroup) {
  const testLines = rawSteps
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .map((l) => stripSheetContext(l, sheetGroup))
    .map((l) => capitalizeFirst(l))
    .filter(Boolean);

  if (testLines.length === 0) return rawSteps;
  return formatNumberedSteps(testLines);
}

function expandExpected(raw) {
  const items = raw
    .split(/[;\n]/)
    .map((s) => s.replace(/^✓\s*/, "").trim())
    .filter(Boolean);

  return items
    .map((item, i) => {
      const text = item.endsWith(".") ? item : `${item}.`;
      return `${i + 1}. ${text}`;
    })
    .join("\n");
}

/** Apply formatting to a single test case. */
export function enrichTestCase(tc, { sheetGroup } = {}) {
  const group = sheetGroup || getSheetGroup(tc.screenName, tc.route, tc.module);

  return {
    ...tc,
    prerequisites: expandPrerequisites(tc.prerequisites, tc),
    steps: expandSteps(tc.steps, group),
    expectedResult: expandExpected(tc.expectedResult),
  };
}

/** Group cases by primary screen sheet. */
export function groupByScreen(cases) {
  const groups = new Map();
  for (const tc of cases) {
    const key = getSheetGroup(tc.screenName, tc.route, tc.module);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tc);
  }
  for (const [, list] of groups) {
    list.sort(
      (a, b) =>
        a.screenName.localeCompare(b.screenName) ||
        a.testId.localeCompare(b.testId)
    );
  }
  return groups;
}

/** Excel-safe sheet name (max 31 chars). Case-insensitive uniqueness. */
export function toSheetName(sheetGroup, usedNames) {
  let name = sheetGroup
    .replace(/[\\/?*[\]:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length > 31) name = name.slice(0, 31);

  const lowerUsed = new Set([...usedNames].map((n) => n.toLowerCase()));
  let candidate = name;
  let n = 2;
  while (lowerUsed.has(candidate.toLowerCase())) {
    const suffix = ` ${n}`;
    candidate = name.slice(0, 31 - suffix.length) + suffix;
    n++;
  }
  usedNames.add(candidate);
  return candidate;
}

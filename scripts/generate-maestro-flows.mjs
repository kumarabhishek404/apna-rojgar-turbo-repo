#!/usr/bin/env node
/**
 * Generates Maestro YAML flows from scripts/mobile-test-cases/modules/*
 * Output: apps/mobile/maestro/flows/generated/
 *
 * Run: node scripts/generate-maestro-flows.mjs
 * Or:  pnpm generate:maestro-flows
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allTestCases } from "./mobile-test-cases/index.js";
import { enrichTestCase, groupByScreen } from "./mobile-test-cases/enrich.js";
import { getSheetGroup } from "./mobile-test-cases/screen-groups.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_ROOT = path.join(ROOT, "apps/mobile/maestro/flows/generated");
const APP_ID = "com.kumarabhishek404.labourapp";

const HELPERS_FROM_GENERATED = "../../helpers";

const ROLE_LOGIN_FLOW = {
  Worker: `${HELPERS_FROM_GENERATED}/login-worker.yaml`,
  Employer: `${HELPERS_FROM_GENERATED}/login-employer.yaml`,
  Mediator: `${HELPERS_FROM_GENERATED}/login-mediator.yaml`,
  Admin: `${HELPERS_FROM_GENERATED}/login-admin.yaml`,
  Guest: null,
  All: `${HELPERS_FROM_GENERATED}/login-worker.yaml`,
};

const MANUAL_ONLY_PATTERNS = [
  /camera/i,
  /selfie/i,
  /biometric/i,
  /push notification/i,
  /sms/i,
  /visual/i,
  /color contrast/i,
  /hindi typography/i,
  /500 response/i,
  /404 response/i,
  /timeout/i,
  /mock api/i,
  /network logs/i,
  /screenshot/i,
  /voice to text/i,
  /text to speech/i,
  /ota update/i,
  /force update/i,
  /permission.*deny/i,
  /gallery permission/i,
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function sheetToDir(sheetGroup) {
  const label = sheetGroup.replace(/^\d+\s-\s/, "").trim();
  return slugify(label) || "other";
}

function escapeYaml(text) {
  if (!text) return '""';
  if (/[:\n"#]/.test(text)) {
    return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }
  return `"${text}"`;
}

function isManualOnly(tc) {
  const blob = `${tc.title} ${tc.steps} ${tc.expectedResult} ${tc.notes}`;
  return MANUAL_ONLY_PATTERNS.some((p) => p.test(blob));
}

function buildMaestroSteps(tc) {
  const lines = [];
  const sheet = getSheetGroup(tc.screenName, tc.route, tc.module);
  const role = tc.role || "All";

  lines.push("# Preconditions");
  lines.push("- launchApp:");
  lines.push("    clearState: false");

  if (role !== "Guest") {
    const loginFlow = ROLE_LOGIN_FLOW[role] || ROLE_LOGIN_FLOW.All;
    if (loginFlow) {
      lines.push(`- runFlow: ${loginFlow}`);
    }
  } else {
    lines.push(`- runFlow: ${HELPERS_FROM_GENERATED}/ensure-logged-out.yaml`);
  }

  lines.push("");
  lines.push("# Test steps (from manual case — adjust selectors if UI changes)");
  const stepLines = tc.steps
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  for (const step of stepLines.slice(0, 12)) {
    const lower = step.toLowerCase();
    if (/^open |^navigate |^go to /.test(lower)) {
      lines.push(`# ${step}`);
      continue;
    }
    if (/tap |click /.test(lower)) {
      const target = step.replace(/^(tap|click)\s+(on\s+)?/i, "").replace(/\.$/, "");
      if (/send otp|login|verify|submit/i.test(target)) {
        lines.push("- tapOn:");
        lines.push('    id: "login-submit-button"');
      } else if (/home tab/i.test(target)) {
        lines.push("- tapOn:");
        lines.push('    id: "tab-home"');
      } else if (/work tab/i.test(target)) {
        lines.push("- tapOn:");
        lines.push('    id: "tab-work"');
      } else if (/people|contractors/i.test(target)) {
        lines.push("- tapOn:");
        lines.push('    id: "tab-people"');
      } else if (/activity tab/i.test(target)) {
        lines.push("- tapOn:");
        lines.push('    id: "tab-activity"');
      } else if (/profile tab/i.test(target)) {
        lines.push("- tapOn:");
        lines.push('    id: "tab-profile"');
      } else if (/view details/i.test(target)) {
        lines.push('- tapOn: "View Details"');
      } else if (/filter/i.test(target)) {
        lines.push('- tapOn: "Filter"');
      } else if (/logout|log out/i.test(target)) {
        lines.push('- tapOn: "Log Out"');
      } else {
        lines.push(`- tapOn: ${escapeYaml(target.slice(0, 80))}`);
      }
      continue;
    }
    if (/enter |type |input /.test(lower)) {
      if (/otp|000000|six digit/i.test(lower)) {
        lines.push("- tapOn:");
        lines.push('    id: "login-otp-input"');
        lines.push('- inputText: ${STAGING_OTP}');
      } else if (/mobile|10.digit|phone/i.test(lower)) {
        lines.push("- tapOn:");
        lines.push('    id: "login-mobile-input"');
        lines.push("- inputText: ${WORKER_MOBILE}");
      } else {
        lines.push(`# ${step}`);
      }
      continue;
    }
    if (/scroll|pull to refresh|swipe/.test(lower)) {
      if (/pull to refresh/i.test(lower)) {
        lines.push("- scroll");
      } else {
        lines.push(`# ${step}`);
      }
      continue;
    }
    if (/press.*back|hardware back/.test(lower)) {
      lines.push("- pressKey: back");
      continue;
    }
    if (/wait|observe|confirm|verify|check|read/.test(lower)) {
      lines.push(`# ${step}`);
      continue;
    }
    lines.push(`# ${step}`);
  }

  lines.push("");
  lines.push("# Assertions");
  const expectations = tc.expectedResult
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  for (const exp of expectations.slice(0, 8)) {
    const lower = exp.toLowerCase();
    if (/crash|white screen/.test(lower)) {
      lines.push("- assertNotVisible: \"Something went wrong\"");
      continue;
    }
    if (/bottom tab|five tabs|5 tabs/.test(lower)) {
      lines.push("- assertVisible:");
      lines.push('    id: "tab-home"');
      lines.push("- assertVisible:");
      lines.push('    id: "tab-profile"');
      continue;
    }
    if (/login screen|remains on login/.test(lower)) {
      lines.push("- assertVisible:");
      lines.push('    id: "login-mobile-input"');
      continue;
    }
    if (/error|invalid|validation/.test(lower)) {
      lines.push(`# Expected: ${exp}`);
      continue;
    }
    if (/success|toast|navigat/.test(lower)) {
      lines.push(`# Expected: ${exp}`);
      continue;
    }
    const quoted = exp.replace(/\.$/, "").slice(0, 60);
    if (quoted.length > 8 && /visible|shown|display|appear|load/.test(lower)) {
      lines.push(`# Expected: ${exp}`);
    } else {
      lines.push(`# Expected: ${exp}`);
    }
  }

  lines.push("");
  lines.push("# Cleanup");
  if (role !== "Guest") {
    lines.push("# Optional: - runFlow: ../../helpers/logout.yaml");
  }

  return lines.join("\n");
}

function buildFlowFile(tc, manualOnly) {
  const sheet = getSheetGroup(tc.screenName, tc.route, tc.module);
  const dir = sheetToDir(sheet);
  const filename = `${tc.testId}-${slugify(tc.title)}.yaml`;
  const tags = [
    slugify(tc.module),
    slugify(tc.testType),
    slugify(tc.role),
    manualOnly ? "manual-review" : "automated",
  ].filter(Boolean);

  const header = [
    `appId: ${APP_ID}`,
    "env:",
    "  STAGING_OTP: ${STAGING_OTP}",
    "  WORKER_MOBILE: ${WORKER_MOBILE}",
    "  EMPLOYER_MOBILE: ${EMPLOYER_MOBILE}",
    "  MEDIATOR_MOBILE: ${MEDIATOR_MOBILE}",
    "  ADMIN_MOBILE: ${ADMIN_MOBILE}",
    `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
    "---",
    `# ${tc.testId}: ${tc.title}`,
    `# Module: ${tc.module} | Screen: ${tc.screenName} | Role: ${tc.role}`,
    `# Type: ${tc.testType} | Priority: ${tc.priority}`,
    `# Route: ${tc.route || "n/a"}`,
    `# Prerequisites: ${tc.prerequisites.replace(/\n/g, " ")}`,
    manualOnly ? "# STATUS: MANUAL REVIEW — contains steps not fully automatable" : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    dir,
    filename,
    content: `${header}\n${buildMaestroSteps(tc)}\n`,
    manualOnly,
    sheet,
  };
}

async function main() {
  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  await mkdir(OUTPUT_ROOT, { recursive: true });

  const enriched = allTestCases.map((tc) => enrichTestCase(tc));
  const manifest = [];
  let automated = 0;
  let manualReview = 0;

  for (const tc of enriched) {
    const manualOnly = isManualOnly(tc);
    if (manualOnly) manualReview++;
    else automated++;

    const { dir, filename, content, sheet } = buildFlowFile(tc, manualOnly);
    const outDir = path.join(OUTPUT_ROOT, dir);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, filename), content, "utf8");

    manifest.push({
      testId: tc.testId,
      title: tc.title,
      sheet,
      dir,
      file: `flows/generated/${dir}/${filename}`,
      role: tc.role,
      testType: tc.testType,
      priority: tc.priority,
      automation: manualOnly ? "manual-review" : "automated",
    });
  }

  const manifestPath = path.join(ROOT, "apps/mobile/maestro/reports/flow-manifest.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Generated ${enriched.length} Maestro flows in ${OUTPUT_ROOT}`);
  console.log(`  Automated: ${automated}`);
  console.log(`  Manual review tag: ${manualReview}`);
  console.log(`  Manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

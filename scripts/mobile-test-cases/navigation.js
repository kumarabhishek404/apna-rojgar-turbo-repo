/**
 * Human-readable navigation steps to reach each screen (no code paths).
 */
import { getScreenInfo } from "./screen-registry.js";

const MODULE_NAVIGATION = {
  "Global & App Shell":
    "Open the Apna Rojgar app from the Android home screen.",
  "Language & Onboarding":
    "Open the app → language/onboarding screens appear on first launch, or go via Profile → Settings → Change Language.",
  Authentication:
    "Open the app while logged out to reach Login, or use links on the Login screen for registration.",
  "Tab: Home": "Log in → tap the Home tab (1st icon on the bottom bar).",
  "Tab: Work": "Log in → tap the Work tab (2nd icon on the bottom bar).",
  "Tab: People": "Log in → tap the People tab (3rd icon on the bottom bar).",
  "Tab: Activity": "Log in → tap the Activity tab (4th icon on the bottom bar).",
  "Tab: Profile": "Log in → tap the My Profile tab (5th icon on the bottom bar).",
  "Service Listing & Detail":
    "Log in → tap any job card from Home, Work, or People tab to open job detail.",
  "Post a Job Wizard":
    "Log in as Employer → Work tab → tap the + (FAB) button to post a new job.",
  "User Browse & Profile Actions":
    "Log in → tap a worker or contractor card from the Work or People tab.",
  "Bookings & Invitations":
    "Log in → Activity tab → open the Bookings or Work Requests sub-tab.",
  Attendance:
    "Log in as Employer → Activity → Bookings → open a booking → tap Add or View Attendance.",
  "Team / Mediator":
    "Log in → Activity tab or Profile menu → Team Requests.",
  "Reviews & Ratings": "Log in → Profile tab → Settings → Reviews, or open a user profile → Reviews.",
  "Notifications & Push": "Log in → Profile tab → Settings → Notifications.",
  "Deep Links & Sharing":
    "Open a shared job link from WhatsApp/SMS, or use Share buttons inside the app.",
  "Experience History": "Log in → Profile tab → Settings → Experience.",
  "Settings, Support & Legal": "Log in → Profile tab → Settings → pick the menu item for this test.",
  "Admin Panel": "Log in as Admin → use the bottom tabs (Users, Services, Requests, Profile).",
  "Accessibility & Inputs":
    "Follow the screen named in the test case — usually Login, Register, Profile, or Post Job flows.",
  "Cross-cutting UI Design":
    "Log in and navigate to the screen mentioned in the test case title.",
};

/** Split a how-to-reach string into ordered navigation steps. */
export function parseNavigationText(text) {
  if (!text?.trim()) return [];

  const cleaned = text
    .replace(/\s*\/[\w/[\]?=&]+\s*/g, " ") // strip code paths like /screens/foo
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.includes("→")) {
    return cleaned
      .split(/\s*→\s*/)
      .map((s) => s.replace(/\.$/, "").trim())
      .filter(Boolean);
  }

  return cleaned
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean);
}

/** Build numbered steps to reach the screen before running the test. */
export function getNavigationSteps(tc) {
  const screenInfo = getScreenInfo(tc.screenName, tc.module);
  let steps = parseNavigationText(screenInfo.howToReach);

  if (steps.length === 0 && MODULE_NAVIGATION[tc.module]) {
    steps = parseNavigationText(MODULE_NAVIGATION[tc.module]);
  }

  const role = tc.role || "All";
  const first = (steps[0] || "").toLowerCase();

  if (role === "Guest") {
    if (
      !first.includes("log out") &&
      !first.includes("logged out") &&
      !first.includes("fresh install") &&
      !first.includes("logged-out")
    ) {
      steps.unshift("Make sure you are logged out (Profile → Logout) or use a fresh app install");
    }
  } else if (role === "Admin") {
    if (!first.includes("log in") && !first.includes("login")) {
      steps.unshift("Log in with the Admin test account (see Test Accounts sheet)");
    }
  } else if (role === "Worker" || role === "Employer" || role === "Mediator") {
    if (!first.includes("log in") && !first.includes("login")) {
      steps.unshift(`Log in with the ${role} test account (see Test Accounts sheet)`);
    }
  } else if (role === "All") {
    if (!first.includes("log in") && !first.includes("login") && !first.includes("open the app")) {
      steps.unshift("Log in with a valid test account (see Test Accounts sheet)");
    }
  }

  return steps;
}

export function formatNumberedSteps(steps) {
  return steps.map((line, i) => `${i + 1}. ${line}`).join("\n");
}

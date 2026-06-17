/**
 * Human-readable screen metadata for testers (no code routes in UI text).
 */
export const SCREEN_REGISTRY = {
  "App Launch": {
    purpose: "First screen when the app opens. Verifies install, splash, and root navigation load correctly.",
    howToReach: "Install the app → tap the Apna Rojgar icon on the Android home screen.",
  },
  Login: {
    purpose: "Entry point for returning users. Login uses mobile number + SMS OTP (no password).",
    howToReach: "Log out from Profile → My Profile tab → Settings → Logout. Or use a fresh install — Login opens automatically.",
  },
  "Register Step 1": {
    purpose: "New user signup — enter mobile number and verify OTP to create or resume an account.",
    howToReach: "Login screen → tap New Registration link.",
  },
  "Register Step 2": {
    purpose: "Collect personal details: name, address, age, gender, Aadhaar, and GPS location.",
    howToReach: "Complete Register Step 1 (OTP verified) → app moves to personal details form automatically.",
  },
  "Register Step 4": {
    purpose: "Choose your role (Worker / Employer / Mediator) and select skills or team size.",
    howToReach: "Complete Register Step 2 → tap Next → role selection screen opens.",
  },
  "Register Step 5": {
    purpose: "Upload a profile selfie/photo to finish registration.",
    howToReach: "Complete Register Step 4 → tap Next → photo upload screen opens.",
  },
  "Language Selection": {
    purpose: "Choose the app display language before or during first use.",
    howToReach: "First app launch shows language picker automatically, or Login screen → Change Language link.",
  },
  "Change Language": {
    purpose: "Switch app language anytime; syncs to server when logged in.",
    howToReach: "Profile tab → Settings sub-tab → tap Change Language. Also available from Login screen footer.",
  },
  "User Tips / Onboarding": {
    purpose: "First-run carousel explaining how to use the app.",
    howToReach: "Shown after language selection on first launch, or navigate from onboarding flow.",
  },
  "Home Tab": {
    purpose: "Main dashboard — categories, featured jobs/workers, quick links, and company stats.",
    howToReach: "Log in → tap Home tab (1st icon on bottom bar).",
  },
  "Work Tab": {
    purpose: "Browse active jobs (Worker) or labour/workers (Employer/Mediator). Includes search, sort, and filters.",
    howToReach: "Log in → tap Work tab (2nd icon on bottom bar).",
  },
  "People Tab": {
    purpose: "Browse contractors/teams (Worker/Employer) or active jobs (Mediator).",
    howToReach: "Log in → tap People tab (3rd icon on bottom bar).",
  },
  "Activity Tab": {
    purpose: "Your work hub — applications, bookings, invitations, and posted jobs (varies by role).",
    howToReach: "Log in → tap Activity tab (4th icon on bottom bar).",
  },
  "Profile Tab": {
    purpose: "View/edit profile, skills, settings menu, logout, and role switcher.",
    howToReach: "Log in → tap My Profile tab (5th icon on bottom bar).",
  },
  "Service Detail": {
    purpose: "Full job posting — photos, pay, requirements, apply/book actions, share, map.",
    howToReach: "Log in → tap any job card from Home, Work, People, or Activity tab.",
  },
  "Service List": {
    purpose: "Paginated list of job postings, optionally filtered by category or saved jobs.",
    howToReach: "Home tab → tap a work category, or Profile → Favourites.",
  },
  "Add Service Wizard": {
    purpose: "Employer multi-step form to post a new job (8 steps: category → publish).",
    howToReach: "Log in as Employer → Work tab → tap + (FAB) button at bottom-right, or Home → Post Job quick link.",
  },
  "User Profile": {
    purpose: "View another user's public profile — skills, reviews, book/like/call actions.",
    howToReach: "Log in → Work or People tab → tap a worker/contractor card.",
  },
  "Bookings List": {
    purpose: "Employer's list of confirmed worker bookings.",
    howToReach: "Log in as Employer → Activity tab → Bookings sub-tab.",
  },
  "Booking Detail": {
    purpose: "Details of one booking — selected workers, dates, complete/cancel/attendance actions.",
    howToReach: "Activity tab → Bookings sub-tab → tap a booking row.",
  },
  "Add Attendance": {
    purpose: "Employer marks daily present/absent for booked workers.",
    howToReach: "Activity → Bookings → open a booking → tap Add Attendance.",
  },
  "Show Attendance": {
    purpose: "View attendance report for a booking across dates.",
    howToReach: "Activity → Bookings → open a booking → tap View Attendance.",
  },
  "Team Requests": {
    purpose: "Manage team join requests — received (as worker) and sent (as mediator).",
    howToReach: "Activity tab → team/work requests section, or Profile → Team Requests if linked.",
  },
  "Notifications Inbox": {
    purpose: "In-app list of all push/in-app notifications.",
    howToReach: "Profile tab → Settings → Notifications.",
  },
  "Help / FAQ": {
    purpose: "Searchable FAQ, video help, and support chat entry point.",
    howToReach: "Profile tab → Settings → Help or Support.",
  },
  "App Feedback": {
    purpose: "Submit feedback about the app with star rating.",
    howToReach: "Profile tab → Settings → App Feedback.",
  },
  "Delete Account": {
    purpose: "Permanently delete user account.",
    howToReach: "Profile tab → Settings → Delete Account.",
  },
  Favourites: {
    purpose: "List of jobs you have liked/saved.",
    howToReach: "Profile tab → Settings → Favourites.",
  },
  Experience: {
    purpose: "Combined work and service history timeline.",
    howToReach: "Profile tab → Settings → Experience.",
  },
  "Reviews List": {
    purpose: "Reviews received by the logged-in user.",
    howToReach: "Profile tab → Settings → Reviews.",
  },
  "Add Review": {
    purpose: "Submit a star rating and feedback for another user.",
    howToReach: "Open another user's profile → tap Add Review or Reviews section.",
  },
  "Share App": {
    purpose: "Share app invite via WhatsApp, SMS, or copy link.",
    howToReach: "Profile tab → Settings → Share App.",
  },
  "Admin Users Tab": {
    purpose: "Admin-only: list, search, suspend, and activate all platform users.",
    howToReach: "Log in as Admin → Users tab (1st bottom tab).",
  },
  "Admin Services Tab": {
    purpose: "Admin view of all posted jobs on the platform.",
    howToReach: "Log in as Admin → Services tab (2nd bottom tab).",
  },
  "Admin Requests Tab": {
    purpose: "Admin queue for user activation and suspension requests.",
    howToReach: "Log in as Admin → Requests tab (4th bottom tab).",
  },
};

/** Fallback when screen not in registry. */
export function getScreenInfo(screenName, module) {
  if (SCREEN_REGISTRY[screenName]) {
    return SCREEN_REGISTRY[screenName];
  }
  return {
    purpose: `Tests for "${screenName}" in the ${module} area of the app.`,
    howToReach: `Log in with the correct test account, then navigate to "${screenName}" from the related tab or Profile menu. Ask your QA lead if unsure.`,
  };
}

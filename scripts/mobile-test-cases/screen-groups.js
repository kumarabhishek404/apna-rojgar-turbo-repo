/**
 * Maps granular test screen names → primary user-facing sheet for the workbook.
 * New testers work one tab per real app screen, not per internal component.
 */

/** Exact overrides: screenName → sheet title */
const EXACT_MAP = {
  "App Launch": "01 - App Launch",
  "Force Update": "01 - App Launch",
  "OTA Update": "01 - App Launch",
  "No Internet": "01 - App Launch",
  "Auth Guard": "01 - App Launch",
  "Pending Approval": "01 - App Launch",
  "Exit Modal": "01 - App Launch",
  "Tab Root": "01 - App Launch",
  "Error Boundary": "01 - App Launch",

  "Language Selection": "02 - Language Selection",
  "User Tips / Onboarding": "02 - Language Selection",
  "Bottom Nav Tutorial": "02 - Language Selection",
  "First Launch": "02 - Language Selection",
  "Change Language": "02 - Language Selection",

  Login: "03 - Login",
  "Register Step 1": "04 - Register Step 1",
  "Register Step 2": "05 - Register Step 2",
  "Register Step 3 (Legacy PIN)": "05 - Register Step 2",
  "Register Step 4": "06 - Register Step 4",
  "Register Step 5": "07 - Register Step 5",
  "Legacy Register": "04 - Register Step 1",
  Logout: "03 - Login",
  "Session Expiry": "03 - Login",

  "Home Tab": "10 - Home Tab",
  "Home Hero": "10 - Home Tab",
  "Work Categories": "10 - Home Tab",
  "Featured Services": "10 - Home Tab",
  "Featured Workers": "10 - Home Tab",
  "Company Stats": "10 - Home Tab",
  "Profile Completion": "10 - Home Tab",
  "Quick Links": "10 - Home Tab",
  "UnifiedHomeDashboard": "10 - Home Tab",

  "Work Tab": "11 - Work Tab",
  "Service List": "11 - Work Tab",
  "Worker List": "11 - Work Tab",
  "Sort Tabs": "11 - Work Tab",
  "Search Services": "11 - Work Tab",
  "Search Workers": "11 - Work Tab",
  "Filter Services": "11 - Work Tab",
  "Filter Workers": "11 - Work Tab",
  "FAB Add Job": "11 - Work Tab",
  "Search Hub": "11 - Work Tab",

  "People Tab": "12 - People Tab",
  "Contractor List": "12 - People Tab",
  "Active Works List": "12 - People Tab",

  "Activity Tab": "13 - Activity Tab",
  "Activity Deep Link": "13 - Activity Tab",
  "Activity sub-tabs": "13 - Activity Tab",
  "Applied Jobs": "13 - Activity Tab",
  "Worker Bookings": "13 - Activity Tab",
  "Worker Work Requests": "13 - Activity Tab",
  "Employer Bookings": "13 - Activity Tab",
  "Employer Work Requests": "13 - Activity Tab",
  "Employer My Services": "13 - Activity Tab",
  "Mediator Bookings": "13 - Activity Tab",
  "Mediator Work Requests": "13 - Activity Tab",
  "Legacy Bookings Requests": "13 - Activity Tab",
  "Custom Tabs": "13 - Activity Tab",

  "Profile Tab": "14 - Profile Tab",
  "Profile Overview": "14 - Profile Tab",
  "Profile Settings": "14 - Profile Tab",
  "Profile Menu": "14 - Profile Tab",
  "Edit Profile": "14 - Profile Tab",
  "Profile Photo": "14 - Profile Tab",
  "Skills": "14 - Profile Tab",
  "Role Switcher": "14 - Profile Tab",
  "Team Admin Card": "14 - Profile Tab",
  "Social Links": "14 - Profile Tab",
  "Full Profile Screen": "14 - Profile Tab",
  "Service Information": "14 - Profile Tab",
  "Work Information": "14 - Profile Tab",
  "Likes Stats": "14 - Profile Tab",
  "Admin Profile": "14 - Profile Tab",

  "Service Detail": "20 - Service Detail",
  "Applicants Tab": "20 - Service Detail",
  "Selections Tab": "20 - Service Detail",
  "Applicants Summary": "20 - Service Detail",
  "Action Buttons": "20 - Service Detail",
  "Apply Mediator Drawer": "20 - Service Detail",
  "Apply as Mediator": "20 - Service Detail",

  "Add Service Wizard": "21 - Post Job Wizard",
  "Select Work Category": "21 - Post Job Wizard",
  "Select Sub-Category": "21 - Post Job Wizard",
  "Worker Salary & Requirements": "21 - Post Job Wizard",
  "Select Facilities": "21 - Post Job Wizard",
  "Location & Date": "21 - Post Job Wizard",
  "Duration & Description": "21 - Post Job Wizard",
  "Upload Images": "21 - Post Job Wizard",
  "Review & Publish": "21 - Post Job Wizard",

  "Users List": "22 - User Profile",
  "User Profile": "22 - User Profile",
  "User Profile Buttons": "22 - User Profile",
  "Add Booking Details": "22 - User Profile",
  "User Info Box": "22 - User Profile",
  Favourites: "22 - User Profile",

  "Bookings List": "23 - Bookings",
  "Bookings list": "23 - Bookings",
  "Booking Detail": "23 - Bookings",
  "Booking Actions": "23 - Bookings",
  "Selected Users": "23 - Bookings",
  "Booked Workers": "23 - Bookings",
  "Booking Confirmation Modal": "23 - Bookings",
  "Worker Invitations": "23 - Bookings",
  "Employer Invitations": "23 - Bookings",
  Requests: "23 - Bookings",

  "Add Attendance": "24 - Attendance",
  "Attendance Component": "24 - Attendance",
  "Show Attendance": "24 - Attendance",
  "Side Drawer": "24 - Attendance",

  "Team Requests": "25 - Team & Mediator",
  "Team Detail": "25 - Team & Mediator",
  "Send Team Request": "25 - Team & Mediator",
  "Team Requests Received": "25 - Team & Mediator",
  "Team Requests Sent": "25 - Team & Mediator",
  "Mediator Activity": "25 - Team & Mediator",

  "Reviews List": "26 - Reviews",
  "Add Review": "26 - Reviews",
  "Review Reasons": "26 - Reviews",
  "Rating Display": "26 - Reviews",
  "User Reviews": "26 - Reviews",

  "Notifications Inbox": "27 - Notifications",
  "Push Registration": "27 - Notifications",
  "Push Permission": "27 - Notifications",
  "Foreground Banner": "27 - Notifications",
  "Notification Tap": "27 - Notifications",
  "Job Notification": "27 - Notifications",
  "Notification Toast": "27 - Notifications",
  "Unread Badge": "27 - Notifications",
  "Android Channel": "27 - Notifications",
  "Local Notifications": "27 - Notifications",
  "Notification Cleanup": "27 - Notifications",
  "Admin Local Notification": "27 - Notifications",

  "Job Deep Link Bridge": "28 - Deep Links & Share",
  "Universal Link": "28 - Deep Links & Share",
  "Service Deep Link": "28 - Deep Links & Share",
  "Share Service": "28 - Deep Links & Share",
  "Share App": "28 - Deep Links & Share",
  "Share App WhatsApp": "28 - Deep Links & Share",
  "Share App SMS": "28 - Deep Links & Share",
  "Share App LinkedIn": "28 - Deep Links & Share",
  "Share App Copy Link": "28 - Deep Links & Share",
  "Job ID Display": "28 - Deep Links & Share",
  "Deep Link Logged Out": "28 - Deep Links & Share",
  "Invalid Deep Link": "28 - Deep Links & Share",

  Experience: "29 - Experience",

  "Help / FAQ": "31 - Help & Support",
  "Help Search": "31 - Help & Support",
  "Help Video": "31 - Help & Support",
  "Live Chat Modal": "31 - Help & Support",
  Support: "31 - Help & Support",
  "App Feedback": "31 - Help & Support",
  "Privacy Policy": "31 - Help & Support",
  "Terms & Conditions": "31 - Help & Support",
  "Delete Account": "31 - Help & Support",
  "Contact Support": "31 - Help & Support",
  "WhatsApp Group": "31 - Help & Support",
  Instagram: "31 - Help & Support",
  "User Problem API": "31 - Help & Support",

  "Admin Users Tab": "40 - Admin Panel",
  "Admin Users": "40 - Admin Panel",
  "Admin users list": "40 - Admin Panel",
  "Admin Services Tab": "40 - Admin Panel",
  "Admin Services": "40 - Admin Panel",
  "Admin Requests Tab": "40 - Admin Panel",
  "Admin Requests": "40 - Admin Panel",
  "Admin Settings": "40 - Admin Panel",
  "All Feedback": "40 - Admin Panel",
  "Rating Breakdown": "40 - Admin Panel",
  "Feedback Reasons": "40 - Admin Panel",
  "Admin Tab Labels": "40 - Admin Panel",
  "Admin API": "40 - Admin Panel",

  "Text to Speech": "50 - Accessibility & Inputs",
  "Voice to Text": "50 - Accessibility & Inputs",
  "Selfie Capture": "50 - Accessibility & Inputs",
  "Mobile Number Input": "50 - Accessibility & Inputs",
  "Current Location": "50 - Accessibility & Inputs",
  "View Map": "50 - Accessibility & Inputs",
  "Add Address": "50 - Accessibility & Inputs",
  "Add Address With Location": "50 - Accessibility & Inputs",
  "Biometric Auth": "50 - Accessibility & Inputs",
  "Date Picker": "50 - Accessibility & Inputs",
  "Image Upload": "50 - Accessibility & Inputs",
  "Skill Selector": "50 - Accessibility & Inputs",
  "Work Requirements Input": "50 - Accessibility & Inputs",
  "Select Role Input": "50 - Accessibility & Inputs",
  "Picker Input": "50 - Accessibility & Inputs",
};

/** Prefix patterns for Activity sub-tabs */
const PREFIX_RULES = [
  [/^Activity - /, "13 - Activity Tab"],
  [/^Global /, "01 - App Launch"],
  [/^Stack /, "01 - App Launch"],
  [/^Bottom Tabs/, "01 - App Launch"],
  [/^Toast/, "01 - App Launch"],
  [/^Pull to Refresh/, "01 - App Launch"],
  [/^Pagination/, "01 - App Launch"],
  [/^Loading/, "90 - UI & Cross-cutting"],
  [/^Empty /, "90 - UI & Cross-cutting"],
  [/^Modal /, "90 - UI & Cross-cutting"],
  [/^Theme /, "90 - UI & Cross-cutting"],
  [/^Typography/, "90 - UI & Cross-cutting"],
  [/^Touch Targets/, "90 - UI & Cross-cutting"],
  [/^Keyboard /, "90 - UI & Cross-cutting"],
  [/^Hindi /, "90 - UI & Cross-cutting"],
  [/^English /, "90 - UI & Cross-cutting"],
  [/^Safe Area/, "90 - UI & Cross-cutting"],
  [/^Landscape/, "90 - UI & Cross-cutting"],
  [/^List Item/, "90 - UI & Cross-cutting"],
  [/^Scroll /, "90 - UI & Cross-cutting"],
  [/^Duplicate/, "90 - UI & Cross-cutting"],
  [/^Icon /, "90 - UI & Cross-cutting"],
  [/^Form Labels/, "90 - UI & Cross-cutting"],
  [/^Card /, "90 - UI & Cross-cutting"],
  [/^Status Bar/, "90 - UI & Cross-cutting"],
  [/^FAB /, "90 - UI & Cross-cutting"],
  [/^Link /, "90 - UI & Cross-cutting"],
  [/^Image Upload/, "90 - UI & Cross-cutting"],
  [/^Error States/, "90 - UI & Cross-cutting"],
  [/^Drawer /, "90 - UI & Cross-cutting"],
  [/^Tab Active/, "90 - UI & Cross-cutting"],
  [/^Chat /, "90 - UI & Cross-cutting"],
  [/^Testimonials/, "90 - UI & Cross-cutting"],
  [/^App Version/, "90 - UI & Cross-cutting"],
  [/^Stack Headers/, "90 - UI & Cross-cutting"],
  [/^Tab Bar/, "90 - UI & Cross-cutting"],
  [/^Modals$/, "90 - UI & Cross-cutting"],
  [/^Locale /, "01 - App Launch"],
  [/^Role Remount/, "01 - App Launch"],
  [/^Deep Link Stack/, "01 - App Launch"],
  [/^Suspended Account/, "03 - Login"],
  [/^Disabled Account/, "03 - Login"],
  [/^Analytics /, "01 - App Launch"],
  [/^Client Device/, "01 - App Launch"],
  [/^Profile Photo Upload/, "01 - App Launch"],
  [/^Notification Badge/, "27 - Notifications"],
  [/^Global Bottom Drawer/, "01 - App Launch"],
  [/^Global Side Drawer/, "01 - App Launch"],
];

/**
 * Returns the canonical sheet name for grouping test cases.
 */
export function getSheetGroup(screenName, route, module) {
  const normalized = screenName?.trim() || "Other";

  if (EXACT_MAP[normalized]) return EXACT_MAP[normalized];

  for (const [pattern, sheet] of PREFIX_RULES) {
    if (pattern.test(normalized)) return sheet;
  }

  // Module-based fallback
  const moduleMap = {
    "Global & App Shell": "01 - App Launch",
    "Language & Onboarding": "02 - Language Selection",
    Authentication: "03 - Login",
    "Tab: Home": "10 - Home Tab",
    "Tab: Work": "11 - Work Tab",
    "Tab: People": "12 - People Tab",
    "Tab: Activity": "13 - Activity Tab",
    "Tab: Profile": "14 - Profile Tab",
    "Service Listing & Detail": "20 - Service Detail",
    "Post a Job Wizard": "21 - Post Job Wizard",
    "User Browse & Profile Actions": "22 - User Profile",
    "Bookings & Invitations": "23 - Bookings",
    Attendance: "24 - Attendance",
    "Team / Mediator": "25 - Team & Mediator",
    "Reviews & Ratings": "26 - Reviews",
    "Notifications & Push": "27 - Notifications",
    "Deep Links & Sharing": "28 - Deep Links & Share",
    "Experience History": "29 - Experience",
    "Settings, Support & Legal": "31 - Help & Support",
    "Admin Panel": "40 - Admin Panel",
    "Accessibility & Inputs": "50 - Accessibility & Inputs",
    "Cross-cutting UI Design": "90 - UI & Cross-cutting",
  };

  return moduleMap[module] || "99 - Other";
}

/** Sheet descriptions for banner on grouped sheets */
export const SHEET_DESCRIPTIONS = {
  "01 - App Launch": {
    purpose: "App startup, force update, offline mode, global navigation, auth guards, and app-wide behaviour.",
    howToReach: "Install and open the app. Many cases start from cold launch or logged-in tab roots.",
  },
  "03 - Login": {
    purpose: "Returning user login via mobile + OTP. Gateway to the main app.",
    howToReach: "Log out from Profile, or use a fresh install.",
  },
  "10 - Home Tab": {
    purpose: "Main dashboard — categories, featured listings, quick links, stats.",
    howToReach: "Log in → tap Home tab (1st bottom icon).",
  },
  "20 - Service Detail": {
    purpose: "Full job posting page — view, apply, manage applicants, share.",
    howToReach: "Tap any job card from Home, Work, or People tabs.",
  },
  "21 - Post Job Wizard": {
    purpose: "Employer 8-step wizard to publish a new job.",
    howToReach: "Log in as Employer → Work tab → tap + (FAB) button.",
  },
  "90 - UI & Cross-cutting": {
    purpose: "Visual consistency, empty states, loading, Hindi/English, keyboard, and layout checks across the app.",
    howToReach: "Screen varies — follow Steps in each row.",
  },
};

export function getSheetInfo(sheetName) {
  if (SHEET_DESCRIPTIONS[sheetName]) return SHEET_DESCRIPTIONS[sheetName];
  const label = sheetName.replace(/^\d+\s-\s/, "");
  return {
    purpose: `Test cases for ${label}.`,
    howToReach: `Open ${label} in the app, then run each row's Steps.`,
  };
}

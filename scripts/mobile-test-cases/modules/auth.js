import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Authentication", "AUTH");

export default [
  // ── Login screen ──────────────────────────────────────────────────────────
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P0",
    prerequisites:
      "App is installed fresh OR user has logged out (Profile → Logout). No active session.",
    title: "Login screen displays all required UI elements",
    steps:
      "Open the app while logged out — you should land on the Login screen automatically.\n" +
      "Look at the full screen from top to bottom.\n" +
      "Confirm you see: Apna Rojgar branding/logo, mobile number input field, country code (+91), a 'Send OTP' button, a link for New Registration, and optionally a Change Language link.\n" +
      "Do not enter any data yet — this test is only about visibility.",
    expectedResult:
      "Mobile number field is visible and tappable.\n" +
      "Country code +91 is shown next to the mobile field.\n" +
      "Send OTP button is visible and enabled.\n" +
      "New Registration link is visible.\n" +
      "No blank white screen, crash, or missing translation keys (e.g. 'auth.login.title').",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites:
      "Use a mobile number that is already registered on the staging server (ask QA lead for Worker test number). Logged out.",
    title: "Send OTP succeeds for a valid registered mobile number",
    steps:
      "On the Login screen, tap the mobile number field and type a valid 10-digit registered number (e.g. 9876543210 — use your team's test number).\n" +
      "Tap the 'Send OTP' button.\n" +
      "Wait up to 30 seconds and watch for: a loading indicator, a success toast/message, and the OTP input field appearing.\n" +
      "Check your SMS inbox (or ask QA lead for staging OTP) — an OTP message should arrive.",
    expectedResult:
      "Send OTP button shows loading state while request is in progress.\n" +
      "A success message or toast appears (e.g. 'OTP sent successfully').\n" +
      "OTP input field(s) appear on the same screen — user stays on Login.\n" +
      "No error toast saying 'user not found' for a valid registered number.\n" +
      "SMS OTP is received on the test device (or use dev OTP 000000 on staging).",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites:
      "OTP has been sent to a registered user with a COMPLETE profile (name, address, age, gender all filled). OTP field is visible on Login screen.",
    title: "Correct OTP logs in a user with complete profile and opens Home",
    steps:
      "After OTP is sent, enter the 6-digit OTP received via SMS (on staging/dev you may use 000000).\n" +
      "Tap Verify / Login / Submit button.\n" +
      "Wait for navigation — the app should transition away from Login.\n" +
      "Confirm you see the bottom tab bar with 5 tabs (Home, Work, People, Activity, Profile).",
    expectedResult:
      "OTP is accepted without error.\n" +
      "App navigates to the main app (/(tabs)) — NOT stuck on Login.\n" +
      "Bottom navigation bar with 5 tabs is visible.\n" +
      "Home tab is selected by default.\n" +
      "User remains logged in if app is killed and reopened (session persisted).",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites:
      "Staging/dev environment only (EXPO_PUBLIC_BASE_URL points to staging). OTP already sent.",
    title: "Dev bypass OTP 000000 works on staging",
    steps:
      "Send OTP to any valid registered test number.\n" +
      "When OTP field appears, type 000000 (six zeros).\n" +
      "Tap Verify / Login.\n" +
      "Observe whether login succeeds.",
    expectedResult:
      "Login succeeds on staging/dev without needing real SMS.\n" +
      "User navigates to main tabs.\n" +
      "This OTP must NOT work on production — if it does, report as a security bug.",
    notes: "Dev bypass is in utils/devOtp.ts — staging only.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "OTP has been sent. OTP input field is visible.",
    title: "Wrong OTP shows clear error and keeps user on Login",
    steps:
      "Send OTP to a valid number.\n" +
      "Enter an intentionally wrong OTP (e.g. 123456 or 999999).\n" +
      "Tap Verify / Login.\n" +
      "Read any error message shown.",
    expectedResult:
      "An error message appears (e.g. 'Invalid OTP' or similar in Hindi/English).\n" +
      "User remains on the Login screen — NOT navigated to Home.\n" +
      "OTP field is cleared or editable so user can retry.\n" +
      "App does not crash.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "OTP has been sent. Wait for the Resend OTP countdown timer to finish (usually 30–60 seconds).",
    title: "Resend OTP delivers a new code after timer expires",
    steps:
      "Send OTP and wait until the 'Resend OTP' button becomes tappable (countdown ends).\n" +
      "Tap 'Resend OTP'.\n" +
      "Wait for confirmation message.\n" +
      "Enter the NEW OTP (not the old one) and submit.",
    expectedResult:
      "Resend button is disabled during countdown, then becomes active.\n" +
      "Tapping Resend shows success feedback.\n" +
      "New OTP is accepted; old OTP is rejected.\n" +
      "Login completes successfully with the new OTP.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "On Login screen. No OTP sent yet.",
    title: "Invalid mobile number is rejected before OTP is sent",
    steps:
      "Test A: Enter only 5 digits (e.g. 98765) and tap Send OTP.\n" +
      "Test B: Enter letters or special characters and tap Send OTP.\n" +
      "Test C: Leave the field empty and tap Send OTP.",
    expectedResult:
      "For all three tests: OTP is NOT sent.\n" +
      "A validation error message appears near the mobile field.\n" +
      "OTP input field does NOT appear.\n" +
      "User stays on Login screen.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites:
      "Use a test account that registered but did NOT complete profile (missing name, address, age, or gender). Ask QA lead for this account.",
    title: "Incomplete profile redirects to Register Step 2 after OTP verification",
    steps:
      "Log in with the incomplete-profile test number.\n" +
      "Send OTP and enter the correct code.\n" +
      "Tap Verify / Login.\n" +
      "Observe which screen opens next.",
    expectedResult:
      "After OTP verification, app navigates to Register Step 2 (/screens/auth/register/second).\n" +
      "Personal details form is shown (name, address, etc.).\n" +
      "User is NOT taken to Home tabs until profile is completed.\n" +
      "Partially saved data (if any) may be pre-filled.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "UI Design",
    priority: "P2",
    prerequisites: "On Login screen while logged out.",
    title: "Change Language link is visible and opens language picker",
    steps:
      "On the Login screen, scroll if needed to find the 'Change Language' link (often at bottom).\n" +
      "Tap the Change Language link.\n" +
      "Observe the screen that opens.\n" +
      "Select a different language (e.g. Hindi) and return to Login.",
    expectedResult:
      "Change Language link is visible without scrolling on most devices.\n" +
      "Tapping it opens /screens/settings/changeLanguage.\n" +
      "After selecting Hindi, Login screen text updates to Hindi.\n" +
      "Back navigation returns to Login.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "On Login screen while logged out.",
    title: "New Registration link opens signup Step 1",
    steps:
      "On Login screen, locate the 'New Registration' / 'Register' link.\n" +
      "Tap it.\n" +
      "Observe the screen that opens.",
    expectedResult:
      "App navigates to Register Step 1 (/screens/auth/register/first).\n" +
      "Mobile number + OTP registration form is shown.\n" +
      "Back button returns to Login without crash.",
  }),
  // Register first
  c({
    screenName: "Register Step 1",
    route: "/screens/auth/register/first",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P0",
    prerequisites: "New unregistered mobile",
    title: "Register step 1 shows mobile and OTP flow",
    steps: "1. Open register/first.\n2. Observe fields.",
    expectedResult: "Mobile input, OTP send/verify, progress indicator visible.",
  }),
  c({
    screenName: "Register Step 1",
    route: "/screens/auth/register/first",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "New mobile number",
    title: "New user OTP registration creates account",
    steps: "1. Enter new mobile.\n2. Verify OTP.\n3. Proceed.",
    expectedResult: "Account created; navigates to step 2.",
  }),
  c({
    screenName: "Register Step 1",
    route: "/screens/auth/register/first",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "Existing partial profile mobile",
    title: "Resume registration for existing partial user",
    steps: "1. Enter mobile with partial profile.\n2. Verify OTP.",
    expectedResult: "Resumes at correct step (second or fifth).",
  }),
  c({
    screenName: "Register Step 1",
    route: "/screens/auth/register/first",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "Already registered complete mobile",
    title: "Already registered mobile shows appropriate message",
    steps: "1. Enter fully registered mobile.\n2. Attempt register.",
    expectedResult: "Prompt to login instead or error message.",
  }),
  // Register second
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P0",
    prerequisites: "Completed step 1",
    title: "Register step 2 shows personal detail fields",
    steps: "1. Open register/second.\n2. Observe form.",
    expectedResult: "Name, address, email, age, gender, Aadhaar, location fields visible.",
  }),
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "On step 2",
    title: "Submit valid personal details proceeds to step 4",
    steps: "1. Fill all required fields.\n2. Pick GPS location.\n3. Tap Next.",
    expectedResult: "Navigates to register/fourth (step 3 PIN skipped).",
  }),
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "On step 2",
    title: "Required field validation on step 2",
    steps: "1. Leave name empty.\n2. Tap Next.",
    expectedResult: "Validation error for missing required fields.",
  }),
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "On step 2",
    title: "GPS location picker sets address coordinates",
    steps: "1. Tap location/GPS button.\n2. Allow location permission.\n3. Confirm location.",
    expectedResult: "Coordinates and address populated.",
  }),
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "UI Design",
    priority: "P2",
    prerequisites: "On step 2",
    title: "Gender selector displays all options",
    steps: "1. Open gender picker.\n2. Select each option.",
    expectedResult: "Male/Female/Other options selectable.",
  }),
  // Register fourth
  c({
    screenName: "Register Step 4",
    route: "/screens/auth/register/fourth",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P0",
    prerequisites: "Completed step 2",
    title: "Register step 4 shows role selection",
    steps: "1. Open register/fourth.\n2. Observe options.",
    expectedResult: "Worker, Employer, Mediator role cards visible.",
  }),
  c({
    screenName: "Register Step 4",
    route: "/screens/auth/register/fourth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "On step 4",
    title: "Select Worker role and skills proceeds",
    steps: "1. Select Worker.\n2. Pick skills.\n3. Tap Next.",
    expectedResult: "Navigates to register/fifth.",
  }),
  c({
    screenName: "Register Step 4",
    route: "/screens/auth/register/fourth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "On step 4",
    title: "Select Employer role proceeds",
    steps: "1. Select Employer.\n2. Complete role-specific fields.\n3. Next.",
    expectedResult: "Navigates to register/fifth.",
  }),
  c({
    screenName: "Register Step 4",
    route: "/screens/auth/register/fourth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "On step 4",
    title: "Select Mediator role with team size",
    steps: "1. Select Mediator.\n2. Enter team size if required.\n3. Next.",
    expectedResult: "Navigates to register/fifth.",
  }),
  c({
    screenName: "Register Step 4",
    route: "/screens/auth/register/fourth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "On step 4 without role",
    title: "Role selection required validation",
    steps: "1. Skip role selection.\n2. Tap Next.",
    expectedResult: "Validation prevents proceeding.",
  }),
  // Register fifth
  c({
    screenName: "Register Step 5",
    route: "/screens/auth/register/fifth",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P0",
    prerequisites: "Completed step 4",
    title: "Register step 5 shows selfie/profile photo upload",
    steps: "1. Open register/fifth.\n2. Observe camera/gallery options.",
    expectedResult: "Selfie capture or photo upload UI visible.",
  }),
  c({
    screenName: "Register Step 5",
    route: "/screens/auth/register/fifth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "On step 5",
    title: "Complete registration with photo navigates to tabs",
    steps: "1. Capture/upload selfie.\n2. Tap Finish/Submit.",
    expectedResult: "Registration complete; navigates to /(tabs).",
  }),
  c({
    screenName: "Register Step 5",
    route: "/screens/auth/register/fifth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "Camera permission",
    title: "Camera permission request for selfie",
    steps: "1. Tap capture selfie.\n2. Observe permission dialog.",
    expectedResult: "Android camera permission requested; capture works when granted.",
  }),
  // Legacy register
  c({
    screenName: "Legacy Register",
    route: "/screens/auth/register",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P2",
    prerequisites: "Navigate to legacy route",
    title: "Legacy register wizard still accessible",
    steps: "1. Navigate to /screens/auth/register.\n2. Observe wizard.",
    expectedResult: "Legacy multi-step wizard loads without crash.",
    notes: "Legacy flow; active flow uses first→second→fourth→fifth.",
  }),
  // Logout / session
  c({
    screenName: "Logout",
    route: "useLogout.ts",
    role: ROLES.all,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "Logged in",
    title: "Logout clears session and redirects to login",
    steps: "1. Profile → Logout.\n2. Confirm.\n3. Observe navigation.",
    expectedResult: "Token cleared; redirected to /screens/auth/login.",
  }),
  c({
    screenName: "Session Expiry",
    route: "AuthListner.tsx",
    role: ROLES.all,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "Logged in; invalidate token on server",
    title: "401 API response triggers auto logout",
    steps: "1. Invalidate session server-side.\n2. Trigger any API call.",
    expectedResult: "User logged out; redirected to login.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "Logged in previously",
    title: "Push token registered after successful login",
    steps: "1. Login successfully.\n2. Check notification registration.",
    expectedResult: "Device push token registered with backend.",
  }),
  c({
    screenName: "Register Step 3 (Legacy PIN)",
    route: "/screens/auth/register/third",
    role: ROLES.guest,
    testType: "Availability",
    priority: "P2",
    prerequisites: "Navigate to step 3 directly",
    title: "Legacy PIN step accessible but skipped in active flow",
    steps: "1. Open register/third.\n2. Observe PIN setup.",
    expectedResult: "4-digit PIN UI loads; active flow skips this step.",
    notes: "Step 3 skipped in active flow (second → fourth).",
  }),
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P2",
    prerequisites: "On step 2",
    title: "Email verification if implemented",
    steps: "1. Enter email.\n2. Request verification code if shown.\n3. Verify.",
    expectedResult: "Email verified or field saved correctly.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "UI Design",
    priority: "P2",
    prerequisites: "On login OTP step",
    title: "OTP input fields styled consistently",
    steps: "1. Reach OTP step.\n2. Observe OTP boxes/field.",
    expectedResult: "OTP UI readable; keyboard numeric type opens.",
  }),
  c({
    screenName: "Register Step 2",
    route: "/screens/auth/register/second",
    role: ROLES.guest,
    testType: "UI Design",
    priority: "P2",
    prerequisites: "On step 2",
    title: "Progress indicator shows registration step",
    steps: "1. Observe step indicator on register screens.",
    expectedResult: "User knows current step in multi-step flow.",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "Unregistered mobile on login",
    title: "Login with unregistered mobile shows error",
    steps: "1. Enter unregistered mobile.\n2. Send OTP.",
    expectedResult: "Error prompting registration.",
  }),
  c({
    screenName: "Register Step 4",
    route: "/screens/auth/register/fourth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P1",
    prerequisites: "Worker role selected",
    title: "Skill multi-select on Worker registration",
    steps: "1. Select Worker.\n2. Pick multiple skills.\n3. Submit.",
    expectedResult: "Selected skills saved to profile.",
  }),
  c({
    screenName: "Register Step 5",
    route: "/screens/auth/register/fifth",
    role: ROLES.guest,
    testType: "Functionality",
    priority: "P2",
    prerequisites: "On step 5",
    title: "Skip photo if optional and still complete",
    steps: "1. Attempt finish without photo if skip available.",
    expectedResult: "Behavior matches product rules (required vs optional).",
  }),
  c({
    screenName: "Login",
    route: "/screens/auth/login",
    role: ROLES.guest,
    testType: "UI Design",
    priority: "P1",
    prerequisites: "On login",
    title: "Login screen branding and logo visible",
    steps: "1. Open login.\n2. Observe header/branding.",
    expectedResult: "Apna Rojgar branding visible; professional layout.",
  }),
];

import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Service Listing & Detail", "SVC");

export default [
  c({ screenName: "Service List", route: "/screens/service", role: ROLES.all, testType: "Availability", priority: "P0", prerequisites: "Navigate to service list", title: "Service list screen loads with pagination", steps: "1. Open /screens/service.", expectedResult: "Paginated service cards visible." }),
  c({ screenName: "Service List", route: "/screens/service", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "List with params", title: "Service list filters by saved/hiring query params", steps: "1. Open with ?saved=true or hiring param.", expectedResult: "List filtered per param." }),
  c({
    screenName: "Service Detail",
    route: "/screens/service/[id]",
    role: ROLES.all,
    testType: "Availability",
    priority: "P0",
    prerequisites:
      "At least one active job exists on staging. Log in as any role. Know a valid job ID (tap any job card from Home or Work tab).",
    title: "Job detail page loads with all information sections",
    steps:
      "From Home or Work tab, tap any job/service card to open its detail page.\n" +
      "Wait for the page to fully load (spinner disappears).\n" +
      "Slowly scroll from top to bottom and look for each section listed in Expected Result.\n" +
      "Take note if any section is missing or shows an error.",
    expectedResult:
      "Job photo carousel/gallery is visible at the top.\n" +
      "Job title, category, and daily pay rate are shown.\n" +
      "Requirements section shows workers needed per skill.\n" +
      "Facilities section shows food/living/travel/ESI-PF if employer added them.\n" +
      "Employer info box shows employer name and photo.\n" +
      "Map or location section is visible.\n" +
      "Action buttons at bottom match your role (Apply for Worker, Manage for Employer).",
  }),
  c({
    screenName: "Service Detail",
    route: "/screens/service/[id]",
    role: ROLES.worker,
    testType: "Functionality",
    priority: "P0",
    prerequisites:
      "Log in as Worker. Open a job you have NOT applied to yet. Worker profile should have matching skills (or be ready to add skill in modal).",
    title: "Worker can apply to an open job",
    steps:
      "Log in as Worker and open a job detail page you have not applied to.\n" +
      "Scroll to the bottom action area and find the 'Apply' button.\n" +
      "Tap Apply. If a confirmation dialog or skill modal appears, complete it.\n" +
      "Wait for the API response (loading indicator on button).\n" +
      "Observe how the Apply button changes after success.",
    expectedResult:
      "Apply button shows loading state while submitting.\n" +
      "Success toast appears (e.g. 'Application submitted').\n" +
      "Button changes to 'Applied' or 'Cancel Apply' state.\n" +
      "Job appears in Activity tab → Applied Jobs sub-tab.\n" +
      "Employer can see this worker in the Applicants list for that job.",
  }),
  c({
    screenName: "Service Detail",
    route: "/screens/service/[id]",
    role: ROLES.worker,
    testType: "Functionality",
    priority: "P0",
    prerequisites: "Log in as Worker. Open a job you HAVE already applied to.",
    title: "Worker can cancel a pending job application",
    steps:
      "Log in as Worker and open a job you previously applied to.\n" +
      "Find the 'Cancel Apply' or similar button (replaces Apply after applying).\n" +
      "Tap Cancel Apply and confirm if a dialog appears.\n" +
      "Check Activity tab → Applied Jobs to verify removal.",
    expectedResult:
      "Cancel action succeeds with confirmation toast.\n" +
      "Button reverts to 'Apply' state.\n" +
      "Job is removed from Activity → Applied Jobs list.\n" +
      "Employer no longer sees this worker in Applicants (or status shows cancelled).",
  }),
  c({
    screenName: "Service Detail",
    route: "/screens/service/[id]",
    role: ROLES.employer,
    testType: "Availability",
    priority: "P0",
    prerequisites:
      "Log in as Employer. Open a job YOU posted (Activity → My Services, or your own listing).",
    title: "Employer sees Applications and Selections tabs on own job",
    steps:
      "Log in as Employer and navigate to a job you posted.\n" +
      "Scroll down looking for tab bar or sections labelled 'Applications' and 'Selections'.\n" +
      "Tap each tab and observe the content.",
    expectedResult:
      "Applications tab is visible on employer's own job.\n" +
      "Selections tab is visible next to Applications.\n" +
      "Applications tab lists workers who applied (or shows empty state).\n" +
      "Selections tab lists workers employer has selected (or empty state).\n" +
      "These tabs are NOT shown when viewing another employer's job.",
  }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Service with images", title: "Image carousel swipe works", steps: "1. Swipe through job photos.", expectedResult: "Images change; indicators update." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "On service detail", title: "Like/unlike service", steps: "1. Tap like/heart.\n2. Tap again to unlike.", expectedResult: "Like state toggles; persisted." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "On service detail", title: "Share service via WhatsApp", steps: "1. Tap Share.\n2. Select WhatsApp.", expectedResult: "Hindi share message with job link opens in WhatsApp." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "On service detail", title: "Text-to-speech reads job description", steps: "1. Tap TTS/speaker icon.", expectedResult: "Job details read aloud." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Job with location", title: "View map shows job location", steps: "1. Tap map/view location.", expectedResult: "Map opens with pin at job location." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.worker, testType: "Functionality", priority: "P1", prerequisites: "Job requires skill worker lacks", title: "Add skill modal during apply", steps: "1. Tap Apply.\n2. Add missing skill in modal.\n3. Submit.", expectedResult: "Skill added and application submitted." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.worker, testType: "Functionality", priority: "P1", prerequisites: "Employer phone on job", title: "Call employer button", steps: "1. Tap Call Employer.", expectedResult: "Phone dialer opens with employer number." }),
  c({ screenName: "Applicants Tab", route: "showApplicationsAndSelections", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Job with applicants", title: "Employer view applicant list", steps: "1. Open Applications tab.\n2. View applicants.", expectedResult: "Applicant cards with skills and status." }),
  c({ screenName: "Applicants Tab", route: "showApplicationsAndSelections", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Pending applicant", title: "Employer select worker from applicants", steps: "1. Tap Select on applicant.", expectedResult: "Worker moved to selections." }),
  c({ screenName: "Applicants Tab", route: "showApplicationsAndSelections", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Pending applicant", title: "Employer reject applicant", steps: "1. Tap Reject on applicant.", expectedResult: "Applicant rejected." }),
  c({ screenName: "Selections Tab", route: "selectedApplicants.tsx", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Selected workers", title: "Employer view selected workers list", steps: "1. Open Selections tab.", expectedResult: "Selected workers listed." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Own active job", title: "Employer complete job", steps: "1. Tap Complete Job.\n2. Confirm modal.", expectedResult: "Job marked complete." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Completed/deleted job", title: "Employer restore service", steps: "1. Tap Restore on completed job.", expectedResult: "Job restored to active." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Own job", title: "Employer delete service with confirmation", steps: "1. Tap Delete.\n2. Confirm modal.", expectedResult: "Job deleted." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.mediator, testType: "Functionality", priority: "P0", prerequisites: "Mediator with team", title: "Mediator apply with team drawer", steps: "1. Tap Apply as Team.\n2. Select team members.\n3. Submit.", expectedResult: "Team application submitted." }),
  c({ screenName: "Apply Mediator Drawer", route: "ApplyAsMediatorDrawer", role: ROLES.mediator, testType: "UI Design", priority: "P1", prerequisites: "Drawer open", title: "Mediator drawer shows skill matching for team", steps: "1. Open apply drawer.\n2. Observe member skill match.", expectedResult: "Skill match indicators visible per member." }),
  c({ screenName: "Applicants Summary", route: "applicantsSummary.tsx", role: ROLES.employer, testType: "Availability", priority: "P2", prerequisites: "Job with applicants", title: "Applicant count summary visible", steps: "1. Observe applicant summary on detail.", expectedResult: "Applied/selected counts shown." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "On detail", title: "Requirements section shows workers needed and pay", steps: "1. Observe requirements block.", expectedResult: "Worker count per skill and daily pay visible." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Job with facilities", title: "Facilities section shows food travel ESI PF", steps: "1. Observe facilities.", expectedResult: "Facility icons/labels correct." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "Analytics enabled", title: "Service view analytics event fired", steps: "1. Open service detail.\n2. Check analytics if available.", expectedResult: "Service view event queued." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Invalid service ID", title: "Invalid service ID shows error state", steps: "1. Open /screens/service/invalid-id.", expectedResult: "Error or not found message; no crash." }),
  c({ screenName: "Service List", route: "ListingHorizontalServices", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Horizontal list on home", title: "Horizontal service cards tappable and styled", steps: "1. Observe horizontal list cards.", expectedResult: "Cards consistent size; tappable." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Hindi locale", title: "Service detail labels in Hindi", steps: "1. Set Hindi.\n2. Open service detail.", expectedResult: "Section headings in Hindi." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Own job", title: "Edit service if edit option available", steps: "1. Tap Edit if shown.\n2. Modify field.\n3. Save.", expectedResult: "Service updated on server." }),
  c({ screenName: "Action Buttons", route: "actionButtons.tsx", role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "On service detail per role", title: "Action buttons match user role", steps: "1. Open same job as Worker, Employer, Mediator.\n2. Compare buttons.", expectedResult: "Role-appropriate actions only shown." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "On detail", title: "Back navigation returns to previous screen", steps: "1. Open from list.\n2. Tap back.", expectedResult: "Returns to list with scroll position if preserved." }),
  c({ screenName: "Service List", route: "/screens/service", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Long list", title: "Service list infinite scroll", steps: "1. Scroll to bottom.", expectedResult: "More services load." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.worker, testType: "UI Design", priority: "P2", prerequisites: "Applied job", title: "Applied state visually distinct on detail", steps: "1. View job already applied to.", expectedResult: "Applied badge or button state clear." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.employer, testType: "UI Design", priority: "P2", prerequisites: "Job with many applicants", title: "Applicant list scroll and performance", steps: "1. Open job with 20+ applicants.", expectedResult: "List scrolls smoothly." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "Offline", title: "Service detail handles offline on cached data", steps: "1. Open detail offline after cache.", expectedResult: "Cached data or error message." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.mediator, testType: "Functionality", priority: "P1", prerequisites: "Already applied as team", title: "Mediator cancel team application", steps: "1. Cancel team apply if available.", expectedResult: "Application cancelled." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "On detail", title: "Employer info box shows name and rating", steps: "1. Observe employer section.", expectedResult: "Employer name, photo, rating visible." }),
  c({ screenName: "Service List", route: "/screens/favourite", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Liked services", title: "Favourites list shows liked services only", steps: "1. Open favourites.\n2. Compare to liked items.", expectedResult: "Only liked services listed." }),
  c({ screenName: "Service Detail", route: "/screens/service/[id]", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "Share available", title: "Copy job link to clipboard", steps: "1. Tap share.\n2. Copy link if option exists.", expectedResult: "Job URL copied." }),
];

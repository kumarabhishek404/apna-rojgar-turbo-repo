import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Tab: Activity", "ACT");

const workerTabs = ["Applied Jobs", "Bookings", "Work Requests"];
const employerTabs = ["Bookings", "Sent Invitations", "My Services"];
const mediatorTabs = ["Team Bookings", "Work Requests", "Applied Services"];

const cases = [
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth", role: ROLES.worker, testType: "Availability", priority: "P0", prerequisites: "Worker logged in", title: "Worker activity tab loads with sub-tabs", steps: "1. Open Activity tab as Worker.", expectedResult: "UnifiedActivityScreen with icon sub-tabs visible." }),
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth", role: ROLES.employer, testType: "Availability", priority: "P0", prerequisites: "Employer logged in", title: "Employer activity tab loads with sub-tabs", steps: "1. Open Activity tab as Employer.", expectedResult: "Employer-specific activity sub-tabs visible." }),
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth", role: ROLES.mediator, testType: "Availability", priority: "P0", prerequisites: "Mediator logged in", title: "Mediator activity tab loads with sub-tabs", steps: "1. Open Activity tab as Mediator.", expectedResult: "Mediator-specific sub-tabs visible." }),
  c({ screenName: "Admin Requests Tab", route: "/(tabs)/fourth", role: ROLES.admin, testType: "Availability", priority: "P0", prerequisites: "Admin logged in", title: "Admin activity tab shows requests queue", steps: "1. Open tab 4 as Admin.", expectedResult: "AdminRequests component visible." }),
];

workerTabs.forEach((tab) => {
  cases.push(
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.worker, testType: "Availability", priority: "P1", prerequisites: "Worker on activity tab", title: `Worker ${tab} sub-tab visible and selectable`, steps: `1. Open Activity tab.\n2. Tap ${tab} sub-tab.`, expectedResult: `${tab} content area loads.` }),
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.worker, testType: "Functionality", priority: "P1", prerequisites: `Worker on ${tab} tab with data`, title: `Worker ${tab} list shows items and navigates on tap`, steps: `1. Open ${tab} sub-tab.\n2. Tap a list item.`, expectedResult: "Navigates to relevant detail screen." }),
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.worker, testType: "UI Design", priority: "P2", prerequisites: `Worker on ${tab} empty`, title: `Worker ${tab} empty state`, steps: `1. Open ${tab} with no data.`, expectedResult: "Empty state message shown." })
  );
});

employerTabs.forEach((tab) => {
  cases.push(
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.employer, testType: "Availability", priority: "P1", prerequisites: "Employer on activity tab", title: `Employer ${tab} sub-tab visible`, steps: `1. Tap ${tab} sub-tab.`, expectedResult: `${tab} section loads.` }),
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: `Employer ${tab} with data`, title: `Employer ${tab} item actions work`, steps: `1. Open ${tab}.\n2. Perform primary action on item.`, expectedResult: "Action completes or opens detail." })
  );
});

mediatorTabs.forEach((tab) => {
  cases.push(
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.mediator, testType: "Availability", priority: "P1", prerequisites: "Mediator on activity tab", title: `Mediator ${tab} sub-tab visible`, steps: `1. Tap ${tab} sub-tab.`, expectedResult: `${tab} section loads.` }),
    c({ screenName: `Activity - ${tab}`, route: "UnifiedActivityScreen", role: ROLES.mediator, testType: "Functionality", priority: "P1", prerequisites: `Mediator ${tab} with data`, title: `Mediator ${tab} list item tap navigates`, steps: `1. Tap item in ${tab}.`, expectedResult: "Correct detail screen opens." })
  );
});

cases.push(
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth?tab=bookings", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Deep link with tab param", title: "Deep link ?tab= param opens correct activity sub-tab", steps: "1. Open /(tabs)/fourth?tab=bookings.\n2. Observe active sub-tab.", expectedResult: "Bookings sub-tab pre-selected." }),
  c({ screenName: "Worker Bookings", route: "workerBookings.tsx", role: ROLES.worker, testType: "Functionality", priority: "P0", prerequisites: "Worker with confirmed booking", title: "Worker view confirmed booking details", steps: "1. Open Bookings sub-tab.\n2. Tap booking.", expectedResult: "Booking detail with employer info shown." }),
  c({ screenName: "Worker Work Requests", route: "workerWorkRequests.tsx", role: ROLES.worker, testType: "Functionality", priority: "P0", prerequisites: "Pending invitation", title: "Worker accept booking invitation", steps: "1. Open Work Requests.\n2. Tap Accept on invitation.", expectedResult: "Invitation accepted; moves to bookings." }),
  c({ screenName: "Worker Work Requests", route: "workerWorkRequests.tsx", role: ROLES.worker, testType: "Functionality", priority: "P0", prerequisites: "Pending invitation", title: "Worker reject booking invitation", steps: "1. Tap Reject on invitation.", expectedResult: "Invitation rejected; removed from list." }),
  c({ screenName: "Employer Bookings", route: "employerBookings.tsx", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Employer with booking", title: "Employer view booked workers from activity", steps: "1. Open Bookings sub-tab.\n2. Tap booking.", expectedResult: "Booking detail with worker list." }),
  c({ screenName: "Employer Work Requests", route: "employerWorkRequests.tsx", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Sent invitation", title: "Employer cancel sent invitation", steps: "1. Open Sent Invitations.\n2. Cancel invitation.", expectedResult: "Invitation cancelled." }),
  c({ screenName: "Employer My Services", route: "UnifiedActivityScreen", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Posted jobs", title: "Employer my services list from activity", steps: "1. Open My Services sub-tab.\n2. Tap a service.", expectedResult: "Navigates to service detail." }),
  c({ screenName: "Mediator Bookings", route: "mediatorBookings.tsx", role: ROLES.mediator, testType: "Functionality", priority: "P1", prerequisites: "Mediator booking exists", title: "Mediator view team booking", steps: "1. Open Team Bookings.\n2. Tap booking.", expectedResult: "Team booking detail shown." }),
  c({ screenName: "Applied Jobs", route: "UnifiedActivityScreen", role: ROLES.worker, testType: "Functionality", priority: "P0", prerequisites: "Applied to job", title: "Worker cancel job application from activity", steps: "1. Open Applied Jobs.\n2. Cancel application.", expectedResult: "Application cancelled." }),
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Any sub-tab list", title: "Pull to refresh on activity sub-tab", steps: "1. Pull down on list.", expectedResult: "List refreshes." }),
  c({ screenName: "Admin Requests Tab", route: "AdminRequests", role: ROLES.admin, testType: "Functionality", priority: "P0", prerequisites: "Pending admin requests", title: "Admin approve activation request", steps: "1. Open pending request.\n2. Approve.", expectedResult: "User activated." }),
  c({ screenName: "Admin Requests Tab", route: "AdminRequests", role: ROLES.admin, testType: "Functionality", priority: "P0", prerequisites: "Pending admin requests", title: "Admin reject suspension request", steps: "1. Open request.\n2. Reject/deny.", expectedResult: "Request handled." }),
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "On activity tab", title: "Activity icon sub-tabs scroll if many", steps: "1. Observe sub-tab bar on small screen.", expectedResult: "Sub-tabs accessible via scroll." }),
  c({ screenName: "Legacy Bookings Requests", route: "/screens/bottomTabs/(user)/bookingsAndRequests", role: ROLES.all, testType: "Availability", priority: "P2", prerequisites: "Navigate to legacy route", title: "Legacy bookingsAndRequests screen accessible", steps: "1. Navigate to legacy route if linked.", expectedResult: "Bookings/Requests switcher loads.", notes: "Superseded by UnifiedActivityScreen." }),
  c({ screenName: "Activity Tab", route: "/(tabs)/fourth", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Hindi locale", title: "Activity sub-tab labels in Hindi", steps: "1. Set Hindi.\n2. Open activity tab.", expectedResult: "Sub-tab labels translated." }),
  c({ screenName: "Admin Requests Tab", route: "AdminRequests", role: ROLES.admin, testType: "UI Design", priority: "P1", prerequisites: "Admin requests tab", title: "Admin requests show request type and user", steps: "1. Observe request cards.", expectedResult: "Request type, user name, date visible." })
);

export default cases;

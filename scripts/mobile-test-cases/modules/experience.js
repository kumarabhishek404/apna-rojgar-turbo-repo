import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Experience History", "EXP");

export default [
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "From profile menu", title: "Experience screen loads", steps: "1. Open /screens/experience.", expectedResult: "Combined work and service history timeline visible." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.worker, testType: "Functionality", priority: "P1", prerequisites: "Worker with completed jobs", title: "Worker work history items listed", steps: "1. Open experience as Worker.", expectedResult: "Past work/bookings shown chronologically." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Employer with posted jobs", title: "Employer service history items listed", steps: "1. Open experience as Employer.", expectedResult: "Posted/completed services shown." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "No history", title: "Experience empty state", steps: "1. Open with no history.", expectedResult: "Empty state message." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "History item tappable", title: "Tap history item navigates to detail", steps: "1. Tap a history entry.", expectedResult: "Opens related service or booking detail." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "On experience", title: "Pull to refresh experience", steps: "1. Pull down.", expectedResult: "History refreshes." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Multiple history items", title: "Timeline chronological order correct", steps: "1. Compare dates on timeline.", expectedResult: "Most recent first or consistent order." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Hindi locale", title: "Experience labels in Hindi", steps: "1. Set Hindi.\n2. Open experience.", expectedResult: "Section labels in Hindi." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "On experience", title: "Back navigation from experience", steps: "1. Tap back.", expectedResult: "Returns to profile." }),
  c({ screenName: "Experience", route: "/screens/experience", role: ROLES.mediator, testType: "Functionality", priority: "P2", prerequisites: "Mediator with team jobs", title: "Mediator experience includes team work", steps: "1. Open as Mediator with history.", expectedResult: "Team-related work entries shown." }),
];

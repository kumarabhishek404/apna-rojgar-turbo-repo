import globalCases from "./modules/global.js";
import onboardingCases from "./modules/onboarding.js";
import authCases from "./modules/auth.js";
import homeCases from "./modules/home.js";
import workCases from "./modules/work.js";
import peopleCases from "./modules/people.js";
import activityCases from "./modules/activity.js";
import profileCases from "./modules/profile.js";
import serviceCases from "./modules/service.js";
import addServiceCases from "./modules/addService.js";
import usersCases from "./modules/users.js";
import bookingsCases from "./modules/bookings.js";
import attendanceCases from "./modules/attendance.js";
import teamCases from "./modules/team.js";
import reviewsCases from "./modules/reviews.js";
import notificationsCases from "./modules/notifications.js";
import deepLinksCases from "./modules/deepLinks.js";
import experienceCases from "./modules/experience.js";
import supportCases from "./modules/support.js";
import adminCases from "./modules/admin.js";
import accessibilityCases from "./modules/accessibility.js";
import uiDesignCases from "./modules/uiDesign.js";

/** All manual test cases for Apna Rojgar Android app. */
export const allTestCases = [
  ...globalCases,
  ...onboardingCases,
  ...authCases,
  ...homeCases,
  ...workCases,
  ...peopleCases,
  ...activityCases,
  ...profileCases,
  ...serviceCases,
  ...addServiceCases,
  ...usersCases,
  ...bookingsCases,
  ...attendanceCases,
  ...teamCases,
  ...reviewsCases,
  ...notificationsCases,
  ...deepLinksCases,
  ...experienceCases,
  ...supportCases,
  ...adminCases,
  ...accessibilityCases,
  ...uiDesignCases,
];

export default allTestCases;

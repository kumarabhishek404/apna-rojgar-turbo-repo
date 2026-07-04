import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Tab: Profile", "PROF");

const menuLinks = [
  { name: "Experience", route: "/screens/experience", fn: "Opens work history" },
  { name: "Reviews", route: "/screens/reviews", fn: "Opens reviews list" },
  { name: "Favourites", route: "/screens/favourite", fn: "Opens liked services" },
  { name: "Notifications", route: "/screens/notifications", fn: "Opens notification inbox" },
  { name: "Help", route: "/screens/helps", fn: "Opens FAQ/help" },
  { name: "Share App", route: "/screens/shareApp", fn: "Opens share options" },
  { name: "App Feedback", route: "/screens/appFeedback", fn: "Opens feedback form" },
  { name: "Privacy Policy", route: "/screens/privacyPolicy", fn: "Opens privacy text" },
  { name: "Terms", route: "/screens/termsAndConditions", fn: "Opens terms text" },
  { name: "Delete Account", route: "/screens/profile/deleteProfile", fn: "Opens delete confirmation" },
  { name: "Change Language", route: "/screens/settings/changeLanguage", fn: "Opens language picker" },
];

const cases = [
  c({ screenName: "Profile Tab", route: "/(tabs)/fifth", role: ROLES.all, testType: "Availability", priority: "P0", prerequisites: "Logged in", title: "Profile tab loads with user info", steps: "1. Open Profile tab.", expectedResult: "User photo, name, role visible." }),
  c({ screenName: "Profile Tab", route: "/(tabs)/fifth", role: ROLES.admin, testType: "Availability", priority: "P0", prerequisites: "Admin logged in", title: "Admin profile tab loads", steps: "1. Open Profile as Admin.", expectedResult: "AdminProfile component visible." }),
  c({ screenName: "Profile Overview", route: "UserProfile", role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "On profile tab", title: "Overview sub-tab shows stats and info", steps: "1. Select Overview tab.", expectedResult: "Work info, likes, skills sections visible." }),
  c({ screenName: "Profile Settings", route: "UserProfile", role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "On profile tab", title: "Settings sub-tab shows menu links", steps: "1. Select Settings tab.", expectedResult: "Profile menu with all links visible." }),
  c({ screenName: "Edit Profile", route: "UserProfile", role: ROLES.all, testType: "Functionality", priority: "P0", prerequisites: "On profile", title: "Edit profile fields and save", steps: "1. Edit name/address.\n2. Save.", expectedResult: "Profile updated on server and UI." }),
  c({ screenName: "Skills", route: "UserProfile", role: ROLES.worker, testType: "Functionality", priority: "P1", prerequisites: "Worker profile", title: "Add skill to profile", steps: "1. Tap add skill.\n2. Select skill.\n3. Save.", expectedResult: "Skill added to profile." }),
  c({ screenName: "Skills", route: "UserProfile", role: ROLES.worker, testType: "Functionality", priority: "P1", prerequisites: "Skill on profile", title: "Remove skill from profile", steps: "1. Remove existing skill.", expectedResult: "Skill removed." }),
  c({ screenName: "Role Switcher", route: "RoleSwitcher", role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "Multi-role account or switcher enabled", title: "Role switcher visible on profile", steps: "1. Find RoleSwitcher on profile.", expectedResult: "Worker/Employer/Mediator options shown." }),
  c({ screenName: "Role Switcher", route: "RoleSwitcher", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Role switcher visible", title: "Switch role updates entire app UI", steps: "1. Switch from Worker to Employer.\n2. Check tabs.", expectedResult: "Tabs and content reflect new role." }),
  c({ screenName: "Logout", route: "UserProfile", role: ROLES.all, testType: "Functionality", priority: "P0", prerequisites: "Logged in", title: "Logout confirmation modal", steps: "1. Tap Logout.\n2. Observe modal.\n3. Confirm.", expectedResult: "Modal shown; logout on confirm." }),
  c({ screenName: "Team Admin Card", route: "TeamAdminCard", role: ROLES.mediator, testType: "Availability", priority: "P1", prerequisites: "Mediator with team", title: "Team admin card visible on mediator profile", steps: "1. Open Mediator profile overview.", expectedResult: "Team summary card with member count." }),
  c({ screenName: "Team Admin Card", route: "TeamAdminCard", role: ROLES.mediator, testType: "Functionality", priority: "P1", prerequisites: "Team card visible", title: "Tap team card opens team detail", steps: "1. Tap team admin card.", expectedResult: "Navigates to team members screen." }),
  c({ screenName: "Social Links", route: "UserProfile", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "On profile settings", title: "Join WhatsApp group link opens WhatsApp", steps: "1. Tap Join WhatsApp Group.", expectedResult: "WhatsApp app opens or intent shown." }),
  c({ screenName: "Social Links", route: "UserProfile", role: ROLES.all, testType: "Functionality", priority: "P2", prerequisites: "On profile settings", title: "Instagram link opens Instagram", steps: "1. Tap Instagram link.", expectedResult: "Instagram app/browser opens." }),
  c({ screenName: "Full Profile Screen", route: "/screens/profile", role: ROLES.all, testType: "Availability", priority: "P2", prerequisites: "Navigate from menu", title: "Stack profile screen with back header", steps: "1. Open /screens/profile from link.", expectedResult: "Full-screen profile with back button." }),
  c({ screenName: "Profile Photo", route: "UserProfile", role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "On profile", title: "Change profile photo via camera or gallery", steps: "1. Tap edit photo.\n2. Pick image.\n3. Save.", expectedResult: "New photo uploaded and displayed." }),
  c({ screenName: "Profile Tab", route: "/(tabs)/fifth", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "On profile", title: "Overview and Settings tabs styled consistently", steps: "1. Switch between sub-tabs.", expectedResult: "Clear active tab indicator." }),
  c({ screenName: "Profile Tab", route: "/(tabs)/fifth", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Hindi locale", title: "Profile menu items in Hindi", steps: "1. Set Hindi.\n2. Open settings tab.", expectedResult: "Menu labels in Hindi." }),
  c({ screenName: "Admin Profile", route: "AdminProfile", role: ROLES.admin, testType: "Functionality", priority: "P1", prerequisites: "Admin on profile", title: "Admin profile settings accessible", steps: "1. Open admin settings section.", expectedResult: "Admin-specific settings visible." }),
];

menuLinks.forEach((link) => {
  cases.push(
    c({ screenName: "Profile Menu", route: link.route, role: ROLES.all, testType: "Availability", priority: "P1", prerequisites: "Profile settings tab", title: `${link.name} menu link visible`, steps: `1. Open Profile Settings.\n2. Find ${link.name} link.`, expectedResult: `${link.name} link present in menu.` }),
    c({ screenName: link.name, route: link.route, role: ROLES.all, testType: "Functionality", priority: "P1", prerequisites: "Profile settings tab", title: `${link.name} link navigates correctly`, steps: `1. Tap ${link.name}.\n2. Observe screen.`, expectedResult: link.fn })
  );
});

cases.push(
  c({ screenName: "Delete Account", route: "/screens/profile/deleteProfile", role: ROLES.all, testType: "Functionality", priority: "P0", prerequisites: "On delete profile screen", title: "Delete account confirmation and API call", steps: "1. Tap Delete Account.\n2. Confirm in modal.", expectedResult: "Account deletion initiated; logged out.", notes: "Use test account only." }),
  c({ screenName: "Profile Tab", route: "/(tabs)/fifth", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Long profile content", title: "Profile tab scrolls smoothly", steps: "1. Scroll full profile.", expectedResult: "No layout breaks." }),
  c({ screenName: "Service Information", route: "ServiceInformation", role: ROLES.employer, testType: "Availability", priority: "P2", prerequisites: "Employer with posted jobs", title: "Employer service stats on profile overview", steps: "1. Open employer profile overview.", expectedResult: "Posted jobs count/stats shown." }),
  c({ screenName: "Work Information", route: "WorkInformation", role: ROLES.worker, testType: "Availability", priority: "P2", prerequisites: "Worker with work history", title: "Worker work history on profile overview", steps: "1. Open worker profile overview.", expectedResult: "Work history summary shown." }),
  c({ screenName: "Likes Stats", route: "LikesStats", role: ROLES.all, testType: "Availability", priority: "P2", prerequisites: "On profile overview", title: "Likes/favourites stats displayed", steps: "1. Observe likes section.", expectedResult: "Like counts visible." })
);

export default cases;

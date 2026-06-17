import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Cross-cutting UI Design", "UI");

const listScreens = [
  "Home dashboard",
  "Work tab list",
  "People tab list",
  "Activity sub-tabs",
  "Notifications inbox",
  "Service list",
  "Users list",
  "Bookings list",
  "Team requests",
  "Reviews list",
  "Favourites",
  "Admin users list",
];

const cases = [
  c({ screenName: "Stack Headers", route: "/screens/*", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Logged in", title: "Consistent back button on all stack screens", steps: "1. Open 10+ different /screens/* routes.\n2. Verify back button on each.", expectedResult: "Back navigation present and functional on all." }),
  c({ screenName: "Tab Bar", route: "/(tabs)", role: ROLES.all, testType: "UI Design", priority: "P0", prerequisites: "Pending approval account", title: "Bottom tab bar hidden for pending approval users", steps: "1. Login pending account.\n2. Observe layout.", expectedResult: "No bottom tab bar; profile full screen." }),
  c({ screenName: "Modals", route: "ModalComponent", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Trigger delete/complete/deactivate", title: "Confirmation modals have clear title message and buttons", steps: "1. Trigger delete service, complete booking, deactivate account modals.", expectedResult: "Each modal has title, message, Confirm/Cancel." }),
  c({ screenName: "Theme Colors", route: "constants/Colors.ts", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Navigate major screens", title: "Primary brand colors consistent across app", steps: "1. Compare buttons, headers, tabs across 5 screens.", expectedResult: "Consistent primary/accent colors." }),
  c({ screenName: "Typography", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Multiple screens", title: "Font sizes hierarchy consistent (headings vs body)", steps: "1. Compare heading and body text sizes.", expectedResult: "Clear visual hierarchy." }),
  c({ screenName: "Touch Targets", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Small Android phone", title: "Buttons and tabs meet minimum touch target size", steps: "1. Test tap accuracy on tabs, FAB, list actions.", expectedResult: "No mis-taps due to small targets." }),
  c({ screenName: "Keyboard Handling", route: "Forms", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Login, register, add service forms", title: "Keyboard does not hide submit buttons", steps: "1. Focus bottom form fields.\n2. Observe submit button visibility.", expectedResult: "Form scrolls or adjusts for keyboard." }),
  c({ screenName: "Hindi Rendering", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Hindi locale", title: "Hindi text renders on Login Home Service Detail Profile", steps: "1. Set Hindi.\n2. Spot-check 4 key screens.", expectedResult: "No tofu boxes; Hindi readable." }),
  c({ screenName: "English Rendering", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "English locale", title: "English text complete on key screens", steps: "1. Set English.\n2. Check login, home, work, profile.", expectedResult: "No missing translation keys." }),
  c({ screenName: "Image Upload Preview", route: "Upload flows", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Add service or profile photo", title: "Image preview shown before upload", steps: "1. Pick image.\n2. Observe preview.", expectedResult: "Thumbnail preview before submit." }),
  c({ screenName: "Image Upload Error", route: "Upload flows", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Large or invalid file", title: "Image upload error message on failure", steps: "1. Attempt invalid image upload.", expectedResult: "User-friendly error toast/message." }),
  c({ screenName: "Status Bar", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Light and dark screens", title: "Status bar readable on all screens", steps: "1. Navigate light and dark header screens.", expectedResult: "Status bar icons readable." }),
  c({ screenName: "FAB Position", route: "UnifiedTabFab", role: ROLES.employer, testType: "UI Design", priority: "P2", prerequisites: "Employer on work tab", title: "FAB does not overlap tab bar or list content", steps: "1. Scroll list to bottom.\n2. Observe FAB position.", expectedResult: "FAB above tab bar; not blocking content." }),
  c({ screenName: "Card Consistency", route: "Listings", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Multiple list types", title: "Service worker booking cards share consistent card style", steps: "1. Compare cards across home, work, activity.", expectedResult: "Consistent corner radius, shadow, padding." }),
  c({ screenName: "Loading Skeleton", route: "List screens", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Slow network", title: "Loading placeholders on list screens", steps: "1. Throttle network.\n2. Open list screens.", expectedResult: "Spinner or skeleton shown during load." }),
  c({ screenName: "Error States", route: "API screens", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "API error simulated", title: "API error shows user-friendly message not raw error", steps: "1. Simulate 500 error on list load.", expectedResult: "Friendly error; no stack trace shown." }),
  c({ screenName: "Modal Backdrop", route: "ModalComponent", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Any confirmation modal", title: "Modal backdrop dims background", steps: "1. Open confirmation modal.", expectedResult: "Background dimmed; focus on modal." }),
  c({ screenName: "Drawer Animation", route: "GlobalBottomDrawer", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Filter drawer", title: "Bottom drawer slide animation smooth", steps: "1. Open and close filter drawer.", expectedResult: "Smooth slide up/down animation." }),
  c({ screenName: "Tab Active State", route: "/(tabs)", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "On any tab", title: "Active tab icon and label highlighted", steps: "1. Switch between all 5 tabs.", expectedResult: "Active tab visually distinct each time." }),
  c({ screenName: "Form Labels", route: "Auth/Register", role: ROLES.guest, testType: "UI Design", priority: "P1", prerequisites: "Registration forms", title: "Form field labels aligned with inputs", steps: "1. Review register step 2 form layout.", expectedResult: "Labels above or beside inputs consistently." }),
  c({ screenName: "Icon Consistency", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Multiple screens", title: "Ionicons/Material icons consistent style", steps: "1. Compare icons on tabs, actions, menus.", expectedResult: "Consistent icon family and size." }),
  c({ screenName: "Landscape Orientation", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Rotate device", title: "App layout acceptable in landscape", steps: "1. Rotate to landscape on key screens.", expectedResult: "No broken layout or critical overlap.", notes: "App may be portrait-locked; document behavior." }),
  c({ screenName: "Safe Area", route: "Global", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Notched Android device", title: "Content respects safe area on notched devices", steps: "1. Test on punch-hole/notch device.", expectedResult: "No content under camera cutout." }),
  c({ screenName: "List Item Ripple", route: "Android", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Android device", title: "Touchable list items show press feedback", steps: "1. Tap list items.\n2. Observe ripple/highlight.", expectedResult: "Visual press feedback on tap." }),
  c({ screenName: "Scroll to Top", route: "Long lists", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Long scrolled list", title: "Tab re-tap scrolls to top if implemented", steps: "1. Scroll down on tab.\n2. Re-tap same tab.", expectedResult: "List scrolls to top or stays — document behavior." }),
  c({ screenName: "Duplicate Prevention", route: "Action buttons", role: ROLES.all, testType: "UI Design", priority: "P1", prerequisites: "Slow API", title: "Double-tap submit prevented with loading state", steps: "1. Tap Apply/Submit rapidly twice.", expectedResult: "Button disabled during loading; single submission." }),
  c({ screenName: "Chat Component", route: "Chat.tsx", role: ROLES.all, testType: "Availability", priority: "P2", prerequisites: "Chat UI if present", title: "Chat component UI if wired", steps: "1. Find chat UI in app.\n2. Observe layout.", expectedResult: "Document if chat is accessible; verify UI if wired.", notes: "Chat component exists; verify backend wiring." }),
  c({ screenName: "Testimonials", route: "Testimonials.tsx", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Home or marketing section", title: "Testimonials component renders if shown", steps: "1. Find testimonials on home if present.", expectedResult: "Testimonial cards readable.", notes: "Component exists in commons." }),
  c({ screenName: "App Version Display", route: "Profile/About", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Profile or about section", title: "App version 1.3.1 visible somewhere in app", steps: "1. Find version in profile, feedback, or about.", expectedResult: "Version number displayed for support reference." }),
  c({ screenName: "Link Styling", route: "Legal/Support", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: "Help and legal screens", title: "Links and phone numbers visually distinguishable", steps: "1. Observe links on help/legal screens.", expectedResult: "Links styled differently from body text." }),
];

listScreens.forEach((screen) => {
  cases.push(
    c({ screenName: screen, route: "List screens", role: ROLES.all, testType: "UI Design", priority: "P2", prerequisites: `Empty ${screen}`, title: `${screen} empty state UI`, steps: `1. Open ${screen} with zero items.`, expectedResult: "Centered empty state with icon and message." })
  );
});

export default cases;

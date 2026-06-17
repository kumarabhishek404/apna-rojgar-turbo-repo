import { createModuleBuilder, ROLES } from "../helpers.js";

const c = createModuleBuilder("Post a Job Wizard", "ADD");

const steps = [
  { name: "Select Work Category", file: "SelectWorkCategory.tsx", fields: "work category grid" },
  { name: "Select Sub-Category", file: "SelectWorkSubCategory.tsx", fields: "sub-category list" },
  { name: "Worker Salary & Requirements", file: "SelectWorkerSalary.tsx", fields: "worker count and daily pay per skill" },
  { name: "Select Facilities", file: "SelectFacilities.tsx", fields: "food, living, travel, ESI/PF toggles" },
  { name: "Location & Date", file: "SelectLocation&Date.tsx", fields: "address, map, start date" },
  { name: "Duration & Description", file: "SetDuration&Description.tsx", fields: "duration picker and description text" },
  { name: "Upload Images", file: "UploadImagesStep.tsx", fields: "photo upload grid" },
  { name: "Review & Publish", file: "final.tsx", fields: "summary review and publish button" },
];

const cases = [
  c({ screenName: "Add Service Wizard", route: "/screens/addService", role: ROLES.employer, testType: "Availability", priority: "P0", prerequisites: "Employer logged in", title: "Add service wizard opens at step 1", steps: "1. Navigate to /screens/addService.", expectedResult: "Category selection step visible." }),
  c({ screenName: "Add Service Wizard", route: "/screens/addService", role: ROLES.worker, testType: "Availability", priority: "P1", prerequisites: "Worker logged in", title: "Worker cannot access add service or sees blocked", steps: "1. Attempt to open add service as Worker.", expectedResult: "Wizard not accessible or appropriate message." }),
];

steps.forEach((step, idx) => {
  cases.push(
    c({ screenName: step.name, route: `/screens/addService (${step.file})`, role: ROLES.employer, testType: "Availability", priority: "P0", prerequisites: `Reached step ${idx + 1}`, title: `Step ${idx + 1}: ${step.name} UI loads`, steps: `1. Navigate to step ${idx + 1}.\n2. Observe form.`, expectedResult: `${step.fields} visible and usable.` }),
    c({ screenName: step.name, route: `/screens/addService (${step.file})`, role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: `On step ${idx + 1}`, title: `Step ${idx + 1}: validation blocks empty required fields`, steps: `1. Leave required fields empty.\n2. Tap Next.`, expectedResult: "Validation error; cannot proceed." }),
    c({ screenName: step.name, route: `/screens/addService (${step.file})`, role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: `On step ${idx + 1} with valid data`, title: `Step ${idx + 1}: Next proceeds to step ${idx + 2}`, steps: `1. Fill required fields.\n2. Tap Next.`, expectedResult: idx < 7 ? `Navigates to step ${idx + 2}.` : "Ready to publish." })
  );
});

cases.push(
  c({ screenName: "Location & Date", route: "SelectLocation&Date.tsx", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "On location step", title: "Map picker sets job address", steps: "1. Tap map/location.\n2. Pick point.\n3. Confirm.", expectedResult: "Address and coordinates saved." }),
  c({ screenName: "Location & Date", route: "SelectLocation&Date.tsx", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "On location step", title: "Date picker selects job start date", steps: "1. Tap date field.\n2. Select future date.", expectedResult: "Date saved in form." }),
  c({ screenName: "Upload Images", route: "UploadImagesStep.tsx", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "Camera/gallery permission", title: "Upload job photos from gallery", steps: "1. Tap add photo.\n2. Select from gallery.\n3. Confirm.", expectedResult: "Photo preview shown in grid." }),
  c({ screenName: "Upload Images", route: "UploadImagesStep.tsx", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Camera permission", title: "Capture job photo with camera", steps: "1. Tap camera option.\n2. Capture photo.", expectedResult: "Photo added to upload grid." }),
  c({ screenName: "Review & Publish", route: "final.tsx", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "All steps completed", title: "Publish job submits to API", steps: "1. Review summary.\n2. Tap Publish.", expectedResult: "Job created; success message; navigates away." }),
  c({ screenName: "Add Service Wizard", route: "/screens/addService", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "Mid-wizard", title: "Back button returns to previous step with data preserved", steps: "1. Fill step 3.\n2. Go to step 4.\n3. Tap Back.", expectedResult: "Step 3 data still filled (Jotai draft)." }),
  c({ screenName: "Worker Salary", route: "SelectWorkerSalary.tsx", role: ROLES.employer, testType: "Functionality", priority: "P0", prerequisites: "On salary step", title: "Set workers needed and pay per skill", steps: "1. Add skill row.\n2. Set count and daily pay.\n3. Next.", expectedResult: "Requirements saved correctly." }),
  c({ screenName: "Select Facilities", route: "SelectFacilities.tsx", role: ROLES.employer, testType: "UI Design", priority: "P2", prerequisites: "On facilities step", title: "Facility toggles visually clear on/off", steps: "1. Toggle each facility.\n2. Observe state.", expectedResult: "Clear selected/unselected styling." }),
  c({ screenName: "Add Service Wizard", route: "/screens/addService", role: ROLES.employer, testType: "UI Design", priority: "P1", prerequisites: "In wizard", title: "Step progress indicator visible", steps: "1. Observe progress through all steps.", expectedResult: "User knows current step number." }),
  c({ screenName: "Review & Publish", route: "final.tsx", role: ROLES.employer, testType: "UI Design", priority: "P1", prerequisites: "On review step", title: "Review shows all entered data accurately", steps: "1. Compare review to entered values.", expectedResult: "All fields match prior steps." }),
  c({ screenName: "Add Service Wizard", route: "/screens/addService", role: ROLES.employer, testType: "Functionality", priority: "P2", prerequisites: "Network error on publish", title: "Publish failure shows error toast", steps: "1. Simulate API failure on publish.", expectedResult: "Error toast; user can retry." }),
  c({ screenName: "Duration & Description", route: "SetDuration&Description.tsx", role: ROLES.employer, testType: "Functionality", priority: "P1", prerequisites: "On description step", title: "Voice-to-text for description if available", steps: "1. Tap voice input.\n2. Speak description.", expectedResult: "Text populated from speech." }),
  c({ screenName: "Add Service Wizard", route: "/screens/addService", role: ROLES.employer, testType: "UI Design", priority: "P2", prerequisites: "Hindi locale", title: "Wizard labels in Hindi", steps: "1. Set Hindi.\n2. Walk through wizard.", expectedResult: "Step labels in Hindi." }),
  c({ screenName: "Upload Images", route: "UploadImagesStep.tsx", role: ROLES.employer, testType: "Functionality", priority: "P2", prerequisites: "Photo uploaded", title: "Remove uploaded photo before publish", steps: "1. Upload photo.\n2. Remove it.", expectedResult: "Photo removed from grid." }),
  c({ screenName: "Select Work Category", route: "SelectWorkCategory.tsx", role: ROLES.employer, testType: "UI Design", priority: "P2", prerequisites: "On category step", title: "Category icons match work types", steps: "1. Observe category grid.", expectedResult: "Icons and labels aligned with WORKERTYPES." })
);

export default cases;

/**
 * Helper to build test case objects with auto-incrementing Test IDs.
 */
export function createModuleBuilder(moduleName, prefix) {
  let counter = 0;

  return function buildCase(fields) {
    counter += 1;
    return {
      testId: `TC-${prefix}-${String(counter).padStart(3, "0")}`,
      module: moduleName,
      screenName: fields.screenName,
      route: fields.route,
      role: fields.role,
      testType: fields.testType,
      priority: fields.priority || "P1",
      prerequisites: fields.prerequisites || "",
      title: fields.title,
      steps: fields.steps,
      expectedResult: fields.expectedResult,
      notes: fields.notes || "",
      suggestions: fields.suggestions || "",
    };
  };
}

/** Expand one scenario across multiple roles. */
export function forRoles(roles, buildFn) {
  return roles.map((role) => buildFn(role));
}

export const ROLES = {
  worker: "Worker",
  employer: "Employer",
  mediator: "Mediator",
  admin: "Admin",
  all: "All",
  guest: "Guest",
};

export const USER_ROLES = [ROLES.worker, ROLES.employer, ROLES.mediator];

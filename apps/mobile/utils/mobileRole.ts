/**
 * Mobile is a user app (worker / employer / mediator). There is no admin shell.
 *
 * If the account's stored role is ADMIN, show employer UI without calling the
 * update-role API. Explicit Profile → Change role is the only path that writes
 * WORKER / EMPLOYER / MEDIATOR to the backend.
 *
 * Do not use API `isAdmin` (role ADMIN *or* ADMIN_MOBILE) for this mapping —
 * after an admin picks Worker/Mediator, the phone can still be flagged admin
 * while `role` is a public role. UI must follow `role`.
 */

export type MobileRole = "WORKER" | "EMPLOYER" | "MEDIATOR" | "";

export function isStoredAdminRole(
  user: { role?: string | null } | null | undefined,
): boolean {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

/** Effective role for tabs, home, profile badge, and features. ADMIN → EMPLOYER. */
export function getMobileEffectiveRole(
  user: { role?: string | null } | null | undefined,
): MobileRole {
  if (isStoredAdminRole(user)) return "EMPLOYER";

  const role = String(user?.role || "").toUpperCase();
  if (role === "WORKER" || role === "EMPLOYER" || role === "MEDIATOR") {
    return role;
  }
  return "";
}

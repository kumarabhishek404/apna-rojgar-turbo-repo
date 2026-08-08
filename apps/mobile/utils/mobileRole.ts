/**
 * Mobile-only role normalization.
 * Website keeps ADMIN; the app has no admin dashboard — treat admins as employers.
 */

export type MobileRole = "WORKER" | "EMPLOYER" | "MEDIATOR" | "";

export function isMobileAdminUser(user: {
  isAdmin?: boolean;
  role?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  return String(user.role || "").toUpperCase() === "ADMIN";
}

/** Effective role for tabs, home, and features. ADMIN → EMPLOYER. */
export function getMobileEffectiveRole(
  user: { isAdmin?: boolean; role?: string | null } | null | undefined,
): MobileRole {
  if (isMobileAdminUser(user)) return "EMPLOYER";

  const role = String(user?.role || "").toUpperCase();
  if (role === "WORKER" || role === "EMPLOYER" || role === "MEDIATOR") {
    return role;
  }
  return "";
}

/**
 * Persist user for the app UI as an employer when the account is admin.
 * Does not change backend or website; only the in-app session shape.
 */
export function normalizeMobileUserSession<T extends Record<string, any>>(
  user: T | null | undefined,
): T | null | undefined {
  if (!user || typeof user !== "object") return user;
  if (!isMobileAdminUser(user)) return user;

  return {
    ...user,
    isAdmin: false,
    role: "EMPLOYER",
  };
}

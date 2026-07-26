type CandidateUser = {
  role?: string | null;
  mobile?: string | number | null;
};

/**
 * Admin UI/API access is role-based only.
 * Mobile number must not grant admin when role is WORKER / EMPLOYER / etc.
 */
export function isAdminUser(user?: CandidateUser | null): boolean {
  if (!user) return false;
  return String(user.role || "").toUpperCase() === "ADMIN";
}

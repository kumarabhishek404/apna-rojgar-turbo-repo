export const VERIFICATION_STATUS = {
  PENDING: "Pending",
  APPLIED: "Applied",
  COMPLETED: "Completed",
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

const VERIFIABLE_ROLES = new Set(["WORKER", "EMPLOYER", "MEDIATOR"]);

export function normalizeVerification(
  value?: string | null,
): VerificationStatus {
  const next = String(value || "").trim();
  if (next === VERIFICATION_STATUS.APPLIED) return VERIFICATION_STATUS.APPLIED;
  if (next === VERIFICATION_STATUS.COMPLETED) {
    return VERIFICATION_STATUS.COMPLETED;
  }
  return VERIFICATION_STATUS.PENDING;
}

export function isUserVerified(
  userOrStatus?: { verification?: string | null } | string | null,
) {
  const value =
    userOrStatus && typeof userOrStatus === "object"
      ? userOrStatus.verification
      : userOrStatus;
  return normalizeVerification(value) === VERIFICATION_STATUS.COMPLETED;
}

export function isVerifiableRole(role?: string | null) {
  return VERIFIABLE_ROLES.has(String(role || "").toUpperCase());
}

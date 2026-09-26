export const VERIFICATION_STATUS = {
  PENDING: "Pending",
  APPLIED: "Applied",
  COMPLETED: "Completed",
};

export const VERIFICATION_VALUES = Object.values(VERIFICATION_STATUS);

export const VERIFIABLE_ROLES = new Set(["WORKER", "EMPLOYER", "MEDIATOR"]);

export function normalizeVerification(value) {
  const next = String(value || "").trim();
  if (next === VERIFICATION_STATUS.APPLIED) return VERIFICATION_STATUS.APPLIED;
  if (next === VERIFICATION_STATUS.COMPLETED) {
    return VERIFICATION_STATUS.COMPLETED;
  }
  return VERIFICATION_STATUS.PENDING;
}

export function isUserVerified(userOrStatus) {
  const value =
    userOrStatus && typeof userOrStatus === "object"
      ? userOrStatus.verification
      : userOrStatus;
  return normalizeVerification(value) === VERIFICATION_STATUS.COMPLETED;
}

export function isVerifiableRole(role) {
  return VERIFIABLE_ROLES.has(String(role || "").toUpperCase());
}

export function pendingVerificationQuery() {
  return {
    $or: [
      { verification: VERIFICATION_STATUS.PENDING },
      { verification: { $exists: false } },
      { verification: null },
      { verification: "" },
    ],
  };
}

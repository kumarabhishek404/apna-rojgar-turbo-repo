import { getDefaultStore } from "jotai";
import Atoms from "@/app/AtomStore";

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
  DISABLED: "DISABLED",
  DELETED: "DELETED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

const API_MESSAGE_TO_STATUS: Record<string, UserStatus> = {
  "User is suspended": USER_STATUS.SUSPENDED,
  "User account is disabled": USER_STATUS.DISABLED,
  "User is not activated yet": USER_STATUS.PENDING,
};

function asUserRecord(
  value: unknown,
): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function getUserStatus(
  userDetails: Record<string, unknown> | null | undefined,
): string {
  return String(userDetails?.status || "").toUpperCase();
}

/** True when this session belongs to an admin-suspended account. */
export function isAccountSuspended(
  userDetails: Record<string, unknown> | null | undefined,
): boolean {
  if (getUserStatus(userDetails) !== USER_STATUS.SUSPENDED) return false;
  return Boolean(userDetails?.isAuth || userDetails?._id);
}

export function restrictionStatusFromApiMessage(
  message?: string,
): UserStatus | null {
  if (!message) return null;
  return API_MESSAGE_TO_STATUS[message] || null;
}

/** Persist account status on the user atom (also writes AsyncStorage via atomWithStorage). */
export function persistUserStatus(status: UserStatus): void {
  const store = getDefaultStore();
  const current = asUserRecord(store.get(Atoms.UserAtom));
  if (getUserStatus(current) === status) return;
  store.set(Atoms.UserAtom, { ...current, status });
}

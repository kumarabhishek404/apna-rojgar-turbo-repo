import { getToken } from "@/utils/authStorage";

export function isSessionValid(userDetails: Record<string, unknown> | null | undefined) {
  return Boolean(
    userDetails?.isAuth &&
      userDetails?._id &&
      userDetails?.name &&
      userDetails?.address &&
      userDetails?.age &&
      userDetails?.gender,
  );
}

/** True when the app has an authenticated user in memory (token checked separately). */
export function hasAuthenticatedUser(
  userDetails: Record<string, unknown> | null | undefined,
) {
  return Boolean(userDetails?.isAuth && userDetails?._id);
}

/** True when a stored token exists and the user atom marks the session as authenticated. */
export async function isUserLoggedIn(
  userDetails: Record<string, unknown> | null | undefined,
) {
  const token = await getToken();
  return Boolean(
    token &&
      token !== "null" &&
      token !== "undefined" &&
      hasAuthenticatedUser(userDetails),
  );
}

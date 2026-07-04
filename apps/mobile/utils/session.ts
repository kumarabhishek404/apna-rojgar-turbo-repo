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

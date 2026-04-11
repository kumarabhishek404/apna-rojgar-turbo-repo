/**
 * When true, login/register skip the OTP step and use DEV_OTP_PLACEHOLDER (backend must run with dev OTP bypass).
 * Release builds (__DEV__ false) only skip if EXPO_PUBLIC_SKIP_OTP is explicitly set (e.g. staging vs dev API).
 */
export const DEV_OTP_PLACEHOLDER = "000000";

export function shouldSkipOtpClient(): boolean {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const v = String(process.env.EXPO_PUBLIC_SKIP_OTP || "").toLowerCase().trim();
    if (v === "0" || v === "false" || v === "no") return false;
    return true;
  }
  const v = String(process.env.EXPO_PUBLIC_SKIP_OTP || "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes";
}

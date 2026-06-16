/**
 * When true, login/register skip the OTP step and use DEV_OTP_PLACEHOLDER (backend must run with dev OTP bypass).
 * Release builds always require real OTP (dev bypass is __DEV__ only).
 */
export const DEV_OTP_PLACEHOLDER = "000000";

export function shouldSkipOtpClient(): boolean {
  // Never skip OTP in release builds — avoids shipping EXPO_PUBLIC_SKIP_OTP=true to production.
  if (typeof __DEV__ === "undefined" || !__DEV__) {
    return false;
  }
  const v = String(process.env.EXPO_PUBLIC_SKIP_OTP || "").toLowerCase().trim();
  if (v === "0" || v === "false" || v === "no") return false;
  return true;
}

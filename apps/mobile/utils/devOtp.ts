/**
 * When true, login/register skip the OTP step and use DEV_OTP_PLACEHOLDER (backend must run with dev OTP bypass).
 * Release APKs can skip OTP only when explicitly enabled for a non-production backend.
 */
export const DEV_OTP_PLACEHOLDER = "000000";

export function shouldSkipOtpClient(): boolean {
  const v = String(process.env.EXPO_PUBLIC_SKIP_OTP || "").toLowerCase().trim();
  if (v === "0" || v === "false" || v === "no") return false;

  // Expo public env values are baked into APKs, so never allow OTP skip against production API.
  const baseUrl = String(process.env.EXPO_PUBLIC_BASE_URL || "").toLowerCase();
  if (baseUrl.includes("api.apnarojgarindia.com")) {
    return false;
  }

  if (v === "1" || v === "true" || v === "yes") return true;

  // Keep the existing local development convenience.
  if (typeof __DEV__ !== "undefined" && __DEV__) return true;

  return false;
}

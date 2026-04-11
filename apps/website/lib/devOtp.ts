/**
 * One-shot login in dev: no SMS step; uses placeholder OTP (backend must allow dev bypass).
 * Production builds never skip OTP here — real /auth/login send + verify flow.
 */
export const DEV_OTP_PLACEHOLDER = "000000";

export function shouldSkipOtpClient(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const v = String(process.env.NEXT_PUBLIC_SKIP_OTP || "").toLowerCase().trim();
  if (v === "0" || v === "false" || v === "no") return false;
  if (v === "1" || v === "true" || v === "yes") return true;
  return process.env.NODE_ENV === "development";
}

/**
 * Dev OTP bypass: only when Next runs in development and the API base URL points at a
 * local/private backend (where NODE_ENV=development + DEV_BYPASS_OTP can accept 000000).
 *
 * `next dev` with the default production API URL must use real SMS OTP — never send a
 * placeholder to the public API.
 */
export const DEV_OTP_PLACEHOLDER = "000000";

function hostnameIsLocalOrPrivate(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/**
 * True when NEXT_PUBLIC_API_BASE_URL is set to a local/LAN API (safe for dev OTP bypass).
 * Unset means auth.ts falls back to the public API — not safe to bypass.
 */
export function isApiBaseUrlLocalDev(): boolean {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return false;
  try {
    return hostnameIsLocalOrPrivate(new URL(raw).hostname);
  } catch {
    return false;
  }
}

export function shouldSkipOtpClient(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const v = String(process.env.NEXT_PUBLIC_SKIP_OTP || "").toLowerCase().trim();
  if (v === "0" || v === "false" || v === "no") {
    return false;
  }
  if (v === "1" || v === "true" || v === "yes") {
    return isApiBaseUrlLocalDev();
  }
  return process.env.NODE_ENV === "development" && isApiBaseUrlLocalDev();
}

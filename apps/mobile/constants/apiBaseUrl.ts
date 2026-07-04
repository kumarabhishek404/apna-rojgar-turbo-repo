/**
 * Production API — same default as the website (`NEXT_PUBLIC_API_BASE_URL` fallback).
 * Play Store / release builds must always hit production even if EAS env was missing
 * or an old host (Render/Railway/LAN) was baked into a previous binary.
 */
export const DEFAULT_API_BASE_URL =
  "https://api.apnarojgarindia.com/api/v1";

function isLocalOrPrivateHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "10.0.2.2") {
      return true;
    }
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");

  // Expo Go / dev client: allow LAN or custom backend from .env
  if (typeof __DEV__ !== "undefined" && __DEV__ && fromEnv) {
    return fromEnv;
  }

  // Play Store / release: always production (ignore stale Render/Railway/LAN URLs)
  if (fromEnv?.includes("api.apnarojgarindia.com")) {
    return fromEnv;
  }
  if (fromEnv && isLocalOrPrivateHost(fromEnv)) {
    return DEFAULT_API_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
}

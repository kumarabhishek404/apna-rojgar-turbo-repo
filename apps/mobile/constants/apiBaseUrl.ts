/**
 * Production API — same default as the website (`NEXT_PUBLIC_API_BASE_URL` fallback).
 * Play Store / release builds must always hit production even if EAS env was missing
 * or an old host (Render/Railway/LAN) was baked into a previous binary.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

export const DEFAULT_API_BASE_URL =
  "https://api.apnarojgarindia.com/api/v1";

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "10.0.2.2") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function isAndroidEmulator(): boolean {
  return Platform.OS === "android" && Constants.isDevice === false;
}

/**
 * Android emulator cannot reliably reach the host Mac via LAN IP in some AVD
 * images. Map loopback / private LAN → 10.0.2.2 (emulator alias for host).
 */
function rewriteDevUrlForAndroidEmulator(url: string): string {
  if (!isAndroidEmulator()) return url;
  try {
    const parsed = new URL(url);
    if (!isLocalOrPrivateHost(parsed.hostname)) return url;
    if (parsed.hostname === "10.0.2.2") return url.replace(/\/$/, "");
    parsed.hostname = "10.0.2.2";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");

  // Expo Go / dev client: allow LAN or custom backend from .env
  if (typeof __DEV__ !== "undefined" && __DEV__ && fromEnv) {
    return rewriteDevUrlForAndroidEmulator(fromEnv);
  }

  // Play Store / release: always production (ignore stale Render/Railway/LAN URLs)
  if (fromEnv?.includes("api.apnarojgarindia.com")) {
    return fromEnv;
  }
  if (fromEnv) {
    try {
      if (isLocalOrPrivateHost(new URL(fromEnv).hostname)) {
        return DEFAULT_API_BASE_URL;
      }
    } catch {
      // ignore malformed env
    }
  }

  return DEFAULT_API_BASE_URL;
}

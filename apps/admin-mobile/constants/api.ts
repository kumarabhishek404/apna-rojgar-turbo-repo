/**
 * Production API — same database the website and customer app use.
 * A release build always uses production, even if a LAN address was baked in.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

export const DEFAULT_API_BASE_URL = "https://api.apnarojgarindia.com/api/v1";

function isLocalOrPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "10.0.2.2") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function rewriteDevUrlForAndroidEmulator(url: string) {
  const emulator = Platform.OS === "android" && Constants.isDevice === false;
  if (!emulator) return url;
  try {
    const parsed = new URL(url);
    if (!isLocalOrPrivateHost(parsed.hostname) || parsed.hostname === "10.0.2.2") {
      return url.replace(/\/$/, "");
    }
    parsed.hostname = "10.0.2.2";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");

  if (typeof __DEV__ !== "undefined" && __DEV__ && fromEnv) {
    return rewriteDevUrlForAndroidEmulator(fromEnv);
  }

  if (fromEnv?.includes("api.apnarojgarindia.com")) return fromEnv;
  if (fromEnv) {
    try {
      if (isLocalOrPrivateHost(new URL(fromEnv).hostname)) return DEFAULT_API_BASE_URL;
    } catch {
      // Ignore a malformed env value and use production.
    }
  }

  return DEFAULT_API_BASE_URL;
}

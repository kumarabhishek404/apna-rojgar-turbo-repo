import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/utils/authStorage";
import {
  getClientDeviceHeaders,
  getClientDeviceInfo,
} from "@/utils/clientDeviceInfo";
import { getApiBaseUrl } from "@/constants/apiBaseUrl";

type ReportErrorInput = {
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  statusCode?: number;
  errorName?: string;
  errorCode?: string | number;
  context?: Record<string, unknown>;
  /** Optional user fields when AsyncStorage user is incomplete (e.g. login OTP). */
  user?: Record<string, unknown> | null;
};

const SENSITIVE_KEYS = new Set([
  "password",
  "pass",
  "token",
  "authorization",
  "otp",
  "code",
  "refreshToken",
  "accessToken",
  "secret",
  "apiKey",
  "apikey",
  "emailPass",
  "EMAIL_PASS",
]);

const reportedKeys = new Set<string>();
const MAX_JSON_CHARS = 12000;

function isNoiseError({
  message,
  errorName,
  errorCode,
  statusCode,
}: {
  message: string;
  errorName?: string;
  errorCode?: string | number;
  statusCode?: number;
}) {
  const text = `${message} ${errorName || ""} ${errorCode || ""}`;
  if (
    /ERR_NETWORK|Network Error|network request failed|Failed to fetch/i.test(text)
  ) {
    return true;
  }
  if (
    Number(statusCode) === 0 ||
    String(errorCode) === "ERR_NETWORK" ||
    String(errorCode) === "NETWORK_ERROR"
  ) {
    return true;
  }
  if (
    /PAY_PER_DAY_TOO_LOW|PAY_PER_DAY_REQUIRED|pay per day must be at least/i.test(
      text,
    )
  ) {
    return true;
  }
  return false;
}

export function sanitizeForErrorLog(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 5) return "[max-depth]";
  if (typeof value === "string") {
    return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeForErrorLog(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = sanitizeForErrorLog(nested, depth + 1);
    }
    try {
      const json = JSON.stringify(out);
      if (json.length > MAX_JSON_CHARS) {
        return { truncated: true, preview: json.slice(0, MAX_JSON_CHARS) };
      }
    } catch {
      return { unserializable: true };
    }
    return out;
  }
  return String(value);
}

async function getStoredUserSnapshot(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (!raw || raw === "null" || raw === "{}") return null;
    const u = JSON.parse(raw);
    if (!u || typeof u !== "object") return null;

    const id = u._id ?? u.id ?? null;
    const email =
      typeof u.email === "object" && u.email != null
        ? u.email.value ?? null
        : u.email ?? null;
    const locale =
      typeof u.locale === "object" && u.locale != null
        ? u.locale.language ?? null
        : u.locale ?? null;

    const snapshot = {
      id: id != null ? String(id) : null,
      name: u.name ?? null,
      mobile: u.mobile ?? null,
      countryCode: u.countryCode ?? null,
      role: u.role ?? null,
      email: email ?? null,
      locale: locale ?? null,
      status: u.status ?? null,
    };

    const hasAny = Object.values(snapshot).some(
      (v) => v != null && String(v).trim() !== "",
    );
    return hasAny ? snapshot : null;
  } catch {
    return null;
  }
}

function mergeUserSnapshots(
  stored: Record<string, unknown> | null,
  override: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!stored && !override) return null;
  const a = stored || {};
  const b = override || {};
  const merged: Record<string, unknown> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    if (value == null || value === "") continue;
    merged[key] = value;
  }
  return Object.keys(merged).length ? merged : null;
}

/**
 * Report an app/API/runtime error to the backend ErrorLog collection.
 * Always attaches available user + device details.
 */
const reportError = async ({
  message,
  stack,
  componentStack,
  route,
  statusCode = 500,
  errorName,
  errorCode,
  context,
  user: userOverride,
}: ReportErrorInput) => {
  const baseUrl = getApiBaseUrl();
  const safeMessage = String(message || "Unknown error").trim() || "Unknown error";

  if (
    isNoiseError({
      message: safeMessage,
      errorName,
      errorCode,
      statusCode,
    })
  ) {
    return;
  }

  const dedupeKey = `${route || "unknown"}:${statusCode}:${safeMessage}`.slice(
    0,
    220,
  );
  if (reportedKeys.has(dedupeKey)) {
    return;
  }
  reportedKeys.add(dedupeKey);

  try {
    const [token, storedUser] = await Promise.all([
      getToken(),
      getStoredUserSnapshot(),
    ]);
    const deviceInfo = getClientDeviceInfo();
    const user = mergeUserSnapshots(storedUser, userOverride);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getClientDeviceHeaders(),
    };

    if (token && token !== "null" && token !== "undefined") {
      headers.Authorization = `Bearer ${token}`;
    }

    const payload = {
      source: "mobile" as const,
      message: safeMessage,
      stack: stack || undefined,
      componentStack: componentStack || undefined,
      route: route || "unknown-screen",
      statusCode,
      errorName: errorName || undefined,
      errorCode: errorCode != null ? String(errorCode) : undefined,
      reportedAt: new Date().toISOString(),
      user: user || undefined,
      device: {
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        deviceModel: deviceInfo.deviceModel,
        deviceManufacturer: deviceInfo.deviceManufacturer,
        locale: deviceInfo.locale,
        timezone: deviceInfo.timezone,
        expoRuntimeVersion: deviceInfo.expoRuntimeVersion,
        nativeBuildVersion: deviceInfo.nativeBuildVersion,
        appName: deviceInfo.appName,
        isPhysicalDevice: deviceInfo.isPhysicalDevice,
      },
      context: sanitizeForErrorLog({
        ...(context || {}),
        appVersion: deviceInfo.appVersion,
        platform: deviceInfo.platform,
      }),
    };

    await fetch(`${baseUrl}/errors/report`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (__DEV__) {
      console.warn("[reportError] Failed to report error", error);
    }
  }
};

export default reportError;

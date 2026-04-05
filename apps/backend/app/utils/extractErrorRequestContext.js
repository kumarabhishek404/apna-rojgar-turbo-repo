import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const SENSITIVE_HEADER = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
]);

/**
 * Client IP (first hop if behind proxy).
 */
export function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  const realIp = req.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp.trim();
  }
  return req.ip || null;
}

function header(req, name) {
  if (!req?.headers) return undefined;
  const v = req.get?.(name) ?? req.headers[name.toLowerCase()];
  if (v == null) return undefined;
  return Array.isArray(v) ? v.join(", ") : String(v);
}

/** First non-empty header among candidate names (Express lowercases keys). */
function firstHeader(req, names) {
  for (const name of names) {
    const v = header(req, name);
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

export function parseClientPhysicalDevice(v) {
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return null;
}

/**
 * Device fields from the shared mobile axios client (`X-Client-*`) with legacy `x-*` fallbacks.
 * Use for error logs and as envelope fallbacks for analytics when the JSON body omits fields.
 */
export function getClientStackHeaders(req) {
  if (!req) {
    return {
      platform: undefined,
      appVersion: undefined,
      osVersion: undefined,
      deviceModel: undefined,
      deviceManufacturer: undefined,
      locale: undefined,
      timezone: undefined,
      nativeBuildVersion: undefined,
      expoRuntimeVersion: undefined,
      appName: undefined,
      isPhysicalDevice: null,
    };
  }

  return {
    platform: firstHeader(req, ["x-client-platform", "x-platform"]),
    appVersion: firstHeader(req, ["x-client-app-version", "x-app-version"]),
    osVersion: firstHeader(req, ["x-client-os-version", "x-os-version"]),
    deviceModel: firstHeader(req, ["x-client-device-model", "x-device-model"]),
    deviceManufacturer: firstHeader(req, [
      "x-client-device-manufacturer",
      "x-device-manufacturer",
    ]),
    locale: firstHeader(req, ["x-client-locale", "x-locale"]),
    timezone: firstHeader(req, ["x-client-timezone", "x-timezone"]),
    nativeBuildVersion: firstHeader(req, [
      "x-client-native-build",
      "x-native-build-version",
    ]),
    expoRuntimeVersion: firstHeader(req, [
      "x-client-expo-runtime-version",
      "x-expo-runtime-version",
    ]),
    appName: firstHeader(req, ["x-client-app-name", "x-app-name"]),
    isPhysicalDevice: parseClientPhysicalDevice(
      firstHeader(req, ["x-client-physical-device", "x-is-physical-device"]),
    ),
  };
}

/**
 * Structured device/client fields from common mobile + Expo-style headers.
 */
export function extractDeviceSnapshot(req) {
  if (!req) {
    return { device: {}, clientHeaders: {} };
  }

  const hdrs = getClientStackHeaders(req);
  const rawUa = header(req, "user-agent") || "";
  const ip = getClientIp(req);

  const device = {
    ip: ip || null,
    userAgent: rawUa || null,
    platform: hdrs.platform ?? null,
    osVersion: hdrs.osVersion ?? null,
    appVersion: hdrs.appVersion ?? null,
    deviceModel: hdrs.deviceModel ?? null,
    deviceManufacturer: hdrs.deviceManufacturer ?? null,
    locale: hdrs.locale ?? null,
    timezone: hdrs.timezone ?? null,
    expoRuntimeVersion: hdrs.expoRuntimeVersion ?? null,
    nativeBuildVersion: hdrs.nativeBuildVersion ?? null,
    appName: hdrs.appName ?? null,
    sessionId: firstHeader(req, ["x-session-id"]) || null,
    isPhysicalDevice: hdrs.isPhysicalDevice,
    forwardedFor:
      typeof req.headers?.["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"]
        : Array.isArray(req.headers?.["x-forwarded-for"])
          ? req.headers["x-forwarded-for"].join(", ")
          : null,
  };

  /** Safe subset of headers for debugging (no auth secrets). */
  const clientHeaders = {};
  const h = req.headers || {};
  for (const [key, val] of Object.entries(h)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_HEADER.has(lower)) continue;
    if (
      lower === "user-agent" ||
      lower === "accept-language" ||
      lower === "accept" ||
      lower.startsWith("x-")
    ) {
      clientHeaders[lower] = Array.isArray(val) ? val.join(", ") : val;
    }
  }

  return { device, clientHeaders };
}

/**
 * User snapshot from `req.user` (Mongoose doc or plain object), plus unverified JWT subject when user is not loaded.
 */
export function extractUserSnapshot(req) {
  const emptyUser = {
    id: null,
    name: null,
    mobile: null,
    countryCode: null,
    role: null,
    email: null,
    locale: null,
  };

  const u = req?.user;
  if (u && (u._id || u.id)) {
    const id = u._id ?? u.id;
    return {
      user: {
        id: mongoose.isValidObjectId(id) ? id : null,
        name: u.name ?? "",
        mobile: u.mobile ?? "",
        countryCode: u.countryCode ?? "",
        role: u.role ?? "",
        email: typeof u.email?.value === "string" ? u.email.value : "",
        locale: u.locale?.language ?? "",
      },
      tokenSubjectUserId: null,
    };
  }

  let tokenSubjectUserId = null;
  const auth = req?.headers?.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      try {
        const decoded = jwt.decode(token, { complete: false });
        const sub = decoded?._id ?? decoded?.sub ?? decoded?.id ?? decoded?.userId;
        if (sub != null && mongoose.isValidObjectId(String(sub))) {
          tokenSubjectUserId = new mongoose.Types.ObjectId(String(sub));
        }
      } catch {
        /* ignore */
      }
    }
  }

  return {
    user: emptyUser,
    tokenSubjectUserId,
  };
}

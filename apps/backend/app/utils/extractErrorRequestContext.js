import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";

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

function emptyUserSnapshot() {
  return {
    id: null,
    name: null,
    mobile: null,
    countryCode: null,
    role: null,
    email: null,
    locale: null,
    status: null,
  };
}

function normalizeUserId(value) {
  if (value == null || value === "") return null;
  const id = String(value);
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;
}

function pickString(...values) {
  for (const value of values) {
    if (value == null) continue;
    const s = String(value).trim();
    if (s) return s;
  }
  return null;
}

/**
 * Normalize a partial user object from req.user, client body, or DB doc.
 */
export function normalizeUserSnapshot(raw) {
  const base = emptyUserSnapshot();
  if (!raw || typeof raw !== "object") return base;

  const id = normalizeUserId(raw.id ?? raw._id ?? raw.userId);
  const email =
    typeof raw.email === "object" && raw.email != null
      ? pickString(raw.email.value, raw.email.address)
      : pickString(raw.email);
  const locale =
    typeof raw.locale === "object" && raw.locale != null
      ? pickString(raw.locale.language, raw.locale)
      : pickString(raw.locale);

  return {
    id,
    name: pickString(raw.name) ?? null,
    mobile: pickString(raw.mobile, raw.phone) ?? null,
    countryCode: pickString(raw.countryCode) ?? null,
    role: pickString(raw.role) ?? null,
    email: email ?? null,
    locale: locale ?? null,
    status: pickString(raw.status) ?? null,
  };
}

/** Prefer non-empty fields from `override` over `base`. */
export function mergeUserSnapshots(base, override) {
  const a = normalizeUserSnapshot(base);
  const b = normalizeUserSnapshot(override);
  return {
    id: b.id || a.id || null,
    name: b.name || a.name || null,
    mobile: b.mobile || a.mobile || null,
    countryCode: b.countryCode || a.countryCode || null,
    role: b.role || a.role || null,
    email: b.email || a.email || null,
    locale: b.locale || a.locale || null,
    status: b.status || a.status || null,
  };
}

export function mergeDeviceSnapshots(base, override) {
  const a = base && typeof base === "object" ? base : {};
  const b = override && typeof override === "object" ? override : {};
  const merged = { ...a };

  for (const [key, value] of Object.entries(b)) {
    if (key === "extras") continue;
    if (value == null || value === "") continue;
    merged[key] = value;
  }

  const extrasA =
    a.extras && typeof a.extras === "object" && !Array.isArray(a.extras)
      ? a.extras
      : {};
  const extrasB =
    b.extras && typeof b.extras === "object" && !Array.isArray(b.extras)
      ? b.extras
      : {};
  const extras = { ...extrasA, ...extrasB };
  if (Object.keys(extras).length > 0) {
    merged.extras = extras;
  }

  return merged;
}

async function hydrateUserFromDb(user) {
  const id = user?.id;
  if (!id) return user;

  const needsHydration =
    !user.name || !user.mobile || !user.role || !user.email || !user.status;
  if (!needsHydration) return user;

  try {
    const doc = await User.findById(id)
      .select("name mobile countryCode role email locale status")
      .lean();
    if (!doc) return user;
    return mergeUserSnapshots(user, doc);
  } catch {
    return user;
  }
}

/**
 * User snapshot from `req.user` (Mongoose doc or plain object), optional client
 * override, plus JWT subject when user is not loaded. Hydrates from DB when only id is known.
 */
export async function extractUserSnapshot(req, userOverride = null) {
  let tokenSubjectUserId = null;
  let user = emptyUserSnapshot();

  const u = req?.user;
  if (u && (u._id || u.id)) {
    user = normalizeUserSnapshot(u);
  } else {
    const auth = req?.headers?.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        try {
          const decoded = jwt.decode(token, { complete: false });
          const sub =
            decoded?._id ?? decoded?.sub ?? decoded?.id ?? decoded?.userId;
          if (sub != null && mongoose.isValidObjectId(String(sub))) {
            tokenSubjectUserId = new mongoose.Types.ObjectId(String(sub));
            user = normalizeUserSnapshot({ id: tokenSubjectUserId });
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  if (userOverride) {
    user = mergeUserSnapshots(user, userOverride);
  }

  user = await hydrateUserFromDb(user);

  if (!tokenSubjectUserId && user.id) {
    tokenSubjectUserId = null;
  }

  return {
    user,
    tokenSubjectUserId,
  };
}

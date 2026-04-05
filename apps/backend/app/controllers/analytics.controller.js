import mongoose from "mongoose";
import AppEvent from "../models/appEvent.model.js";
import logError from "../utils/addErrorLog.js";
import { getClientStackHeaders } from "../utils/extractErrorRequestContext.js";

function parseUserId(req) {
  const raw = req.user?._id;
  if (raw == null) return null;
  if (raw instanceof mongoose.Types.ObjectId) return raw;
  if (mongoose.Types.ObjectId.isValid(String(raw))) {
    return new mongoose.Types.ObjectId(String(raw));
  }
  return null;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  return req.ip || null;
}

function normalizePlatform(value) {
  if (value == null || value === "") return undefined;
  const v = String(value).toLowerCase();
  if (["ios", "android", "web"].includes(v)) return v;
  return undefined;
}

/** Prefer JSON body; fall back to `X-Client-*` / legacy `x-*` headers from the shared API client. */
function mergeNullableStr(bodyVal, hdrVal) {
  if (bodyVal !== undefined && bodyVal !== null && String(bodyVal).trim() !== "") {
    return String(bodyVal);
  }
  if (hdrVal != null && String(hdrVal).trim() !== "") return String(hdrVal);
  return null;
}

export const postBatch = async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.sessionId || !Array.isArray(body.events) || body.events.length === 0) {
      return res.status(400).json({ message: "Invalid batch payload" });
    }

    const userId = parseUserId(req);
    const now = new Date();
    const ip = clientIp(req);
    const userAgent = req.headers["user-agent"] || null;

    const hdr = getClientStackHeaders(req);
    const platform = normalizePlatform(body.platform ?? hdr.platform);
    const env = {
      appVersion: mergeNullableStr(body.appVersion, hdr.appVersion),
      osVersion: mergeNullableStr(body.osVersion, hdr.osVersion),
      deviceModel: mergeNullableStr(body.deviceModel, hdr.deviceModel),
      deviceManufacturer: mergeNullableStr(body.deviceManufacturer, hdr.deviceManufacturer),
      isPhysicalDevice: body.isPhysicalDevice ?? hdr.isPhysicalDevice ?? null,
      locale: mergeNullableStr(body.locale, hdr.locale),
      timezone: mergeNullableStr(body.timezone, hdr.timezone),
      nativeBuildVersion: mergeNullableStr(body.nativeBuildVersion, hdr.nativeBuildVersion),
      expoRuntimeVersion: mergeNullableStr(body.expoRuntimeVersion, hdr.expoRuntimeVersion),
      appName: mergeNullableStr(body.appName, hdr.appName),
    };

    const docs = [];
    for (const ev of body.events) {
      if (!ev || typeof ev.name !== "string" || !ev.name.trim()) {
        return res.status(400).json({ message: "Invalid batch payload" });
      }
      const clientTs = new Date(ev.clientTimestamp);
      if (Number.isNaN(clientTs.getTime())) {
        return res.status(400).json({ message: "Invalid clientTimestamp" });
      }

      let properties = {};
      if (ev.properties != null && typeof ev.properties === "object" && !Array.isArray(ev.properties)) {
        properties = ev.properties;
      }

      const batchSentAt = body.batchSentAt != null && body.batchSentAt !== ""
        ? new Date(body.batchSentAt)
        : null;
      const batchSentAtValid = batchSentAt && !Number.isNaN(batchSentAt.getTime()) ? batchSentAt : null;

      const doc = {
        userId,
        sessionId: body.sessionId,
        ...(platform !== undefined ? { platform } : {}),
        appVersion: env.appVersion,
        osVersion: env.osVersion,
        deviceModel: env.deviceModel,
        deviceManufacturer: env.deviceManufacturer,
        isPhysicalDevice: env.isPhysicalDevice,
        locale: env.locale,
        timezone: env.timezone,
        nativeBuildVersion: env.nativeBuildVersion,
        expoRuntimeVersion: env.expoRuntimeVersion,
        appName: env.appName,

        eventName: ev.name.trim(),
        properties,

        clientTimestamp: clientTs,
        batchSentAt: batchSentAtValid,
        serverTimestamp: now,

        ip,
        userAgent,
      };
      docs.push(doc);
    }

    await AppEvent.insertMany(docs, { ordered: false });

    return res.status(200).json({ ok: true, inserted: docs.length });
  } catch (err) {
    console.error("[analytics] postBatch", err);
    logError(err, req, 500, "analytics postBatch");
    return res.status(500).json({ message: "Server error" });
  }
};

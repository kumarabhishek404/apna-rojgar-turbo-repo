import ErrorLog from "../models/errors.model.js";
import {
  extractDeviceSnapshot,
  extractUserSnapshot,
  mergeDeviceSnapshots,
} from "./extractErrorRequestContext.js";
import notifyAdminOnError from "./notifyAdminOnError.js";
import { shouldSkipErrorLog } from "./skipErrorLog.js";

const MAX_CONTEXT_CHARS = 20000;

function clampContext(value) {
  if (value == null) return {};
  if (typeof value !== "object") {
    return { value: String(value).slice(0, 1000) };
  }
  try {
    const json = JSON.stringify(value);
    if (json.length <= MAX_CONTEXT_CHARS) return value;
    return {
      truncated: true,
      preview: json.slice(0, MAX_CONTEXT_CHARS),
    };
  } catch {
    return { unserializable: true };
  }
}

/**
 * Logs an error to the database with user and client device context.
 * @param {Object} error - The error object (from catch block)
 * @param {Object} req - The Express request object (optional)
 * @param {Number} statusCode - The response status code (default: 500)
 * @param {String} identifier - Custom identifier for logging (fallback for missing request info)
 * @param {Object} options - Additional logging options
 * @param {"backend"|"mobile"|"website"} [options.source]
 * @param {String} [options.componentStack]
 * @param {Boolean} [options.skipAdminNotify]
 * @param {Object} [options.userOverride] - Client-provided user snapshot fields
 * @param {Object} [options.deviceOverride] - Client-provided device snapshot fields
 * @param {Object} [options.context] - Extra structured error context
 * @param {Object} [options.requestBodyOverride] - Body stored on the log (sanitized)
 * @param {String} [options.errorName]
 * @param {String|Number} [options.errorCode]
 */
const logError = async (
  error,
  req = null,
  statusCode = 500,
  identifier = "Unknown Identifier",
  options = {},
) => {
  const message = String(error?.message || "");
  const isClientAuthNoise =
    /invalid signature|jwt malformed|jwt must be provided|invalid token|token expired|login expired/i.test(
      message,
    ) ||
    ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
      error?.name,
    );

  // Stale/wrong tokens are expected client issues — do not flood ErrorLog/admin.
  if (isClientAuthNoise) {
    console.warn("[ErrorLog] Skipped client auth noise:", message);
    return;
  }

  const {
    source = "backend",
    componentStack,
    skipAdminNotify = false,
    userOverride = null,
    deviceOverride = null,
    context = null,
    requestBodyOverride = undefined,
    errorName = null,
    errorCode = null,
  } = options;

  if (
    shouldSkipErrorLog({
      error,
      statusCode,
      errorCode,
      errorName,
      message,
    })
  ) {
    console.warn("[ErrorLog] Skipped expected/client noise:", message);
    return;
  }

  try {
    const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const method =
      source !== "backend"
        ? "CLIENT"
        : httpMethods.includes(req?.method)
          ? req.method
          : "GET";

    const { device: headerDevice, clientHeaders } = extractDeviceSnapshot(req);
    const device = mergeDeviceSnapshots(headerDevice, deviceOverride);
    const { user, tokenSubjectUserId } = await extractUserSnapshot(
      req,
      userOverride,
    );

    const resolvedErrorName =
      errorName ||
      error?.name ||
      (typeof error?.constructor?.name === "string"
        ? error.constructor.name
        : null);
    const resolvedErrorCode =
      errorCode != null
        ? String(errorCode)
        : error?.code != null
          ? String(error.code)
          : error?.errorCode != null
            ? String(error.errorCode)
            : null;

    const requestBody =
      requestBodyOverride !== undefined
        ? requestBodyOverride && typeof requestBodyOverride === "object"
          ? requestBodyOverride
          : {}
        : req?.body && typeof req.body === "object"
          ? req.body
          : {};

    const mergedContext = {
      ...(context && typeof context === "object" ? context : {}),
      ...(error?.providerDetail
        ? { providerDetail: String(error.providerDetail).slice(0, 300) }
        : {}),
      ...(error?.statusCode != null ? { errorStatusCode: error.statusCode } : {}),
    };

    const errorEntry = new ErrorLog({
      message: error?.message || "Unknown Error",
      stack: error?.stack || "No stack available",
      errorName: resolvedErrorName || undefined,
      errorCode: resolvedErrorCode || undefined,
      source,
      componentStack: componentStack || undefined,
      apiRoute: req?.originalUrl || identifier || "Unknown Route",
      method,
      requestBody,
      requestParams: req?.params || {},
      requestQuery: req?.query || {},
      statusCode,
      context: clampContext(mergedContext),
      user,
      tokenSubjectUserId: tokenSubjectUserId || undefined,
      device,
      clientHeaders,
    });

    await errorEntry.save();
    console.error("✅ Error logged successfully:", errorEntry._id);

    if (!skipAdminNotify) {
      await notifyAdminOnError({
        message: errorEntry.message,
        source: errorEntry.source,
        route: errorEntry.apiRoute,
        errorLogId: errorEntry._id,
      });
    }
  } catch (logErr) {
    console.error("❌ Failed to log error:", logErr);
  }
};

export default logError;

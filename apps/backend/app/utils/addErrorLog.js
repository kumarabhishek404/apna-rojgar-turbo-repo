import ErrorLog from "../models/errors.model.js";
import {
  extractDeviceSnapshot,
  extractUserSnapshot,
} from "./extractErrorRequestContext.js";

/**
 * Logs an error to the database with user and client device context.
 * @param {Object} error - The error object (from catch block)
 * @param {Object} req - The Express request object (optional)
 * @param {Number} statusCode - The response status code (default: 500)
 * @param {String} identifier - Custom identifier for logging (fallback for missing request info)
 */
const logError = async (
  error,
  req = null,
  statusCode = 500,
  identifier = "Unknown Identifier",
) => {
  console.log("Logging error:", { error, req, statusCode, identifier });

  try {
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const method = validMethods.includes(req?.method) ? req.method : "GET";

    const { device, clientHeaders } = extractDeviceSnapshot(req);
    const { user, tokenSubjectUserId } = extractUserSnapshot(req);

    const errorEntry = new ErrorLog({
      message: error?.message || "Unknown Error",
      stack: error?.stack || "No stack available",
      apiRoute: req?.originalUrl || identifier || "Unknown Route",
      method,
      requestBody: req?.body && typeof req.body === "object" ? req.body : {},
      requestParams: req?.params || {},
      requestQuery: req?.query || {},
      statusCode,
      user,
      tokenSubjectUserId: tokenSubjectUserId || undefined,
      device,
      clientHeaders,
    });

    await errorEntry.save();
    console.error("✅ Error logged successfully:", errorEntry._id);
  } catch (logErr) {
    console.error("❌ Failed to log error:", logErr);
  }
};

export default logError;

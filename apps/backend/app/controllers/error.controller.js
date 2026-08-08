import ErrorLog from "../models/errors.model.js";
import logError from "../utils/addErrorLog.js";

export const getAllErrors = async (req, res) => {
  try {
    const errors = await ErrorLog.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, errors });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve errors",
      error: error.message,
    });
  }
};

const CLIENT_SOURCES = new Set(["mobile", "website"]);

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

export const reportClientError = async (req, res) => {
  try {
    const body = req.body || {};
    const message = String(body.message || "").trim();
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Error message is required",
      });
    }

    const source = String(body.source || "").trim().toLowerCase();
    if (!CLIENT_SOURCES.has(source)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source. Use mobile or website.",
      });
    }

    const route =
      String(body.route || body.screen || body.pathname || "").trim() ||
      "unknown-screen";
    const stack = String(body.stack || "").trim() || "No stack available";
    const componentStack = String(body.componentStack || "").trim() || undefined;
    const statusCode = Number(body.statusCode) || 500;
    const errorName = body.errorName != null ? String(body.errorName) : null;
    const errorCode =
      body.errorCode != null && String(body.errorCode).trim()
        ? String(body.errorCode).trim()
        : null;

    const userOverride = asObject(body.user);
    const deviceOverride = asObject(body.device);
    const context = asObject(body.context) || {};

    // Prefer explicit request payload from context; never store the whole report envelope.
    const requestBodyOverride =
      asObject(context.requestBody) ||
      asObject(context.request) ||
      asObject(body.requestBody) ||
      {};

    const syntheticError = new Error(message);
    syntheticError.stack = stack;
    if (errorName) syntheticError.name = errorName;
    if (errorCode) syntheticError.code = errorCode;

    req.originalUrl = route;
    req.method = "CLIENT";

    await logError(syntheticError, req, statusCode, route, {
      source,
      componentStack,
      userOverride,
      deviceOverride,
      context: {
        ...context,
        reportedAt: body.reportedAt || new Date().toISOString(),
        clientSource: source,
      },
      requestBodyOverride,
      errorName,
      errorCode,
    });

    return res.status(200).json({ success: true, message: "Error reported" });
  } catch (error) {
    logError(error, req, 500, "errors/report", {
      source: "backend",
      skipAdminNotify: true,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to report error",
    });
  }
};

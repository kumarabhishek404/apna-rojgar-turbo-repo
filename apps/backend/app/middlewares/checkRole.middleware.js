import logError from "../utils/addErrorLog.js";
import { userHasAdminAccess } from "../utils/functions.js";

const checkAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    // Prefer role === ADMIN; keep ADMIN_MOBILE as a production bridge.
    if (userHasAdminAccess(req.user)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied: Admin role required.",
    });
  } catch (error) {
    logError(error, req, 500, "middleware - checkAdmin");
    console.error("⚠️ [Admin Check] Error in checkAdmin middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default checkAdmin;

import logError from "../utils/addErrorLog.js";

export const isAdmin = async (req, res, next) => {
  try {
    // Check if user exists in request (should be set by verifyToken middleware)
    if (!req.user) {
      console.log("🚫 [Admin Check] Unauthorized - No user found in request.");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    // Check if user is ADMIN
    if (req.user.role !== "ADMIN") {
      console.log(
        `🚫 [Admin Check] Access denied for user ${req.user._id} - Not an admin.`
      );
      return res.status(403).json({
        success: false,
        message: "Forbidden - Admin access required",
      });
    }

    console.log(
      `✅ [Admin Check] Admin access granted for user ${req.user._id}.`
    );
    // If user is admin, proceed to next middleware/controller
    next();
  } catch (error) {
    logError(error, req, 500, "middleware - isAdmin");
    console.error("⚠️ [Admin Check] Error checking admin status:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Error checking admin status",
    });
  }
};

import logError from "../utils/addErrorLog.js";

const ADMIN_MOBILE_NUMBER = "6397308499"; // 🔒 Hardcoded admin mobile number

const checkAdmin = (req, res, next) => {
  try {
    const { mobile } = req.user;
    console.log("🔍 [Admin Check] Verifying admin access for mobile:", mobile);

    // ✅ Allow access if the mobile matches the admin number
    if (mobile === ADMIN_MOBILE_NUMBER) {
      console.log("✅ [Admin Check] Access granted to admin.");
      return next();
    }

    // 🚫 Deny access if the mobile does not match
    console.log("🚫 [Admin Check] Access denied: Invalid admin credentials.");
    return res.status(403).json({
      success: false,
      message: "❌ Access denied: Invalid admin credentials.",
    });
  } catch (error) {
    logError(error, req, 500, "middleware - checkAdmin");
    console.error("⚠️ [Admin Check] Error in checkAdmin middleware:", error);
    res.status(500).json({
      success: false,
      message: "❌ Internal Server Error",
    });
  }
};

export default checkAdmin;

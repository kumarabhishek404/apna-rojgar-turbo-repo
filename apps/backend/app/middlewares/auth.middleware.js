import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import logError from "../utils/addErrorLog.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.replace("Bearer ", "");
    console.log(
      "🔑 [Auth] Authorization Header Token:",
      req.headers["authorization"]
    );
    console.log("📌 [Auth] Extracted Token:", token);

    if (!token) {
      console.log("❌ [Auth] No token provided in the request");
      // 401 + explicit code — clients must not treat this like a vague "unauthorized" wipe.
      return res.status(401).json({
        success: false,
        errorCode: "TOKEN_MISSING",
        message: "Authorization token is required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [Auth] Decoded Token:", decodedToken);

    const user = await User.findById(decodedToken._id).select("-password");
    console.log("👤 [Auth] Fetched User:", user);

    if (!user) {
      console.log("🚫 [Auth] Invalid token: User not found");
      return res.status(401).json({
        success: false,
        errorCode: "TOKEN_NOT_VALID",
        message: "Invalid Token",
      });
    }

    req.user = user;
    console.log(
      "🔓 [Auth] Token verification successful. User attached to request:",
      req.user
    );

    next();
  } catch (error) {
    console.error("❌ [Auth] Error during token verification:", error);

    if (error.name === "TokenExpiredError") {
      console.log("⚠️ [Auth] Token has expired. Not logging the error.");
      return res.status(401).json({
        success: false,
        errorCode: "TOKEN_EXPIRED",
        statusText: "TokenExpiredError",
        message: "login expired",
      });
    }

    const jwtClientErrors = ["JsonWebTokenError", "NotBeforeError"];
    if (jwtClientErrors.includes(error.name)) {
      return res.status(401).json({
        success: false,
        errorCode: "TOKEN_NOT_VALID",
        statusText: error.name,
        message: "Invalid Token",
      });
    }

    logError(error, req, 500, "middleware - verifyToken");
    return res.status(500).json({
      success: false,
      errorCode: "SERVER_ERROR",
      message: "Server error while verifying token",
    });
  }
};

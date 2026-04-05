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
      return res.status(400).json({ message: "Unauthorized Request" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [Auth] Decoded Token:", decodedToken);

    const user = await User.findById(decodedToken._id).select("-password");
    console.log("👤 [Auth] Fetched User:", user);

    if (!user) {
      console.log("🚫 [Auth] Invalid token: User not found");
      return res.status(400).json({ message: "Invalid Token" });
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
      return res.status(401).json({ statusText: "TokenExpiredError", message: "login expired" });
    }

    const jwtClientErrors = ["JsonWebTokenError", "NotBeforeError"];
    const logStatus = jwtClientErrors.includes(error.name) ? 401 : 500;
    logError(error, req, logStatus, "middleware - verifyToken");
    return res.status(400).json({ message: "Invalid Token" });
  }
};

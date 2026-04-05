import jwt from "jsonwebtoken";
import config from "../config/auth.config.js";
import db from "../models/index.js";
import logError from "../utils/addErrorLog.js";

const User = db.user;
const Role = db.role;

const verifyToken = (req, res, next) => {
  try {
    console.log("🔑 [Auth] Entering verifyToken middleware");
    let token = req.session.token;
    console.log("📌 [Auth] Extracted Token:", token);

    if (!token) {
      console.log("❌ [Auth] No token provided!");
      return res.status(403).json({ message: "No token provided!" });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        console.log("🚫 [Auth] Token verification failed:", err.message);
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "login expired" });
        }
        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({ message: "login expired" });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("✅ [Auth] Token verified:", decoded);
      req.userId = decoded.id;
      next();
    });
  } catch (error) {
    logError(error, req, 500, "middleware - verifyToken");
    console.error("❌ [Auth] Error during token verification:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const isAdmin = (req, res, next) => {
  try {
    console.log("🔍 [Auth] Checking Admin Role for User ID:", req.userId);

    User.findById(req.userId)
      .then((user) => {
        if (!user) {
          console.log("🚫 [Auth] User not found");
          return res.status(404).send({ message: "User Not Found" });
        }

        Role.find({ _id: { $in: user.roles } })
          .then((roles) => {
            if (roles.some((role) => role.name === "admin")) {
              console.log("✅ [Auth] Admin access granted");
              next();
              return;
            }
            console.log("🚫 [Auth] Access Denied - Admin Role Required");
            res.status(403).send({ message: "Require Admin Role!" });
          })
          .catch((err) => {
            logError(err, req, 500, "middleware - isAdmin");
            console.error("❌ [Auth] Error while finding roles:", err);
            res.status(500).send({ message: "Internal Server Error" });
          });
      })
      .catch((err) => {
        logError(err, req, 500, "middleware - isAdmin");
        console.error("❌ [Auth] Error finding user by ID:", err);
        res.status(500).send({ message: "Internal Server Error" });
      });
  } catch (error) {
    logError(error, req, 500, "middleware - isAdmin");
    console.error("❌ [Auth] Unexpected error in isAdmin:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const isModerator = (req, res, next) => {
  try {
    console.log("🔍 [Auth] Checking Moderator Role for User ID:", req.userId);

    User.findById(req.userId)
      .then((user) => {
        if (!user) {
          console.log("🚫 [Auth] User not found");
          return res.status(404).send({ message: "User Not Found" });
        }

        Role.find({ _id: { $in: user.roles } })
          .then((roles) => {
            if (roles.some((role) => role.name === "moderator")) {
              console.log("✅ [Auth] Moderator access granted");
              next();
              return;
            }
            console.log("🚫 [Auth] Access Denied - Moderator Role Required");
            res.status(403).send({ message: "Require Moderator Role!" });
          })
          .catch((err) => {
            logError(err, req, 500, "middleware - isModerator");
            console.error("❌ [Auth] Error while finding roles:", err);
            res.status(500).send({ message: "Internal Server Error" });
          });
      })
      .catch((err) => {
        logError(err, req, 500, "middleware - isModerator");
        console.error("❌ [Auth] Error finding user by ID:", err);
        res.status(500).send({ message: "Internal Server Error" });
      });
  } catch (error) {
    logError(error, req, 500, "middleware - isModerator");
    console.error("❌ [Auth] Unexpected error in isModerator:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
};

export default authJwt;

import express from "express";
import {
  getAllRequests,
  getAdminAnalyticsEvents,
  getAdminErrorLogs,
  getAdminNotifications,
  getAdminPromotionPayments,
  getAllUsers,
  handleActivateUser,
  handleSuspendUser,
  handleExportRegistrations,
  handleExportServices,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import checkAdmin from "../middlewares/checkRole.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
const router = express.Router();

router.post("/export-registrations", handleExportRegistrations);
router.post("/export-services", handleExportServices);

router.use(verifyToken, userStatus);
router.post("/activate-user", checkAdmin, handleActivateUser);
router.delete("/suspend-user/:userId", checkAdmin, handleSuspendUser);

router.get("/all-users", verifyToken, userStatus, checkAdmin, getAllUsers);
router.get("/error-logs", verifyToken, userStatus, checkAdmin, getAdminErrorLogs);
router.get(
  "/analytics-events",
  verifyToken,
  userStatus,
  checkAdmin,
  getAdminAnalyticsEvents
);
router.get(
  "/notifications",
  verifyToken,
  userStatus,
  checkAdmin,
  getAdminNotifications
);

router.get(
  "/all-requests",
  verifyToken,
  userStatus,
  checkAdmin,
  getAllRequests
);

router.get(
  "/promotion-payments",
  verifyToken,
  userStatus,
  checkAdmin,
  getAdminPromotionPayments
);

export default router;

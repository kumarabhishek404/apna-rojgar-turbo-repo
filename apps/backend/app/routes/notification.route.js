import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getUserNotifications,
  handleUpdateNotificationConsent,
  handleRegisterDeviceController,
  handleMarkAsReadNotification,
  getUnreadNotificationCount,
  handleDeactivateDevices,
  handleNotificationOpened,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/register", handleRegisterDeviceController);
router.get("/all", verifyToken, getUserNotifications);
router.get("/unread-count", verifyToken, getUnreadNotificationCount);
router.put("/update-consent", verifyToken, handleUpdateNotificationConsent);
router.put("/deactivate-devices", verifyToken, handleDeactivateDevices);
router.put("/mark-read", verifyToken, handleMarkAsReadNotification);
router.put("/opened", verifyToken, handleNotificationOpened);

export default router;

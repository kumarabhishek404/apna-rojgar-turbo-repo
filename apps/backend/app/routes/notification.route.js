import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getUserNotifications,
  handleUpdateNotificationConsent,
  handleRegisterDeviceController,
  handleMarkAsReadNotification,
  getUnreadNotificationCount,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/register", handleRegisterDeviceController);
router.get("/all", verifyToken, getUserNotifications);
router.get("/unread-count", verifyToken, getUnreadNotificationCount);
router.put("/update-consent", verifyToken, handleUpdateNotificationConsent);
router.put("/mark-read", verifyToken, handleMarkAsReadNotification);

export default router;

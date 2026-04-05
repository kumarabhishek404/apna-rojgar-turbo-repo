import express from "express";
import {
  submitFeedback,
  getAllFeedback,
} from "../controllers/appFeedback.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import checkAdmin from "../middlewares/checkRole.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";

const router = express.Router();
router.use(verifyToken, userStatus);

// Submit feedback (requires authentication)
router.post("/submit", submitFeedback);

// Get all feedback (admin only)
router.get("/all", checkAdmin, getAllFeedback);

export default router;

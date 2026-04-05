import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import {
  addAttendance,
  getAttendanceReport,
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.use(verifyToken, userStatus);
// ✅ 1. Update Attendance API
router.post("/:serviceId", addAttendance);

// ✅ 2. Get Final Attendance Report API
router.get("/:serviceId/report", getAttendanceReport);

export default router;

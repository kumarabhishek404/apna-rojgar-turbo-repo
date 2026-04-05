import express from "express";
import {
  getAllRequests,
  getAllUsers,
  handleActivateUser,
  handleSuspendUser,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import checkAdmin from "../middlewares/checkRole.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
const router = express.Router();

router.use(verifyToken, userStatus);
router.post("/activate-user", checkAdmin, handleActivateUser);
router.delete("/suspend-user/:userId", checkAdmin, handleSuspendUser);

router.get("/all-users", verifyToken, userStatus, checkAdmin, getAllUsers);

router.get(
  "/all-requests",
  verifyToken,
  userStatus,
  checkAdmin,
  getAllRequests
);

export default router;

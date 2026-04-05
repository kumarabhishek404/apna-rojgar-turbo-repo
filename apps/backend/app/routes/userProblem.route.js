import express from "express";
import {
  submitUserProblem,
  getAllUserProblems,
  completeUserProblem,
  cancelUserProblem,
} from "../controllers/userProblem.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import checkAdmin from "../middlewares/checkRole.middleware.js";

const router = express.Router();
router.post("/submit", submitUserProblem); // POST route

router.get("/all", verifyToken, userStatus, checkAdmin, getAllUserProblems); // GET route

router.patch(
  "/:id/complete",
  verifyToken,
  userStatus,
  checkAdmin,
  completeUserProblem
);

router.patch(
  "/:id/cancel",
  verifyToken,
  userStatus,
  checkAdmin,
  cancelUserProblem
);

export default router;

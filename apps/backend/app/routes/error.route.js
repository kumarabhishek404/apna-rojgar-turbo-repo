import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import { getAllErrors, reportClientError } from "../controllers/error.controller.js";

const router = express.Router();

router.post("/report", optionalAuth, reportClientError);

router.use(verifyToken, userStatus);
router.get("/all", getAllErrors);

export default router;

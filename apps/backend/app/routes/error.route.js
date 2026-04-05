import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import { getAllErrors } from "../controllers/error.controller.js";

const router = express.Router();
router.use(verifyToken, userStatus);

// Get all company stats
router.get("/all", getAllErrors);

export default router;

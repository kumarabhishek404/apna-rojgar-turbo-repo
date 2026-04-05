import express from "express";
import {
  compareJSON,
  getAllCompanyStats,
} from "../controllers/home.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Store uploaded files temporarily
router.use(verifyToken, userStatus);

// Get all company stats
router.get("/stats", getAllCompanyStats);

router.post(
  "/compare-json",
  upload.fields([{ name: "file1" }, { name: "file2" }]),
  compareJSON
);

export default router;

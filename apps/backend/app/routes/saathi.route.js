import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { handleSaathiUnderstand } from "../controllers/saathi.controller.js";

const router = express.Router();
router.post("/understand", verifyToken, handleSaathiUnderstand);

export default router;

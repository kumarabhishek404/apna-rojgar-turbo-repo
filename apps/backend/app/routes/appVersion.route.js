import express from "express";
import { appVersionInformation } from "../controllers/appVersion.controller.js";

const router = express.Router();

router.get("/info", appVersionInformation);

export default router;

import express from "express";
import { postBatch } from "../controllers/analytics.controller.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { analyticsBatchSchema } from "../validations/analytics.validation.js";

const router = express.Router();

/** Optional JWT: never 401 — invalid/missing token still ingests events with userId null */
router.post("/events/batch", optionalAuth, validate(analyticsBatchSchema), postBatch);

export default router;

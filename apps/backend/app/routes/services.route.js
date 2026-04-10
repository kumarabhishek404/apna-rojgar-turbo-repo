import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";

import {
  getAllAppliedUsers,
  getAllSelectedUsers,
  getAllServices,
  getPublicServiceIdsForStaticExport,
  getPublicPlatformStats,
  getServiceDetail,
  getAllTheVillages
} from "../controllers/service.controller.js";

const router = express.Router();

router.get("/public/service-ids", getPublicServiceIdsForStaticExport);
router.get("/public/platform-stats", getPublicPlatformStats);
router.post("/villages", getAllTheVillages)
router.use(verifyToken, userStatus);
router.post("/all", getAllServices);
router.get("/service-info/:id", getServiceDetail);
router.get("/:serviceId/applied/users", getAllAppliedUsers);
router.get("/:serviceId/selected/users", getAllSelectedUsers);

export default router;

import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";

import {
  getAllAppliedUsers,
  getAllSelectedUsers,
  getAllServices,
  getServiceDetail,
  getAllTheVillages
} from "../controllers/service.controller.js";

const router = express.Router();


router.post("/villages", getAllTheVillages)
router.use(verifyToken, userStatus);
router.post("/all", getAllServices);
router.get("/service-info/:id", getServiceDetail);
router.get("/:serviceId/applied/users", getAllAppliedUsers);
router.get("/:serviceId/selected/users", getAllSelectedUsers);

export default router;

import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getAllMySentRequests,
  getMyAllMembers,
  getServicesAppliedAsMediator,
  getServicesSelectedAsMediator,
  handleCancelRequest,
  handleRequestJoining,
  removeMemberFromTeam,
} from "../controllers/mediator.controller.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import {
  cancelAcceptRejectJoiningSchema,
  requestJoiningSchema,
} from "../validations/request.validation.js";
import validate from "../middlewares/validate.middleware.js";

const router = express.Router();

router.use(verifyToken, userStatus);
router.post(
  "/team/request/send",
  validate(requestJoiningSchema),
  handleRequestJoining,
);
router.post(
  "/team/request/cancel",
  validate(cancelAcceptRejectJoiningSchema),
  handleCancelRequest,
);
router.get("/team/request/sent/all", getAllMySentRequests);

router.get("/team/:mediatorId/members", getMyAllMembers);

router.delete("/team/member/:memberId/remove", removeMemberFromTeam);

router.get("/applied-services", getServicesAppliedAsMediator);
router.get("/booking/all", getServicesSelectedAsMediator);

export default router;

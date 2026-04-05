import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getAllAppliedServices,
  getAllMyReceivedInvitations,
  getAllSelectedServicesAndDirectBookings,
  getAllMyReceivedRequests,
  handleLeaveTeam,
  getInvitationDetails,
} from "../controllers/worker.controller.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { cancelAcceptRejectJoiningSchema } from "../validations/request.validation.js";
import { handleCancelBooking } from "../controllers/workers/cancelBookingOrSelection.js";
import { handleApplyToService } from "../controllers/workers/apply.js";
import { handleCancelApply } from "../controllers/workers/cancelApply.js";
import { handleAcceptTeamJoiningRequest } from "../controllers/workers/acceptTeamJoiningRequest.js";
import { handleRejectTeamJoiningRequest } from "../controllers/workers/rejectTeamJoiningRequest.js";
import { handleAcceptEmployerBookingRequest } from "../controllers/workers/acceptEmployerBookingRequest.js";
import { handleRejectEmployerBookingRequest } from "../controllers/workers/rejectEmployerBookingRequest.js";

const router = express.Router();

router.use(verifyToken, userStatus);

router.post("/apply", handleApplyToService);
router.post("/cancel-apply", handleCancelApply);

router.get("/applied-services", getAllAppliedServices);

router.post(
  "/booking/invitation/accept",
  verifyToken,
  handleAcceptEmployerBookingRequest,
);
router.post(
  "/booking/invitation/reject",
  verifyToken,
  handleRejectEmployerBookingRequest,
);
router.get(
  "/booking/invitation/received",
  verifyToken,
  getAllMyReceivedInvitations,
);
router.get("/booking/invitation/:id", getInvitationDetails);

router.get("/booking/all", getAllSelectedServicesAndDirectBookings);
router.post("/booking/cancel", verifyToken, handleCancelBooking);

// TEAM
router.get("/team/request/received/all", getAllMyReceivedRequests);
router.post(
  "/team/request/accept",
  validate(cancelAcceptRejectJoiningSchema),
  handleAcceptTeamJoiningRequest,
);
router.post(
  "/team/request/reject",
  validate(cancelAcceptRejectJoiningSchema),
  handleRejectTeamJoiningRequest,
);

router.post("/team/leave", handleLeaveTeam);

export default router;

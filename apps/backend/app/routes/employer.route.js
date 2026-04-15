import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getMyUploadedServices,
  getAllSentInvitations,
  getMyAllBookedWorker,
  getAllUniqueSkills,
} from "../controllers/employer.controller.js";
import {
  upload,
  uploadServiceImages,
} from "../middlewares/multer.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { cancelInvitationSchema } from "../validations/employer.validation.js";
import { handleCancelBooking } from "../controllers/workers/cancelBookingOrSelection.js";
import { handleAcceptApplication } from "../controllers/employers/acceptApplication.js";
import { handleRejectApplication } from "../controllers/employers/rejectApplication.js";
import { handleCancelSelectedUser } from "../controllers/employers/cancelSelection.js";
import { handleCompleteBooking } from "../controllers/employers/completeBooking.js";
import {
  checkStatusOfImageUploading,
  handleAddService,
  handleUpdateService,
} from "../controllers/employers/addAndUpdateService.js";
import { handleSendBookingRequestToWorkerOrMediator } from "../controllers/employers/sendBookingRequestToWorkerOrMediator.js";
import { handleCancelBookingRequestToWorkerOrMediator } from "../controllers/employers/cancelBookingRequestToWorkerOrMediator.js";
import { handleRemoveBookedWorkerOrMediator } from "../controllers/employers/removeBookedWorkerOrMediator.js";

const router = express.Router();

router.use(verifyToken, userStatus);

// router.route("/add-service").post(uploadServiceImages, handleAddService);
router.post("/add-service", uploadServiceImages, handleAddService);

router.get("/service-upload-status/:id", checkStatusOfImageUploading);

router.put(
  "/update-service",
  upload.fields([{ name: "images", maxCount: 3 }]),
  handleUpdateService,
);

router.get("/my-services", getMyUploadedServices);

router.post("/application/select", handleAcceptApplication);

router.post("/application/reject", handleRejectApplication);

router.post("/selection/cancel", handleCancelSelectedUser);

router.post(
  "/booking/invitations/send",
  upload.fields([{ name: "images", maxCount: 3 }]),
  handleSendBookingRequestToWorkerOrMediator,
);

router.get("/booking/invitations/sent", getAllSentInvitations);

router.post(
  "/booking/invitations/cancel",
  validate(cancelInvitationSchema),
  handleCancelBookingRequestToWorkerOrMediator,
);

router.get("/booked-worker/all", getMyAllBookedWorker);

router.post("/booking/remove-worker", handleRemoveBookedWorkerOrMediator);
router.post("/booking/cancel", handleCancelBooking);
router.post("/booking/complete", handleCompleteBooking);

router.get("/skills/all", getAllUniqueSkills);

export default router;

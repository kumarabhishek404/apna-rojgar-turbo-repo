import Invitation from "../../models/invitation.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleCancelBookingRequestToWorkerOrMediator = async (
  req,
  res
) => {
  try {
    const { _id } = req.user;
    const { userId } = req.body;

    const invitation = await findPendingInvitation(_id, userId);
    if (!invitation) return sendNotFoundResponse(res);

    const { employer, bookedWorker } = await fetchUserDetails(_id, userId);
    if (!employer || !bookedWorker) return sendUserNotFoundResponse(res);

    const updatedInvitation = await cancelInvitation(invitation._id);
    if (!updatedInvitation) return sendCancelFailureResponse(res);

    await updateUserData(_id, userId);
    await sendCancelNotification(userId, employer, req);

    res
      .status(200)
      .json({ success: true, message: "Invitation cancelled successfully." });
  } catch (error) {
    logError(new Error("Error cancelling invitation"), req, 500);
    res.status(500).json({
      success: false,
      message: "Something went wrong while cancelling the invitation.",
      error: error.message,
    });
  }
};

const findPendingInvitation = async (employerId, userId) => {
  return Invitation.findOne({
    employer: employerId,
    bookedWorker: userId,
    status: "PENDING",
  });
};

const fetchUserDetails = async (employerId, userId) => {
  const [employer, bookedWorker] = await Promise.all([
    User.findById(employerId).select("name profilePicture email mobile"),
    User.findById(userId).select("name"),
  ]);
  return { employer, bookedWorker };
};

const cancelInvitation = async (invitationId) => {
  return Invitation.findByIdAndUpdate(
    invitationId,
    { status: "CANCELLED" },
    { new: true }
  );
};

const updateUserData = async (employerId, workerId) => {
  await Promise.all([
    User.findByIdAndUpdate(workerId, {
      $pull: { bookingRequestBy: employerId },
    }),
    updateUserStats(employerId, "SERVICE_DIRECT_BOOKING_REQUEST_CANCELLED"),
    updateUserStats(workerId, "WORK_DIRECT_BOOKING_REQUEST_CANCELLED"),
  ]);
};

const sendCancelNotification = async (userId, employer, req) => {
  handleSendNotificationController(
    userId,
    getEnglishTitles()?.BOOKING_INVITATION_CANCELLED_BY_EMPLOYER,
    { employerName: employer.name },
    {
      actionBy: employer._id,
      actionOn: userId,
    },
    req
  );
};

const sendNotFoundResponse = (res) => {
  return res.status(404).json({
    success: false,
    message: "Invitation not found or already processed.",
  });
};

const sendUserNotFoundResponse = (res) => {
  return res
    .status(404)
    .json({ success: false, message: "Employer or worker not found." });
};

const sendCancelFailureResponse = (res) => {
  return res
    .status(500)
    .json({ success: false, message: "Failed to cancel the invitation." });
};

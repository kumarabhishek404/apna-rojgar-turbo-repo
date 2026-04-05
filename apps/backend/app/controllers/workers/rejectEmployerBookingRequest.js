import Invitation from "../../models/invitation.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleRejectEmployerBookingRequest = async (req, res) => {
  try {
    const { _id } = req.user; // Worker rejecting the invitation
    const { invitationId } = req.body;

    const invitation = await fetchPendingInvitation(invitationId, _id);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already processed.",
      });
    }

    const { bookedWorker, employer } = await fetchUserDetails(invitation);
    if (!bookedWorker || !employer) {
      return res.status(404).json({
        success: false,
        message: "Worker or employer not found.",
      });
    }

    await processRejection(invitation, _id, employer, req);
    await sendRejectionNotification(employer, bookedWorker, invitation, req);

    res.status(200).json({
      success: true,
      message: "Rejected the employer invitation successfully.",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Something went wrong while rejecting the invitation.",
      error: error.message,
    });
  }
};

const fetchPendingInvitation = async (invitationId, workerId) => {
  try {
    return await Invitation.findOne({
      _id: invitationId,
      bookedWorker: workerId,
      status: "PENDING",
    }).lean();
  } catch (error) {
    logError(error);
    throw error;
  }
};

const fetchUserDetails = async (invitation) => {
  try {
    const [bookedWorker, employer] = await Promise.all([
      User.findById(invitation.bookedWorker).select(
        "name profilePicture email mobile",
      ),
      User.findById(invitation.employer).select(
        "name profilePicture email mobile",
      ),
    ]);
    return { bookedWorker, employer };
  } catch (error) {
    logError(error);
    throw error;
  }
};

const processRejection = async (invitation, workerId, employer, req) => {
  try {
    await Promise.all([
      Invitation.findByIdAndUpdate(invitation._id, { status: "REJECTED" }),
      User.findByIdAndUpdate(workerId, {
        $pull: { bookingRequestBy: employer._id },
      }),
      updateUserStats(employer._id, "SERVICE_DIRECT_BOOKING_REQUEST_REJECTED"),
      updateUserStats(workerId, "WORK_DIRECT_BOOKING_REQUEST_REJECTED"),
    ]);
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const sendRejectionNotification = async (
  employer,
  bookedWorker,
  invitation,
  req,
) => {
  try {
    handleSendNotificationController(
      employer._id,
      getEnglishTitles()?.BOOKING_REQUEST_REJECTED_BY_USER,
      {
        workerName: bookedWorker.name,
        serviceName: `${invitation.type} - ${invitation.subType}`,
      },
      {
        actionBy: bookedWorker._id,
        actionOn: employer._id,
      },
      req,
    );
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

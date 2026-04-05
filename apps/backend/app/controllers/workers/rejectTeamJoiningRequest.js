import Request from "../../models/request.model.js";
import User from "../../models/user.model.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleRejectTeamJoiningRequest = async (req, res) => {
  const { _id } = req.user;
  const { userId } = req.body;

  if (!validateRequestData(_id, userId, res)) return;

  try {
    const request = await findPendingRequest(_id, userId, req);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No pending request found to reject",
      });
    }

    await updateRequestAndUser(request, _id, req);
    await sendRejectionNotification(request, req);

    return res
      .status(200)
      .json({ success: true, message: "Request rejected successfully" });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while rejecting the request",
      error: error.message,
    });
  }
};

const validateRequestData = (_id, userId, res) => {
  if (!_id || !userId) {
    res
      .status(400)
      .json({ success: false, message: "Invalid request: missing user ID" });
    return false;
  }
  return true;
};

const findPendingRequest = async (receiverId, senderId, req) => {
  try {
    return await Request.findOne({
      receiver: receiverId,
      sender: senderId,
      status: "PENDING",
    });
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const updateRequestAndUser = async (request, receiverId, req) => {
  try {
    await Promise.all([
      Request.findByIdAndUpdate(request._id, { status: "REJECTED" }),
      User.findByIdAndUpdate(receiverId, {
        $pull: { teamJoiningRequestBy: request.sender },
      }),
    ]);
  } catch (error) {
    logError(new Error("Update request and user failed"), req);
    throw error;
  }
};

const sendRejectionNotification = async (request, req) => {
  try {
    const [sender, receiver] = await Promise.all([
      User.findById(request?.sender),
      User.findById(request?.receiver),
    ]);

    if (sender && receiver) {
      handleSendNotificationController(
        sender._id,
        getEnglishTitles()?.REJECTED_TEAM_JOINING_REQUEST_BY_WORKER,
        { workerName: receiver.name },
        {
          actionBy: receiver._id,
          actionOn: sender._id,
        },
        req,
      );
    }
  } catch (error) {
    logError(new Error("Failed to send rejection notification"), req);
    throw error;
  }
};

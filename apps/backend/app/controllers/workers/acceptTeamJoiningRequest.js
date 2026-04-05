import Request from "../../models/request.model.js";
import Team from "../../models/team.model.js";
import User from "../../models/user.model.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleAcceptTeamJoiningRequest = async (req, res) => {
  const { _id } = req.user;
  const { userId } = req.body;

  if (!_id || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request: missing user ID" });
  }

  try {
    const request = await findPendingRequest(_id, userId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "No pending request found" });
    }

    const team = await findOrCreateTeam(request.sender, _id);
    const mediator = await findMediator(request.sender, res);
    if (!mediator) return;

    await updateUserAndRequest(_id, mediator, request);
    await sendAcceptanceNotification(request, req);

    return res.status(200).json({
      success: true,
      message: "Request accepted successfully and added to team",
      team,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while accepting the request",
      error: error.message,
    });
  }
};

const findPendingRequest = async (receiverId, senderId) => {
  try {
    return await Request.findOne({
      receiver: receiverId,
      sender: senderId,
      status: "PENDING",
    });
  } catch (error) {
    logError(error, req);
    return null;
  }
};

const findOrCreateTeam = async (mediatorId, workerId) => {
  try {
    let team = await Team.findOne({ mediator: mediatorId });
    if (!team) {
      team = await Team.create({
        mediator: mediatorId,
        workers: [workerId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await Team.findByIdAndUpdate(team._id, {
        $addToSet: { workers: workerId },
      });
    }
    return team;
  } catch (error) {
    logError(error, req);
    return null;
  }
};

const findMediator = async (mediatorId, res) => {
  try {
    const mediator = await User.findById(mediatorId);
    if (!mediator) {
      res.status(404).json({ success: false, message: "Mediator not found" });
      return null;
    }
    return mediator;
  } catch (error) {
    logError(error, req);
    return null;
  }
};

const updateUserAndRequest = async (workerId, mediator, request) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(workerId, {
        employedBy: {
          _id: mediator._id,
          name: mediator.name,
          email: mediator.email,
          mobile: mediator.mobile,
          profilePicture: mediator.profilePicture,
          status: mediator.status,
          dateOfBirth: mediator.dateOfBirth,
          skills: mediator.skills,
          address: mediator.address,
          gender: mediator.gender,
        },
        $pull: { teamJoiningRequestBy: request.sender },
      }),
      Request.findByIdAndUpdate(request._id, { status: "ACCEPTED" }),
    ]);
  } catch (error) {
    logError(error, req);
  }
};

const sendAcceptanceNotification = async (request, req) => {
  try {
    const [sender, receiver] = await Promise.all([
      User.findById(request.sender),
      User.findById(request.receiver),
    ]);

    if (sender && receiver) {
      handleSendNotificationController(
        sender._id,
        getEnglishTitles()?.ACCEPTED_TEAM_JOINING_REQUEST_BY_WORKER,
        { workerName: receiver.name },
        {
          actionBy: receiver._id,
          actionOn: sender._id,
        },
        req
      );
    }
  } catch (error) {
    logError(error, req);
  }
};

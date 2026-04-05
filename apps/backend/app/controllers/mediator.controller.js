import mongoose from "mongoose";

import User from "../models/user.model.js";
import Team from "../models/team.model.js";
import Request from "../models/request.model.js";
import Service from "../models/service.model.js";

import { handleSendNotificationController } from "./notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

export const handleRequestJoining = async (req, res) => {
  const { _id, name, profilePicture, email, mobile } = req.user;
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Receiver user ID is required",
      });
    }

    if (_id === userId) {
      return res.status(400).json({
        success: false,
        message: "Sender and receiver cannot be the same person",
      });
    }

    const [user, receiver] = await Promise.all([
      User.findById(_id),
      User.findById(userId),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver user not found",
      });
    }

    // ✅ New validation: Check if sender is already a worker in any team
    const senderInAnyTeam = await Team.findOne({
      workers: _id,
      status: "ACTIVE",
    });

    if (senderInAnyTeam) {
      return res.status(400).json({
        success: false,
        message: "You are already part of another team as a worker",
      });
    }

    // Existing validation: receiver should not already be employed
    if (receiver.employedBy) {
      if (receiver.employedBy._id.toString() === _id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Worker is already in your team",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Worker is already added in other mediator's team",
        });
      }
    }

    const existingRequest = await Request.findOne({
      sender: _id,
      receiver: userId,
      status: "PENDING",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "A joining request is already pending for this user",
      });
    }

    const [newRequest] = await Promise.all([
      Request.create({
        sender: _id,
        receiver: userId,
        status: "PENDING",
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { teamJoiningRequestBy: _id },
      }),
    ]);

    handleSendNotificationController(
      userId,
      getEnglishTitles()?.GET_AN_TEAM_JOINING_INVITATION_FROM_MEDIATOR,
      {
        workerName: receiver?.name,
        mediatorName: name,
      },
      {
        actionBy: _id,
        actionOn: userId,
      },
      req,
    );

    return res.status(200).json({
      success: true,
      message: "Request sent successfully",
      request: newRequest,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the request",
      error: error.message,
    });
  }
};

export const handleCancelRequest = async (req, res) => {
  const { _id, name, profilePicture, email, mobile } = req.user;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const request = await Request.findOne({
      sender: _id,
      receiver: userId,
      status: "PENDING",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No pending joining request found to cancel",
      });
    }

    await Promise.all([
      Request.findByIdAndUpdate(request._id, { status: "CANCELLED" }),
      User.findByIdAndUpdate(request.receiver, {
        $pull: { teamJoiningRequestBy: _id },
      }),
    ]);

    handleSendNotificationController(
      userId,
      getEnglishTitles()?.TEAM_JOINING_INVITATION_CANCELLERD_BY_MEDIATOR,
      {
        mediatorName: name,
      },
      {
        actionBy: _id,
        actionOn: userId,
      },
      req,
    );

    return res.status(200).json({
      success: true,
      message: "Joining request cancelled successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while canceling the request",
      error: error.message,
    });
  }
};

export const getAllMySentRequests = async (req, res) => {
  const { _id } = req.user;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  try {
    const [totalRequests, requests] = await Promise.all([
      Request.countDocuments({ sender: _id, status: "PENDING" }),
      Request.find({ sender: _id, status: "PENDING" })
        .populate(
          "sender",
          "name  email mobile skills address profilePicture rating",
        )
        .populate(
          "receiver",
          "name  email mobile skills address profilePicture rating",
        )
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalRequests / limit);

    return res.status(200).json({
      success: true,
      message: "All sent requests fetched successfully",
      data: requests,
      pagination: {
        page,
        pages: totalPages,
        total: totalRequests,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching sent requests",
      error: error.message,
    });
  }
};

export const getMyAllMembers = async (req, res) => {
  const { mediatorId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (page <= 0 || limit <= 0) {
    return res.status(400).json({
      success: false,
      message: "Page and limit must be positive numbers.",
    });
  }

  try {
    // Convert mediatorId to ObjectId
    const mediatorIdObjectId = new mongoose.Types.ObjectId(mediatorId);

    // Fetch team details with full worker details
    const teamDetails = await Team.find({ mediator: mediatorIdObjectId })
      .populate({
        path: "workers", // Reference the workers field
        select:
          "_id name  profilePicture email mobile skills address dateOfBirth gender createdAt", // Exclude sensitive fields
      })
      .skip(skip)
      .limit(limit);

    // Count total workers in the team(s) of the mediator
    const totalMembers = await Team.countDocuments({
      mediator: mediatorIdObjectId,
    });
    const totalPages = Math.ceil(totalMembers / limit);

    res.status(200).json({
      success: true,
      message: "All Members fetched successfully",
      data: teamDetails,
      pagination: {
        page: page,
        totalPages: totalPages,
        total: totalMembers,
        limit: limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Failed to fetch members",
      error: error.message || "Internal Server Error",
    });
  }
};

export const removeMemberFromTeam = async (req, res) => {
  const { memberId } = req.params; // Extract userId from params
  const { _id, name, profilePicture, email, mobile } = req.user; // Get mediator's _id from authenticated user

  try {
    // Use findOne to match mediator and check if the worker exists in the team
    const team = await Team.findOne({
      mediator: _id,
      workers: { $in: memberId },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found or member not part of the team",
      });
    }

    // Remove the worker from the team
    await team.updateOne({ $pull: { workers: memberId } });

    // Update the worker's employedBy field to null
    await User.findByIdAndUpdate(memberId, { employedBy: null });

    handleSendNotificationController(
      memberId,
      getEnglishTitles()?.REMOVED_FROM_TEAM_BY_MEDIATOR,
      {
        mediatorName: name,
      },
      {
        actionBy: _id,
        actionOn: memberId,
      },
      req,
    );

    res.status(200).json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "An error occurred while removing the member from the team",
      error: error.message || "Internal Server Error",
    });
  }
};

export const getServicesAppliedAsMediator = async (req, res) => {
  const { _id } = req.user; // logged-in user ID
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Ensure user exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Query services where user is mediator
    const services = await Service.find({
      appliedUsers: {
        $elemMatch: {
          user: _id,
          status: "PENDING",
          workers: { $exists: true, $not: { $size: 0 } }, // mediator condition
        },
      },
    })
      .skip(skip)
      .limit(limit)
      .populate(
        "employer",
        "name profilePicture company address mobile email geoLocation rating",
      )
      .populate("appliedUsers.user", "name profilePicture email role");

    // Count total for pagination
    const totalServices = await Service.countDocuments({
      appliedUsers: {
        $elemMatch: {
          user: _id,
          status: "PENDING",
          workers: { $exists: true, $not: { $size: 0 } },
        },
      },
    });

    const totalPages = Math.ceil(totalServices / limit);

    res.status(200).json({
      success: true,
      message: "Services applied as mediator fetched successfully",
      data: services,
      pagination: {
        page,
        pages: totalPages,
        total: totalServices,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching services",
    });
  }
};

export const getServicesSelectedAsMediator = async (req, res) => {
  const { _id } = req.user; // logged-in user ID
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Ensure user exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Query services where user is selected as mediator
    const services = await Service.find({
      selectedUsers: {
        $elemMatch: {
          user: _id,
          status: { $in: ["ACCEPTED", "ACTIVE"] }, // user selected
        },
      },
    })
      .skip(skip)
      .limit(limit)
      .populate(
        "employer",
        "name profilePicture company address mobile email geoLocation rating",
      )
      .populate("selectedUsers.user", "name profilePicture email role");

    // Count total for pagination
    const totalServices = await Service.countDocuments({
      selectedUsers: {
        $elemMatch: {
          user: _id,
          status: "SELECTED",
          workers: { $exists: true, $not: { $size: 0 } },
        },
      },
    });

    const totalPages = Math.ceil(totalServices / limit);

    res.status(200).json({
      success: true,
      message:
        "Services where you are selected as mediator fetched successfully",
      data: services,
      pagination: {
        page,
        pages: totalPages,
        total: totalServices,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching services",
    });
  }
};

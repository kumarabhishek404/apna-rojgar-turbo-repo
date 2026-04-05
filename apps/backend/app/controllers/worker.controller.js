import mongoose from "mongoose";
import Service from "../models/service.model.js";
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import Invitation from "../models/invitation.model.js";
import Request from "../models/request.model.js";
import { handleSendNotificationController } from "./notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

export const getAllAppliedServices = async (req, res) => {
  const { _id } = req.user; // Logged-in user ID
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Ensure the user exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Fetch services where at least one appliedUsers entry:
    // - Has status "PENDING"
    // - Contains the user either directly OR in the workers array
    const services = await Service.find({
      $or: [
        {
          appliedUsers: {
            $elemMatch: {
              user: _id,
              status: "PENDING",
            },
          },
        },
        {
          appliedUsers: {
            $elemMatch: {
              status: "PENDING",
              workers: {
                $elemMatch: {
                  worker: _id,
                  status: "PENDING",
                },
              },
            },
          },
        },
      ],
    })
      .skip(skip)
      .limit(limit)
      .populate(
        "employer",
        "name profilePicture company address mobile email geoLocation rating",
      );

    // Count total matching services for pagination
    const totalAppliedServices = await Service.countDocuments({
      $or: [
        {
          appliedUsers: {
            $elemMatch: {
              user: _id,
              status: "PENDING",
            },
          },
        },
        {
          appliedUsers: {
            $elemMatch: {
              status: "PENDING",
              workers: {
                $elemMatch: {
                  worker: _id,
                  status: "PENDING",
                },
              },
            },
          },
        },
      ],
    });

    const totalPages = Math.ceil(totalAppliedServices / limit);

    res.status(200).json({
      success: true,
      message: "Applied services fetched successfully.",
      data: services,
      pagination: {
        page,
        pages: totalPages,
        total: totalAppliedServices,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message:
        error?.message || "Something went wrong while fetching services.",
    });
  }
};

export const getAllSelectedServicesAndDirectBookings = async (req, res) => {
  const { _id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Ensure user exists
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Query to match services based on conditions
    const services = await Service.find({
      status: "HIRING",
      $or: [
        { bookedWorker: _id }, // Condition 1: Logged-in user is the bookedWorker
        {
          selectedUsers: {
            $elemMatch: {
              user: _id,
              status: "SELECTED", // Condition 2: User is the main user in selectedUsers
            },
          },
        },
        {
          selectedUsers: {
            $elemMatch: {
              status: "SELECTED",
              workers: {
                $elemMatch: {
                  worker: _id,
                  status: "SELECTED", // Condition 3: User is in workers array of selectedUsers
                },
              },
            },
          },
        },
      ],
    })
      .skip(skip)
      .limit(limit)
      // .populate({
      //   path: "selectedUsers.user",
      //   select: "name profilePicture skills",
      //   match: { _id: { $ne: _id } }, // Only populate user if different from logged-in user
      // })
      // .populate({
      //   path: "selectedUsers.workers",
      //   select: "name profilePicture skills",
      //   match: { _id: { $ne: _id } }, // Only populate workers if different from logged-in user
      // })
      // .populate("bookedWorker", "name profilePicture skills mobile email address")
      .populate(
        "employer",
        "name profilePicture company address mobile email geoLocation rating",
      );

    // Count total matching services for pagination
    const totalServices = await Service.countDocuments({
      status: "HIRING",
      $or: [
        { bookedWorker: _id },
        {
          selectedUsers: {
            $elemMatch: {
              user: _id,
              status: "SELECTED",
            },
          },
        },
        {
          selectedUsers: {
            $elemMatch: {
              status: "SELECTED",
              workers: {
                $elemMatch: {
                  worker: _id,
                  status: "SELECTED", // Condition 3: User is in workers array of selectedUsers
                },
              },
            },
          },
        },
      ],
    });

    const totalPages = Math.ceil(totalServices / limit);

    // Modify response to conditionally exclude unnecessary fields
    const filteredServices = services.map((service) => {
      const modifiedSelectedUsers = service.selectedUsers.map(
        (selectedUser) => {
          if (String(selectedUser.user?._id) === String(_id)) {
            // Logged-in user is the main user → Keep workers, remove user
            return {
              ...selectedUser.toObject(),
              user: undefined,
            };
          } else if (
            selectedUser.workers.some(
              (worker) => String(worker._id) === String(_id),
            )
          ) {
            // Logged-in user is inside workers → Keep main user, remove workers list
            return {
              ...selectedUser.toObject(),
              workers: undefined,
            };
          }
          return selectedUser;
        },
      );

      return {
        ...service.toObject(),
        selectedUsers: modifiedSelectedUsers,
      };
    });

    res.status(200).json({
      success: true,
      message: "Fetched selected services and direct bookings successfully.",
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
      message:
        error?.message || "Something went wrong while fetching services.",
    });
  }
};

export const getAllMyReceivedInvitations = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const { _id } = req.user;

  try {
    const totalInvitationCount = await Invitation.countDocuments({
      bookedWorker: _id,
      status: "PENDING",
    });

    const invitations = await Invitation.find({
      bookedWorker: _id,
      status: "PENDING",
    })
      .populate(
        "employer",
        "_id name  mobile email rating address profilePicture skills",
      )
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      message: "Invitations fetched successfully.",
      data: invitations,
      pagination: {
        page: Number(page),
        pages: Math.ceil(totalInvitationCount / Number(limit)),
        total: totalInvitationCount,
        limit: Number(limit),
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

export const getInvitationDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id; // 👈 Assuming user ID is available here from auth middleware

  // ✅ Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid invitation ID format",
    });
  }

  try {
    // 🔍 Fetch invitation to check user role
    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    let populatedInvitation;

    // 🏗️ If employer is fetching the details
    if (invitation.employer.toString() === userId.toString()) {
      populatedInvitation = await Invitation.findById(id).populate({
        path: "bookedWorker",
        select:
          "name mobile profilePicture email address geoLocation rating status skills",
      });
    }
    // 👷 If bookedWorker is fetching the details
    else if (invitation.bookedWorker.toString() === userId.toString()) {
      populatedInvitation = await Invitation.findById(id).populate(
        "employer",
        "name mobile profilePicture email address geoLocation rating status",
      );
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this invitation.",
      });
    }

    // 🎉 Success response
    return res.status(200).json({
      success: true,
      message: "Invitation details fetched successfully",
      data: populatedInvitation,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching invitation details",
      error: error.message,
    });
  }
};

export const getAllMyReceivedRequests = async (req, res) => {
  const { _id } = req.user;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  try {
    const [totalRequests, requests] = await Promise.all([
      Request.countDocuments({ receiver: _id, status: "PENDING" }),
      Request.find({ receiver: _id, status: "PENDING" })
        .populate(
          "sender",
          "name email mobile skills address profilePicture rating",
        )
        .populate(
          "receiver",
          "name email mobile skills address profilePicture rating",
        )
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalRequests / limit);

    return res.status(200).json({
      success: true,
      message: "All received requests fetched successfully",
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
      message: "An error occurred while fetching received requests",
      error: error.message,
    });
  }
};

export const handleLeaveTeam = async (req, res) => {
  const { _id } = req.user;

  if (!_id) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: missing user ID",
    });
  }

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const employer = await User.findById(user.employedBy);
    const team = await Team.findOne({ mediator: user.employedBy });

    await Promise.all([
      user.updateOne({ employedBy: null }),
      team
        ? Team.findByIdAndUpdate(team._id, {
            $pull: { workers: _id },
          })
        : Promise.resolve(),
    ]);

    if (employer) {
      handleSendNotificationController(
        employer._id,
        getEnglishTitles()?.WOREKR_LEFT_FROM_TEAM,
        {
          workerName: user.name,
        },
        {
          actionBy: _id,
          actionOn: employer._id,
        },
        req,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while leaving the group",
      error: error.message,
    });
  }
};

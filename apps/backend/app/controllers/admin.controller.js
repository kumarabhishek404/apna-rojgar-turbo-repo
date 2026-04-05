import User from "../models/user.model.js";
import Request from "../models/request.model.js";
import { handleSendNotificationController } from "./notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

export const handleActivateUser = async (req, res) => {
  const admin = req?.user;
  const { userId } = req.body;

  if (!userId) {
    return res.status(404).json({
      success: false,
      message: "UserId not found",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "User is already active",
      });
    }

    user.status = "ACTIVE";
    await user.save();

    handleSendNotificationController(
      user._id,
      getEnglishTitles()?.PROFILE_ACTIVE,
      {
        workerName: user.name,
      },
      {
        actionBy: null, // Store only the ObjectId reference
        actionOn: user._id, // Store only the ObjectId reference
      },
      req,
    );

    res.status(200).json({
      success: true,
      message: "Account is activated now",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while activating user",
    });
  }
};

export const handleSuspendUser = async (req, res) => {
  const { userId } = req.params;
  const admin = req?.user;

  if (!userId) {
    return res.status(404).json({
      success: false,
      message: "UserId not found",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "SUSPENDED") {
      return res.status(400).json({
        success: false,
        message: "User is already SUSPENDED",
      });
    }

    user.status = "SUSPENDED";
    await user.save();

    handleSendNotificationController(
      user._id,
      getEnglishTitles()?.PROFILE_SUSPEND,
      {},
      {
        actionBy: null,
        actionOn: user._id,
      },
      req,
    );

    res.status(200).json({
      success: true,
      message: "Account is now suspended",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while suspending user",
    });
  }
};

export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status || "ACTIVE";

  try {
    const totalUsers = await User.countDocuments({ status });
    const users = await User.find({ status }).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
      pagination: {
        page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getAllRequests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  try {
    const totalRequests = await Request.countDocuments({ status });
    const requests = await Request.find({ status })
      .populate(
        "sender",
        "name email mobile address skill profilePicture rating",
      )
      .populate(
        "receiver",
        "name email mobile address skill profilePicture rating",
      )
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "All requests fetched successfully",
      data: requests,
      pagination: {
        page,
        pages: Math.ceil(totalRequests / limit),
        total: totalRequests,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

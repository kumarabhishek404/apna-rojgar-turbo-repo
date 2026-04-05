import AppFeedback from "../models/appFeedback.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logError from "../utils/addErrorLog.js";

export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, feedbackType, description, deviceInfo, appVersion } =
      req.body;

    const errors = {};

    // Collect all validation errors
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      errors.rating = "Rating is required and must be between 1-5";
    }

    if (!feedbackType || typeof feedbackType !== "string") {
      errors.feedbackType = "Valid feedback type is required";
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length < 10
    ) {
      errors.description = "Description must be at least 10 characters long";
    }

    // Get user details from the authenticated request
    const sender = {
      _id: req.user?._id,
      name: req.user?.name,
      email: req.user?.email,
      dateOfBirth: req.user?.dateOfBirth,
      mobile: `+${req.user?.countryCode} ${req.user?.mobile}`,
      gender: req.user?.gender,
      status: req.user?.status,
      profilePicture: req.user?.profilePicture,
      address: req.user?.address,
      createdAt: req.user?.createdAt,
    };

    // If there are any validation errors, return them all at once
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, { errors }, "Validation failed"));
    }

    // Create new feedback with proper type handling
    const feedback = await AppFeedback.create({
      sender,
      rating,
      feedbackType,
      description,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : "{}",
      appVersion: appVersion || "unknown",
    });

    return res
      .status(201)
      .json(new ApiResponse(201, feedback, "Feedback submitted successfully"));
  } catch (error) {
    logError(error, req, 500);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { error: error.message },
          "Error submitting feedback"
        )
      );
  }
};

export const getAllFeedback = async (req, res, next) => {
  try {
    const feedback = await AppFeedback.find()
      .sort({ createdAt: -1 })
      .populate("sender", "name profilePicture");
    const totalCount = await AppFeedback.countDocuments();

    return res
      .status(200)
      .json(new ApiResponse(200, { feedback, total: totalCount }));
  } catch (error) {
    logError(error, req, 500);
    next(new ApiError(500, `Error retrieving feedback: ${error.message}`));
  }
};

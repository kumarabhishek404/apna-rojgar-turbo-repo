import User from "../models/user.model.js";
import UserProblem from "../models/userProblem.model.js";
import logError from "../utils/addErrorLog.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// POST /api/user-problems
export const submitUserProblem = async (req, res) => {
  try {
    console.log("user -", req?.body);

    const { mobile, problemType, description } = req.body;

    const errors = {};

    // Validation
    if (!mobile || typeof mobile !== "string" || !/^\d{10}$/.test(mobile)) {
      errors.mobile = "Valid 10-digit mobile number is required";
    }

    if (!problemType || typeof problemType !== "string") {
      errors.problemType = "Valid problem type is required";
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, { errors }, "Validation failed"));
    }

    // Fetch the user details based on the mobile number
    const user = await User.findOne({ mobile }).select(
      "_id name  email mobile countryCode status"
    );

    if (!user) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "User not found for the given mobile number"
          )
        );
    }

    // Create the user problem document
    const userProblem = await UserProblem.create({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: `+${user.countryCode} ${user.mobile}`,
        status: user.status,
      },
      problemType,
      description: description || "No description provided", // Default description
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, userProblem, "User problem submitted successfully")
      );
  } catch (error) {
    logError(error, req, 500);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { error: error.message },
          "Failed to submit problem"
        )
      );
  }
};

// GET /api/user-problems
export const getAllUserProblems = async (req, res) => {
  try {
    // Fetch all user problems, you can apply filters (e.g., by status) as needed
    const userProblems = await UserProblem.find().sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, userProblems, "Fetched all user problems"));
  } catch (error) {
    logError(error, req, 500);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { error: error.message },
          "Failed to fetch problems"
        )
      );
  }
};

// PATCH /api/user-problems/:id/complete
export const completeUserProblem = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the problem by ID
    const problem = await UserProblem.findById(id);

    if (!problem) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Problem not found"));
    }

    // Check if the problem status is PENDING
    if (problem.status !== "PENDING") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { currentStatus: problem.status },
            `Problem cannot be marked as completed because its current status is "${problem.status}"`
          )
        );
    }

    // Update the status to COMPLETED
    problem.status = "COMPLETED";
    await problem.save();

    return res
      .status(200)
      .json(new ApiResponse(200, problem, "Problem marked as completed"));
  } catch (error) {
    logError(error, req, 500);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { error: error.message },
          "Failed to complete problem"
        )
      );
  }
};

// PATCH /api/user-problems/:id/cancel
export const cancelUserProblem = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the problem by ID
    const problem = await UserProblem.findById(id);

    if (!problem) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Problem not found"));
    }

    // Check if the problem status is PENDING
    if (problem.status !== "PENDING") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { currentStatus: problem.status },
            `Problem cannot be marked as cancelled because its current status is "${problem.status}"`
          )
        );
    }

    // Update the status to CANCELLED
    problem.status = "CANCELLED";
    await problem.save();

    return res
      .status(200)
      .json(new ApiResponse(200, problem, "Problem marked as cancelled"));
  } catch (error) {
    logError(error, req, 500);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { error: error.message },
          "Failed to cancel problem"
        )
      );
  }
};

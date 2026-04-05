import ErrorLog from "../models/errors.model.js";
import logError from "../utils/addErrorLog.js";

export const getAllErrors = async (req, res) => {
  try {
    const errors = await ErrorLog.find().sort({ createdAt: -1 }); // Get latest errors first
    res.status(200).json({ success: true, errors });
  } catch (error) {
    logError(error, req, 500);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to retrieve errors",
        error: error.message,
      });
  }
};

import logError from "../utils/addErrorLog.js";

const userStatus = (req, res, next) => {
  const { status } = req.user;

  try {
    if (!status) {
      const error = new Error("User status is not provided");
      logError(error, req, 400, "middleware - userStatus");
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // These are expected account states, not defects. Keep the messages
    // stable — the app matches them — but do not write an error log.
    if (status === "DISABLED") {
      return res.status(400).json({
        success: false,
        message: "User account is disabled",
      });
    }

    if (status === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "User is not activated yet",
      });
    }

    if (status === "SUSPENDED") {
      return res.status(400).json({
        success: false,
        message: "User is suspended",
      });
    }

    if (status === "ACTIVE") {
      return next();
    }

    const error = new Error(`Invalid user status: ${status}`);
    logError(error, req, 400, "middleware - userStatus");
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } catch (error) {
    logError(error, req, 500, "middleware - userStatus");
    console.error("⚠️ Error in userStatus middleware:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
  }
};

export default userStatus;

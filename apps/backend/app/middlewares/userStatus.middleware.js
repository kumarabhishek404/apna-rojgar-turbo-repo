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

    if (status === "DISABLED") {
      const error = new Error("User account is disabled"); // If change this message than update in the frontend also
      logError(error, req, 400, "middleware - userStatus");
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (status === "PENDING") {
      const error = new Error("User is not activated yet"); // If change this message than update in the frontend also
      logError(error, req, 400, "middleware - userStatus");
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (status === "SUSPENDED") {
      const error = new Error("User is suspended"); // If change this message than update in the frontend also
      logError(error, req, 400, "middleware - userStatus");
      return res.status(400).json({
        success: false,
        message: error.message,
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

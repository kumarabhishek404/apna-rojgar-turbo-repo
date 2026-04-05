import db from "../models/index.js";
import logError from "../utils/addErrorLog.js";

const ROLES = db.ROLES;
const User = db.user;

const checkDuplicateUsernameAndEmail = async (req, res, next) => {
  console.log("check duplicate userName and email function called", req.body);
  let { mobile, email } = req.body;

  try {
    // Check for duplicate mobile number
    const existingUserByMobile = await User.findOne({ mobile });

    if (existingUserByMobile) {
      const error = new Error("Failed! Mobile is already in use!");
      logError(error, req, 400, "middleware - checkDuplicateUsernameAndEmail");
      return res.status(400).send({ message: error.message });
    }

    // Check for duplicate email
    const existingUserByEmail = await User.findOne({ email });

    if (existingUserByEmail) {
      const error = new Error("Failed! Email is already in use!");
      logError(error, req, 400, "middleware - checkDuplicateUsernameAndEmail");
      return res.status(400).send({ message: error.message });
    }

    next();
  } catch (err) {
    logError(err, req, 500, "middleware - checkDuplicateUsernameAndEmail");
    console.error("⚠️ Error while registering:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const checkRolesExisted = (req, res, next) => {
  console.log("Checking roles in database:", req.body);
  let { roles } = req.body;

  try {
    if (roles && roles.length > 0) {
      for (let role of roles) {
        if (!ROLES.includes(role)) {
          const error = new Error(`Failed! Role ${role} does not exist!`);
          logError(error, req, 400, "middleware - checkRolesExisted");
          return res.status(400).send({ message: error.message });
        }
      }
    }
    next();
  } catch (err) {
    logError(err, req, 500, "middleware - checkRolesExisted");
    console.error("⚠️ Error while checking role existence:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const verifySignUp = {
  checkDuplicateUsernameAndEmail,
  checkRolesExisted,
};

export default verifySignUp;

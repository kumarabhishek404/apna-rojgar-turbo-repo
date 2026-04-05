import express from "express";
import {
  handleRegister,
  handleLogin,
  handleResetPassword,
  handleForgotPasswordCode,
  handleSetForgotPassword,
  handleSendEmailVerificationCode,
  handleVerifyEmailVerificationCode,
  handleValidateToken,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
  sendEmailVerificationCodeSchema,
  verifyEmailVerificationCodeSchema,
} from "../validations/auth.validation.js";

const router = express.Router();
router.get("/validate-token", handleValidateToken);
router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.patch("/reset-password", verifyToken, handleResetPassword);
router.post("/forgot-password-code", handleForgotPasswordCode);
router.patch("/set-forgot-password", handleSetForgotPassword);

// Email Verification

router.post(
  "/send-email-code",
  verifyToken,
  validate(sendEmailVerificationCodeSchema),
  handleSendEmailVerificationCode,
);
router.post(
  "/verify-email-code",
  verifyToken,
  validate(verifyEmailVerificationCodeSchema),
  handleVerifyEmailVerificationCode,
);

export default router;

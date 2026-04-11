import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import logError from "../utils/addErrorLog.js";
import { performance } from "perf_hooks";
import axios from "axios";

import User from "../models/user.model.js";

const generateToken = (user) => {
  return jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "60d",
  });
};

function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function normalizeRegistrationSource(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v === "android" || v === "ios" || v === "web") return v;
  return null;
}

export const handleRegister = async (req, res) => {
  try {
    const { mobile, locale, countryCode, source } = req.body;
    console.log("API HIT: Register Endpoint", req.body);

    if (!mobile || !countryCode || !locale) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check with mobile + countryCode combo
    const existingUser = await User.findOne({ mobile, countryCode });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this mobile number",
      });
    }

    const headerSource = normalizeRegistrationSource(
      req.get?.("x-client-platform") ?? req.headers["x-client-platform"],
    );
    const bodySource = normalizeRegistrationSource(source);
    const registrationSource = bodySource ?? headerSource ?? null;

    const user = new User({
      locale,
      countryCode,
      mobile,
      registrationSource,
      status: "ACTIVE",
    });

    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: user._id,
        name: user.name || "", // fallback
        token,
      },
    });
  } catch (error) {
    console.error("Error in handleRegister:", error);
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: error?.message || "Server error",
    });
  }
};

const sendOTP = async (mobile) => {
  console.log("mobile--", mobile);

  try {
    const response = await axios?.get(
      `https://2factor.in/API/V1/${"d0fa8207-0f16-11f0-8b17-0200cd936042"}/SMS/${mobile}/AUTOGEN/temp1`,
    );
    console.log("response", response?.data);

    return response?.data;
  } catch (error) {
    console.error("Error during mobile number authentication:", error);
    TOAST.error(`Error during mobile number authentication: ${error}`);
    throw error;
  }
};

const verifyOTP = async (payload) => {
  console.log("payload", payload);
  try {
    const response = await axios?.get(
      `https://2factor.in/API/V1/${"d0fa8207-0f16-11f0-8b17-0200cd936042"}/SMS/VERIFY3/${
        payload?.mobile
      }/${payload?.otp}`,
    );
    return response?.data;
  } catch (error) {
    console.error("Error verifying OTP code:", error);
    throw error;
  }
};

export const handleLogin = async (req, res) => {
  const tStart = performance.now();
  const { mobile, otp } = req.body;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is required",
    });
  }

  try {
    /**
     * =====================================================
     * STEP 1️⃣ → SEND OTP (NO OTP IN PAYLOAD)
     * =====================================================
     */
    if (!otp) {
      await sendOTP(mobile);

      return res.status(200).json({
        success: true,
        step: "OTP_SENT",
        message: "OTP sent successfully",
      });
    }

    /**
     * =====================================================
     * STEP 2️⃣ → VERIFY OTP
     * =====================================================
     */
    const otpResponse = await verifyOTP({ mobile, otp });

    if (otpResponse?.Status !== "Success") {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    /**
     * =====================================================
     * STEP 3️⃣ → FETCH / CREATE USER
     * =====================================================
     */
    const t0 = performance.now();
    let user = await User.findOne({ mobile })
      .select(
        "_id name gender mobile address age geoLocation locale skills notificationConsent profilePicture status savedAddresses",
      )
      .lean();
    const t1 = performance.now();
    console.log("User lookup time:", (t1 - t0).toFixed(2), "ms");

    // Auto-create user if not exists
    if (!user) {
      user = await User.create({
        mobile,
        status: "ACTIVE",
      });
    }

    /**
     * =====================================================
     * STEP 4️⃣ → ACCOUNT STATUS CHECKS
     * =====================================================
     */

    // If admin banned user
    if (user.status === "DISABLED") {
      return res.status(403).json({
        success: false,
        errorCode: "ACCOUNT_DISABLED",
        message: "Your account has been disabled. Please contact support.",
      });
    }

    // If user had deleted account earlier → Reactivate
    if (user.status === "DELETED") {
      console.log("Reactivating deleted account:", mobile);

      await User.updateOne({ _id: user._id }, { status: "ACTIVE" });

      user.status = "ACTIVE"; // update in response object
    }

    /**
     * =====================================================
     * STEP 5️⃣ → PROFILE COMPLETION FLOW
     * =====================================================
     */
    const token = generateToken(user);

    // if (!user.profilePicture?.trim()) {
    //   return res.status(403).json({
    //     success: false,
    //     errorCode: "SET_PROFILE_PICTURE_FIRST",
    //     message: "Please set your profile picture",
    //     userId: user._id,
    //     token,
    //   });
    // }

    /**
     * =====================================================
     * STEP 6️⃣ → SUCCESS LOGIN
     * =====================================================
     */
    const tEnd = performance.now();
    console.log("Total login time:", (tEnd - tStart).toFixed(2), "ms");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
};

export const handleResetPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields are compulsory",
      });
    }

    const user = await User.findById(req.user._id);
    console.log(user);
    const isPasswordMatch = bcrypt.compareSync(oldPassword, user?.password);
    console.log(isPasswordMatch, oldPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Your current password is incorrect",
      });
    }

    // const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // const updatedUser = await User.findByIdAndUpdate(
    //   user._id,
    //   {
    //     password: hashedPassword,
    //   },
    //   {
    //     new: true,
    //   }
    // );

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      message: "Unable to reset password",
    });
  }
};

export const handleForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "officialsujitmemane@gmail.com",
        pass: "cktsvgoaftkdicuq ",
      },
    });

    const mailOptions = {
      to: user.email,
      subject: "Password Reset Code",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please use the following code to reset your password:\n\n
          ${resetToken}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ success: true, message: "Reset code sent to your email" });
  } catch (err) {
    console.log(err);
    logError(err, req, 500);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleSetForgotPassword = async (req, res) => {
  const { userId, mobile, password } = req.body;

  try {
    const user = await User.findOne({ _id: userId, mobile });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or mobile number does not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const handleSendEmailVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const user = await User.findOne({ "email.value": email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const generatedCode = generateVerificationCode();
    user.emailVerificationCode = generatedCode;
    user.emailVerificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailBody = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #2b5eb3;
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background-color: #f5f7fa;
            border-radius: 4px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 120px;
            height: 40px;
            background-color: #f0f0f0;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #666;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Labour App</div>
        </div>

        <h2>Verify Your Email Address</h2>

        <p>Hello,</p>

        <p>Thanks for signing up! Please use the verification code below to verify your email address:</p>

        <div class="verification-code">
           ${generatedCode}
        </div>

        <p>This code will expire in 60 minutes. If you didn't request this verification, please ignore this email.</p>

        <p>Best regards,<br>Labour App</p>

        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© 2024 Your Company. All rights reserved.</p>
            <p>123 Business Street, City, Country</p>
        </div>
    </div>
</body>
</html>`;

    const mailOptions = {
      from: '"Abhishek Kumar" <ak7192837@gmail.com>',
      to: user?.email?.value,
      subject: "Your Email Verification Code",
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error(error);
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the verification code",
    });
  }
};

export const handleVerifyEmailVerificationCode = async (req, res) => {
  const { _id } = req.user;
  const { code } = req.body;

  try {
    const user = await User.findOne({
      _id,
      emailVerificationCode: code,
      emailVerificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.email.isVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationCodeExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying the email",
    });
  }
};

export const handleValidateToken = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(200).json({
      errorCode: "TOKEN_NOT_VALID",
      message: "Token is missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(200).json({
      errorCode: "TOKEN_NOT_VALID",
      message: "Token is missing",
    });
  }

  try {
    // Synchronous verification is faster than async version
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only return essential data
    return res.status(200).json({
      errorCode: "TOKEN_VALID",
      message: "Token is valid",
      user: decoded,
    });
  } catch (error) {
    // Only check the error once
    const isInvalid =
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      ["TokenExpiredError", "JsonWebTokenError"].includes(error.name);

    if (isInvalid) {
      return res.status(200).json({
        errorCode: "TOKEN_NOT_VALID",
        message: "Invalid or expired token",
      });
    }

    console.error("Token validation failed:", error.message);

    return res.status(500).json({
      errorCode: "SERVER_ERROR",
      message: "Server error while validating token",
    });
  }
};

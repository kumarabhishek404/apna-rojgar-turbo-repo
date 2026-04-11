import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import logError from "../utils/addErrorLog.js";
import { performance } from "perf_hooks";
import axios from "axios";

import User from "../models/user.model.js";
import {
  rememberOtpSession,
  getOtpSession,
  clearOtpSession,
} from "../utils/otpSessionCache.js";

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

function getTwoFactorApiKey() {
  const key = process.env.TWOFACTOR_API_KEY;
  if (key != null && String(key).trim()) return String(key).trim();
  return "d0fa8207-0f16-11f0-8b17-0200cd936042";
}

function getTwoFactorTemplateName() {
  const t = process.env.TWOFACTOR_TEMPLATE_NAME;
  if (t != null && String(t).trim()) return String(t).trim();
  return "temp1";
}

/**
 * 2factor.in expects the number with country code (e.g. 91XXXXXXXXXX for India).
 * Clients often send a 10-digit local number.
 */
function normalizePhoneForTwoFactor(mobile) {
  const raw = String(mobile ?? "").replace(/\D/g, "");
  if (raw.length === 10) return `91${raw}`;
  if (raw.length === 12 && raw.startsWith("91")) return raw;
  if (raw.length === 11 && raw.startsWith("0")) return `91${raw.slice(1)}`;
  return raw;
}

function twoFactorResponseOk(data) {
  return data && String(data.Status).toLowerCase() === "success";
}

/**
 * Dev OTP bypass: no 2factor SMS; any 6-digit code verifies.
 * Only when NODE_ENV is "development" (override with DEV_BYPASS_OTP=false or OTP_FORCE_LIVE=true).
 * Production / staging / test: always real 2factor (session + VERIFY flow).
 */
function isDevOtpBypassEnabled() {
  const forceLive = String(process.env.OTP_FORCE_LIVE ?? "").toLowerCase().trim();
  if (forceLive === "1" || forceLive === "true" || forceLive === "yes") {
    return false;
  }
  if (process.env.NODE_ENV !== "development") {
    return false;
  }
  const raw = String(
    process.env.DEV_BYPASS_OTP ?? process.env.SKIP_OTP ?? "",
  ).toLowerCase().trim();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  return true;
}

const DEV_OTP_PATTERN = /^\d{6}$/;

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
  const phoneKey = normalizePhoneForTwoFactor(mobile);
  console.log("[auth] OTP send raw mobile:", mobile, "→ 2factor phone key:", phoneKey);

  if (isDevOtpBypassEnabled()) {
    console.warn(
      "[auth] DEV_BYPASS_OTP: skipping SMS send (2factor). Use any 6-digit code to verify.",
    );
    clearOtpSession(phoneKey);
    return { Status: "Success", Details: "dev-bypass-no-sms" };
  }

  if (!phoneKey || phoneKey.length < 10) {
    throw new Error("Invalid mobile number for SMS");
  }

  const apiKey = getTwoFactorApiKey();
  const template = getTwoFactorTemplateName();
  /** Same shape as original integration: …/SMS/{no}/AUTOGEN/{templateName} */
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneKey}/AUTOGEN/${template}`;

  try {
    const response = await axios.get(url);
    const data = response?.data;
    console.log("[auth] 2factor send response:", data);

    if (!twoFactorResponseOk(data)) {
      const detail =
        (data && (data.Details || data.Message)) ||
        JSON.stringify(data || {}) ||
        "SMS send failed";
      throw new Error(typeof detail === "string" ? detail : "SMS send failed");
    }

    /** AUTOGEN success: Details = session id for SMS/VERIFY (not VERIFY3/phone/otp). */
    if (data?.Details && String(data.Details) !== "dev-bypass-no-sms") {
      rememberOtpSession(phoneKey, data.Details);
    }

    return data;
  } catch (error) {
    console.error("Error during mobile number authentication:", error);
    throw error;
  }
};

const verifyOTP = async (payload) => {
  const otp = payload?.otp != null ? String(payload.otp).trim() : "";
  const phoneKey = normalizePhoneForTwoFactor(payload?.mobile);
  console.log("[auth] OTP verify phone key:", phoneKey);

  if (isDevOtpBypassEnabled()) {
    clearOtpSession(phoneKey);
    if (DEV_OTP_PATTERN.test(otp)) {
      console.warn("[auth] DEV_BYPASS_OTP: accepting 6-digit code without 2factor verify.");
      return { Status: "Success", Details: "dev-bypass" };
    }
    return { Status: "Error", Details: "Dev mode: enter any 6-digit OTP" };
  }

  if (!phoneKey || !otp) {
    return { Status: "Error", Details: "Missing mobile or OTP" };
  }

  const apiKey = getTwoFactorApiKey();
  const explicitSession =
    payload?.otpSessionId != null && String(payload.otpSessionId).trim()
      ? String(payload.otpSessionId).trim()
      : null;
  const sessionId = explicitSession || getOtpSession(phoneKey);

  try {
    let data;

    if (sessionId) {
      /** Official 2factor flow after AUTOGEN (session id from send response Details) */
      const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
      const response = await axios.get(url);
      data = response?.data;
      console.log("[auth] 2factor VERIFY (session) response:", data);
    } else {
      /**
       * Legacy fallback: VERIFY3 with phone + OTP (older code path).
       * Uses same normalized key as AUTOGEN send when possible.
       */
      const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY3/${phoneKey}/${otp}`;
      const response = await axios.get(url);
      data = response?.data;
      console.warn("[auth] 2factor VERIFY3 (legacy, no session) response:", data);
    }

    if (!twoFactorResponseOk(data)) {
      return {
        Status: "Error",
        Details:
          (data && (data.Details || data.Message)) || "Invalid or expired OTP",
      };
    }

    clearOtpSession(phoneKey);
    return data;
  } catch (error) {
    console.error("Error verifying OTP code:", error);
    throw error;
  }
};

/**
 * SMS OTP for registration (not login). Uses same send/verify + dev bypass as /auth/login.
 * Mobile must call this instead of 2factor.in directly to avoid SMS cost in dev.
 */
export const handleSmsOtp = async (req, res) => {
  const { mobile, otp, otpSessionId } = req.body;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      Status: "Error",
      message: "Mobile number is required",
    });
  }

  try {
    if (!otp) {
      const sent = await sendOTP(mobile);
      const bypass = isDevOtpBypassEnabled();
      return res.status(200).json({
        success: true,
        Status: "Success",
        message: bypass
          ? "Dev: SMS skipped — use any 6-digit code."
          : "OTP sent successfully",
        devOtpBypass: bypass,
        otpSessionId:
          bypass ||
          !sent?.Details ||
          String(sent.Details).includes("dev-bypass")
            ? undefined
            : sent.Details,
      });
    }

    const otpResponse = await verifyOTP({ mobile, otp, otpSessionId });
    if (otpResponse?.Status !== "Success") {
      return res.status(400).json({
        success: false,
        Status: "Error",
        message: isDevOtpBypassEnabled()
          ? "Dev mode: OTP must be exactly 6 digits."
          : "Invalid or expired OTP",
      });
    }

    return res.status(200).json({
      success: true,
      Status: "Success",
      message: "OTP verified",
    });
  } catch (error) {
    console.error("handleSmsOtp:", error);
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      Status: "Error",
      message: error?.message || "OTP service error",
    });
  }
};

export const handleLogin = async (req, res) => {
  const tStart = performance.now();
  const { mobile, otp, otpSessionId } = req.body;

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
      const sent = await sendOTP(mobile);
      const bypass = isDevOtpBypassEnabled();

      return res.status(200).json({
        success: true,
        step: "OTP_SENT",
        message: bypass
          ? "Dev: SMS skipped — use any 6-digit code as OTP."
          : "OTP sent successfully",
        devOtpBypass: bypass,
        otpSessionId:
          bypass ||
          !sent?.Details ||
          String(sent.Details).includes("dev-bypass")
            ? undefined
            : sent.Details,
      });
    }

    /**
     * =====================================================
     * STEP 2️⃣ → VERIFY OTP
     * =====================================================
     */
    const otpResponse = await verifyOTP({ mobile, otp, otpSessionId });

    if (otpResponse?.Status !== "Success") {
      return res.status(400).json({
        success: false,
        message: isDevOtpBypassEnabled()
          ? "Dev mode: OTP must be exactly 6 digits."
          : "Invalid or expired OTP",
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

import { router } from "expo-router";
import auth from "@react-native-firebase/auth";
import API_CLIENT from ".";
import TOAST from "@/app/hooks/toast";
import { Platform } from "react-native";

const checkMobileExistance = async (payload: any) => {
  console.log("Pay---", payload);

  try {
    const response: any = await API_CLIENT.makePostRequest(
      "/user/check-mobile",
      payload,
    );
    return response;
  } catch (error: any) {
    console.log(
      `[Check Mobile] [userService] An error occurred while checking mobile number existence: `,
      error?.response?.data?.message,
    );

    // Display error message if the API call fails
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while checking mobile number existence.",
    );
    throw error;
  }
};

const register = async (payload: any) => {
  try {
    const source: "ios" | "android" | null =
      Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
          ? "android"
          : null;
    const data = await API_CLIENT.makePostRequest("/auth/register", {
      ...payload,
      source,
    });
    router.push("/screens/auth/login");
    return data?.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while adding new user : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message || "An error occurred while adding user",
    );
    throw error;
  }
};

const signIn = async (payload: any) => {
  try {
    const source: "ios" | "android" | "web" | null =
      Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
          ? "android"
          : Platform.OS === "web"
            ? "web"
            : null;
    console.log(
      `[Sign In] [userService] Signing in the user with API /auth/login and payload `,
      payload,
    );
    const data = await API_CLIENT.makePostRequest("/auth/login", {
      ...payload,
      ...(source ? { source } : {}),
    });
    console.log(
      `[Sign In] [userService] User signed in with the response `,
      data.data,
    );
    return data.data;
  } catch (error: any) {
    console.log(
      `[Sign In] [userService] An error occurred while signing the user `,
      error?.response?.data,
    );
    TOAST?.error(
      error?.response?.data?.message || "An error occurred while login user",
    );
    throw error;
  }
};

/** Registration OTP — backend only (dev SMS bypass, no client → 2factor). */
const sendOTP = async (mobile: string) => {
  console.log("mobile--", mobile);
  try {
    const res = await API_CLIENT.makePostRequest("/auth/sms-otp", { mobile });
    return res.data;
  } catch (error: any) {
    console.error("Error during mobile number authentication:", error);
    TOAST.error(
      error?.response?.data?.message ||
        "Error during mobile number authentication",
    );
    throw error;
  }
};

const verifyOTP = async (payload: {
  mobile: string;
  otp: string;
  otpSessionId?: string;
}) => {
  console.log("payload", payload);
  try {
    const res = await API_CLIENT.makePostRequest("/auth/sms-otp", payload);
    return res.data;
  } catch (error: any) {
    console.error("Error verifying OTP code:", error);
    TOAST.error(
      error?.response?.data?.message || "Error verifying OTP code",
    );
    throw error;
  }
};

const sendEmailCode = async (email: string) => {
  console.log("email", email);
  try {
    const response = await API_CLIENT.makePostRequest("/auth/send-email-code", {
      email,
    });
    return response;
  } catch (error) {
    console.error("Error during email verification:", error);
    throw error;
  }
};

const verifyEmailCode = async (code: string) => {
  console.log("code", code);
  try {
    const response = await API_CLIENT.makePostRequest(
      "/auth/verify-email-code",
      { code },
    );
    return response;
  } catch (error) {
    console.error("Error verifying email code:", error);
    throw error;
  }
};

const validateToken = async () => {
  try {
    const response: any = await API_CLIENT.makeGetRequest(
      "/auth/validate-token",
    );
    return response?.data;
  } catch (err) {
    console.error("Token validation network error:", err);
    return "FAILURE";
  }
};

const AUTH = {
  checkMobileExistance,
  register,
  signIn,
  sendOTP,
  verifyOTP,
  sendEmailCode,
  verifyEmailCode,
  validateToken,
};

export default AUTH;

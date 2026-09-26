import API_CLIENT from ".";
import TOAST from "@/app/hooks/toast";
import { getToken } from "@/utils/authStorage";
import {
  getApiErrorMessage,
  isAuthApiError,
  isNetworkApiError,
  isTransientApiError,
  logApiCatch,
} from "@/utils/apiError";

const registerDevice = async (payload: any) => {
  try {
    console.log(
      `[Sign In] [userService] registering the user device with API /notification/register and payload `,
      payload
    );
    await API_CLIENT.makePostRequest("/notification/register", payload);
    console.log(
      `[Sign In] [userService] user device registered successfully with the response `
    );
  } catch (error: any) {
    console.log(
      `[Sign In] [userService] An error occurred while registering user device `,
      error?.response?.data
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while registering user device"
    );
    throw error;
  }
};

const fetchAllNotifications = async ({ pageParam }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/notification/all?page=${pageParam}&limit=10`
    );
    return data?.data;
  } catch (error: unknown) {
    logApiCatch("[userService] fetch notifications failed", error);
    if (!isTransientApiError(error)) {
      TOAST?.error(
        getApiErrorMessage(error, "An error occurred while fetching all notifications"),
      );
    }
    throw error;
  }
};

const fetchUnreadNotificationsCount = async () => {
  const token = await getToken();
  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  try {
    const data = await API_CLIENT.makeGetRequest(`/notification/unread-count`);
    return data?.data;
  } catch (error: any) {
    // Background poll: a down API or flaky network must not open LogBox.
    if (isNetworkApiError(error) || isAuthApiError(error)) {
      return null;
    }
    console.warn(
      `[userService] unread notifications count failed:`,
      error?.response?.data?.message ?? error?.message,
    );
    return null;
  }
};

const markAsReadNotification = async (payload: any) => {
  console.log("payloaf --", payload);
  try {
    const data = await API_CLIENT.makePutRequest(
      `/notification/mark-read`,
      payload
    );
    return data.data;
  } catch (error: unknown) {
    logApiCatch("[userService] mark notification read failed", error);
    TOAST?.error(
      getApiErrorMessage(error, "An error occurred while marking as read notification"),
    );
    throw error;
  }
};

const updateNotificationConsent = async (notificationConsent: boolean) => {
  const data = await API_CLIENT.makePutRequest(
    "/notification/update-consent",
    { notificationConsent },
  );
  return data?.data;
};

const deactivateDevices = async () => {
  const data = await API_CLIENT.makePutRequest(
    "/notification/deactivate-devices",
    {},
  );
  return data?.data;
};

const markNotificationOpened = async (notificationId: string) => {
  if (!notificationId) return null;
  const data = await API_CLIENT.makePutRequest("/notification/opened", {
    notificationId,
  });
  return data?.data;
};

const NOTIFICATION = {
  registerDevice,
  fetchAllNotifications,
  fetchUnreadNotificationsCount,
  markAsReadNotification,
  updateNotificationConsent,
  deactivateDevices,
  markNotificationOpened,
};

export default NOTIFICATION;

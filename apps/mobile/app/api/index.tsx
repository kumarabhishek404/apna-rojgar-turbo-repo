import EventEmitter from "eventemitter3";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse } from "axios";
import { getToken, removeToken } from "@/utils/authStorage";
import { getClientDeviceHeaders } from "@/utils/clientDeviceInfo";
import { router } from "expo-router";
import TOAST from "@/app/hooks/toast";
import { t } from "@/utils/translationHelper";
import { isAuthApiError, markGlobalAuthErrorHandled } from "@/utils/apiError";
import reportError from "@/utils/reportError";

const eventEmitter = new EventEmitter();

const getHeaders = async (retries = 3, delay = 500) => {
  try {
    // const user = await AsyncStorage.getItem("user");
    const token = await getToken();

    if (!token || token === "null" || token === "undefined") {
      return { Authorization: "" };
    }

    if (token) {
      return { Authorization: `Bearer ${token}` };
    } else if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return getHeaders(retries - 1, delay);
    } else {
      return { Authorization: "" };
    }
  } catch (error) {
    console.error("Error retrieving token:", error);
    return { Authorization: "" };
  }
};

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
});

api.interceptors.request.use((config) => {
  const deviceHeaders = getClientDeviceHeaders();
  Object.assign(config.headers, deviceHeaders);
  return config;
});

let authLogoutInProgress = false;

const logout = async () => {
  if (authLogoutInProgress) return;
  authLogoutInProgress = true;

  try {
    console.log("🔒 Logout triggered from API client");
    await AsyncStorage.removeItem("user");
    await removeToken();
    router.replace("/screens/auth/login");
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    setTimeout(() => {
      authLogoutInProgress = false;
    }, 3000);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const errorMessage = error.response.data.message;
      const statusText = error.response.data.statusText;

      console.log("API Error:", error.response?.data);

      if (isAuthApiError(error)) {
        console.warn("Auth error from API. Logging out...");
        if (!authLogoutInProgress) {
          markGlobalAuthErrorHandled();
          TOAST.error(t("sessionExpiredPleaseLoginAgain"));
        }
        await logout();
      } else if (error.response.status >= 500) {
        const apiMessage =
          typeof errorMessage === "string" && errorMessage.trim()
            ? errorMessage
            : "API server error";
        void reportError({
          message: apiMessage,
          route: error.config?.url || "mobile-api",
          statusCode: error.response.status,
        });
      }

      if (
        error.response?.data &&
        (error.response?.data?.message === "User account is disabled" ||
          error.response?.data?.message === "User is not activated yet" ||
          error.response?.data?.message === "User is suspended")
      ) {
        router.replace("/(tabs)/fifth");
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request error:", error.message);
    }
    return Promise.reject(error);
  }
);

const makeGetRequest = async (url: string, headers?: object) => {
  return api.get(url, { headers: { ...(await getHeaders()), ...headers } });
};

const makePostRequest = async (
  url: string,
  body?: object,
  headers?: object
): Promise<AxiosResponse> => {
  return api.post(url, body, {
    headers: { ...(await getHeaders()), ...headers },
  });
};

const makePostRequestFormData = async (
  url: string,
  body: object,
  headers?: object
): Promise<AxiosResponse> => {
  return api.post(url, body, {
    headers: {
      ...(await getHeaders()),
      "Content-Type": "multipart/form-data",
      ...headers,
    },
  });
};

const makePutRequest = async (
  url: string,
  body: object,
  headers?: object
): Promise<AxiosResponse> => {
  return api.put(url, body, {
    headers: { ...(await getHeaders()), ...headers },
  });
};

const makePutRequestFormData = async (
  url: string,
  body: object,
  headers?: object
): Promise<AxiosResponse> => {
  return api.put(url, body, {
    headers: {
      ...(await getHeaders()),
      "Content-Type": "multipart/form-data",
      ...headers,
    },
  });
};

const makePatchRequest = async (
  url: string,
  body?: object,
  headers?: object
): Promise<AxiosResponse> => {
  return api.patch(url, body, {
    headers: { ...(await getHeaders()), ...headers },
  });
};

const makePatchRequestFormData = async (
  url: string,
  body: object,
  headers?: object
): Promise<AxiosResponse> => {
  return api.patch(url, body, {
    headers: {
      ...(await getHeaders()),
      "Content-Type": "multipart/form-data",
      ...headers,
    },
  });
};

const makeDeleteRequest = async (
  url: string,
  headers?: object
): Promise<AxiosResponse> => {
  return api.delete(url, { headers: { ...(await getHeaders()), ...headers } });
};

// Export API Client & Event Emitter
const API_CLIENT = {
  makeGetRequest,
  makePostRequest,
  makePostRequestFormData,
  makePutRequest,
  makePutRequestFormData,
  makePatchRequest,
  makePatchRequestFormData,
  makeDeleteRequest,
  eventEmitter,
};

export default API_CLIENT;

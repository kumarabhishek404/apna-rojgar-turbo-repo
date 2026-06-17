import EventEmitter from "eventemitter3";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse } from "axios";
import { getToken } from "@/utils/authStorage";
import { getClientDeviceHeaders } from "@/utils/clientDeviceInfo";
import { router } from "expo-router";

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

const toFormData = (body: unknown): FormData => {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }

  const formData = new FormData();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return formData;
  }

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (
      typeof value === "object" &&
      "uri" in value &&
      typeof (value as { uri?: unknown }).uri === "string"
    ) {
      formData.append(key, value as any);
      continue;
    }
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      continue;
    }
    formData.append(key, String(value));
  }

  return formData;
};

const formDataHasFileParts = (formData: FormData): boolean => {
  const parts = (formData as { _parts?: [string, unknown][] })._parts;
  if (!Array.isArray(parts)) return false;
  return parts.some(([, value]) => {
    return (
      value != null &&
      typeof value === "object" &&
      "uri" in value &&
      typeof (value as { uri?: unknown }).uri === "string"
    );
  });
};

const parseFetchResponseData = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? await response.json()
    : await response.text();
};

const toAxiosLikeResponse = (
  responseData: unknown,
  response: Response,
): AxiosResponse => ({
  data: responseData,
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries()),
  config: {} as AxiosResponse["config"],
  request: null as AxiosResponse["request"],
});

const FORM_DATA_TIMEOUT_MS = 120_000;

const makeFetchFormDataRequest = async (
  method: "POST" | "PUT" | "PATCH",
  url: string,
  formData: FormData,
  headers?: object,
): Promise<AxiosResponse> => {
  const authHeaders = await getHeaders();
  const deviceHeaders = getClientDeviceHeaders();
  const mergedHeaders: Record<string, string> = {
    ...deviceHeaders,
    ...(authHeaders as Record<string, string>),
    ...((headers as Record<string, string>) || {}),
  };

  // fetch + RN FormData: native layer must set multipart boundary for file parts.
  delete mergedHeaders["Content-Type"];
  delete mergedHeaders["content-type"];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FORM_DATA_TIMEOUT_MS);

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}${url}`, {
      method,
      headers: mergedHeaders,
      body: formData,
      signal: controller.signal,
    });

    const responseData = await parseFetchResponseData(response);

    if (!response.ok) {
      const error: any = new Error(
        (responseData as { message?: string })?.message ||
          `Request failed with ${response.status}`,
      );
      error.response = {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      };
      throw error;
    }

    return toAxiosLikeResponse(responseData, response);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      const timeoutError: any = new Error(
        "Upload timed out. Please check your internet and try again.",
      );
      timeoutError.response = { status: 408, data: { message: timeoutError.message } };
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const makeFormDataRequest = async (
  method: "POST" | "PUT" | "PATCH",
  url: string,
  body: any,
  headers?: object,
): Promise<AxiosResponse> => {
  const formData = toFormData(body);
  const hasFiles = formDataHasFileParts(formData);

  // Axios on RN still serializes FormData with files as x-www-form-urlencoded.
  if (hasFiles) {
    return makeFetchFormDataRequest(method, url, formData, headers);
  }

  return api.request({
    method: method.toLowerCase() as "post" | "put" | "patch",
    url,
    data: formData,
    headers: {
      ...getClientDeviceHeaders(),
      ...((await getHeaders()) as Record<string, string>),
      "Content-Type": "multipart/form-data",
      ...((headers as Record<string, string>) || {}),
    },
    transformRequest: (data) => data,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000,
  });
};

api.interceptors.request.use((config) => {
  const deviceHeaders = getClientDeviceHeaders();
  Object.assign(config.headers, deviceHeaders);
  return config;
});

const logout = async () => {
  try {
    console.log("🔒 Logout triggered from API client");
    await AsyncStorage.removeItem("user");
    // eventEmitter.emit("logout");
    router.replace('/screens/auth/login')
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const errorMessage = error.response.data.message;
      const statusText = error.response.data.statusText;

      console.log("API Error:", error.response?.data);

      if (
        errorMessage === "jwt expired" ||
        errorMessage === "jwt malformed" ||
        errorMessage === "Invalid Token" ||
        statusText === "TokenExpiredError" ||
        errorMessage === "Unauthorized Request" ||
        statusText === "Unauthorized Request"
      ) {
        console.warn("Token expired. Logging out...");
        logout();
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
  return makeFormDataRequest("POST", url, body, headers);
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
  return makeFormDataRequest("PUT", url, body, headers);
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
  return makeFormDataRequest("PATCH", url, body, headers);
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

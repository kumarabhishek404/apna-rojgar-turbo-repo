import { getToken } from "@/utils/authStorage";
import { getClientDeviceHeaders } from "@/utils/clientDeviceInfo";
import { getApiBaseUrl } from "@/constants/apiBaseUrl";

type ReportErrorInput = {
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  statusCode?: number;
};

const reportedKeys = new Set<string>();

const reportError = async ({
  message,
  stack,
  componentStack,
  route,
  statusCode = 500,
}: ReportErrorInput) => {
  const baseUrl = getApiBaseUrl();

  const dedupeKey = `${route || "unknown"}:${message}`.slice(0, 200);
  if (reportedKeys.has(dedupeKey)) {
    return;
  }
  reportedKeys.add(dedupeKey);

  try {
    const token = await getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getClientDeviceHeaders(),
    };

    if (token && token !== "null" && token !== "undefined") {
      headers.Authorization = `Bearer ${token}`;
    }

    await fetch(`${baseUrl}/errors/report`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "mobile",
        message,
        stack,
        componentStack,
        route,
        statusCode,
      }),
    });
  } catch (error) {
    if (__DEV__) {
      console.warn("[reportError] Failed to report error", error);
    }
  }
};

export default reportError;

import type { AxiosError } from "axios";
import { t } from "@/utils/translationHelper";

const AUTH_ERROR_MESSAGES = new Set([
  "Invalid Token",
  "Unauthorized Request",
  "login expired",
  "jwt expired",
  "jwt malformed",
]);

const AUTH_STATUS_TEXTS = new Set(["TokenExpiredError", "Unauthorized Request"]);

/** Device offline, API host down, or the phone cannot reach the configured URL. */
export function isNetworkApiError(error: unknown): boolean {
  const axiosErr = error as AxiosError;
  if (axiosErr?.response) return false;
  const code = String(axiosErr?.code || "");
  const message = String(axiosErr?.message || "");
  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    /network error|network request failed|failed to fetch/i.test(message)
  );
}

export function isAuthApiError(error: unknown): boolean {
  const axiosErr = error as AxiosError<{ message?: string; statusText?: string }>;
  const message = axiosErr?.response?.data?.message;
  const statusText = axiosErr?.response?.data?.statusText;
  const status = axiosErr?.response?.status;

  if (message && AUTH_ERROR_MESSAGES.has(message)) return true;
  if (statusText && AUTH_STATUS_TEXTS.has(statusText)) return true;
  if (status === 401) return true;

  return false;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const axiosErr = error as AxiosError<{ message?: string; errorCode?: string }>;
  const code = axiosErr?.response?.data?.errorCode;
  if (code === "PAY_PER_DAY_TOO_LOW") {
    return t("payPerDayMustBeAtLeast500");
  }
  if (code === "PAY_PER_DAY_REQUIRED") {
    return t("payPerDayIsRequired");
  }
  const message = axiosErr?.response?.data?.message;
  if (typeof message === "string" && /pay per day must be at least/i.test(message)) {
    return t("payPerDayMustBeAtLeast500");
  }
  if (typeof message === "string" && message.trim()) return message.trim();
  if (axiosErr?.message?.trim()) return axiosErr.message.trim();
  return fallback;
}

/** No usable HTTP body — already warned by the axios interceptor. */
export function isTransientApiError(error: unknown): boolean {
  return isNetworkApiError(error) || isAuthApiError(error);
}

/**
 * Failed API catch without RN LogBox (`console.error` in __DEV__).
 * Network/auth are silent here; the interceptor already reports ERR_NETWORK.
 */
export function logApiCatch(scope: string, error: unknown): void {
  if (isTransientApiError(error)) return;
  console.warn(scope, getApiErrorMessage(error, ""));
}

/** Set when the API client shows the global session-expired toast. */
let globalAuthErrorHandledUntil = 0;

export function markGlobalAuthErrorHandled(durationMs = 6000) {
  globalAuthErrorHandledUntil = Date.now() + durationMs;
}

export function shouldSuppressAuthErrorToast(message?: string): boolean {
  if (!message?.trim()) return false;

  const normalized = message.trim().toLowerCase();
  const authLike = [
    "invalid token",
    "unauthorized request",
    "login expired",
    "jwt expired",
    "jwt malformed",
  ].some((token) => normalized.includes(token));

  if (!authLike) return false;

  // Global session toast already shown; skip duplicate token errors from API catches.
  return Date.now() < globalAuthErrorHandledUntil;
}

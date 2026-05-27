import type { AxiosError } from "axios";

const AUTH_ERROR_MESSAGES = new Set([
  "Invalid Token",
  "Unauthorized Request",
  "login expired",
  "jwt expired",
  "jwt malformed",
]);

const AUTH_STATUS_TEXTS = new Set(["TokenExpiredError", "Unauthorized Request"]);

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
  const axiosErr = error as AxiosError<{ message?: string }>;
  const message = axiosErr?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  if (axiosErr?.message?.trim()) return axiosErr.message.trim();
  return fallback;
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

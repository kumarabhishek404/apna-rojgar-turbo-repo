const EXPECTED_VALIDATION_CODES = new Set([
  "PAY_PER_DAY_TOO_LOW",
  "PAY_PER_DAY_REQUIRED",
  "REQUIREMENTS_REQUIRED",
  "REQUIREMENT_NAME_REQUIRED",
  "REQUIREMENT_COUNT_INVALID",
  "INVALID_REQUIREMENTS",
  "MISSING_FIELDS",
]);

const NETWORK_CODES = new Set([
  "ERR_NETWORK",
  "NETWORK_ERROR",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNREFUSED",
  "ERR_INTERNET_DISCONNECTED",
  "ERR_CONNECTION_TIMED_OUT",
]);

const otpConfigLoggedOnce = { value: false };

function asText(value) {
  return String(value || "");
}

export function isExpectedValidationError(error, statusCode, errorCode) {
  const code = asText(errorCode || error?.code);
  if (EXPECTED_VALIDATION_CODES.has(code)) return true;
  if (Number(statusCode) === 400 && /pay per day/i.test(asText(error?.message))) {
    return true;
  }
  return false;
}

export function isClientNetworkNoise(error, errorCode, message) {
  const code = asText(errorCode || error?.code);
  const text = `${asText(message)} ${asText(error?.message)} ${asText(error?.name)}`;
  if (NETWORK_CODES.has(code)) return true;
  if (/ERR_NETWORK|Network Error|Failed to fetch|network request failed/i.test(text)) {
    return true;
  }
  return false;
}

export function isChunkLoadNoise(error, errorName, message) {
  const text = `${asText(errorName)} ${asText(error?.name)} ${asText(message)} ${asText(error?.message)}`;
  return /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module/i.test(
    text,
  );
}

/**
 * Expected client validation, offline devices, and stale website chunks
 * should not create ErrorLog rows. OTP_NOT_CONFIGURED is logged once per process.
 */
export function shouldSkipErrorLog({
  error,
  statusCode,
  errorCode,
  errorName,
  message,
} = {}) {
  if (Number(statusCode) === 0) return true;
  if (isExpectedValidationError(error, statusCode, errorCode)) return true;
  if (isClientNetworkNoise(error, errorCode, message)) return true;
  if (isChunkLoadNoise(error, errorName, message)) return true;

  const code = asText(errorCode || error?.code);
  if (code === "OTP_NOT_CONFIGURED") {
    if (otpConfigLoggedOnce.value) return true;
    otpConfigLoggedOnce.value = true;
  }

  return false;
}

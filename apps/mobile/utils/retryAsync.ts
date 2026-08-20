const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isNonRetryableError(error: unknown): boolean {
  const status = Number((error as { response?: { status?: number } })?.response?.status);
  if (Number.isFinite(status) && status >= 400 && status < 500) {
    return true;
  }
  const code = String(
    (error as { response?: { data?: { errorCode?: string } } })?.response?.data
      ?.errorCode || "",
  );
  return (
    code === "PAY_PER_DAY_TOO_LOW" ||
    code === "PAY_PER_DAY_REQUIRED" ||
    code === "REQUIREMENTS_REQUIRED"
  );
}

/** Retry async calls on network failures — never retry the same 4xx validation payload. */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const { retries = 3, baseDelayMs = 2000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isNonRetryableError(error) || attempt === retries - 1) break;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}

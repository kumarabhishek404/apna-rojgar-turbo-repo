const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retry async calls on network failures — helpful on slow/unstable connections. */
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
      if (attempt === retries - 1) break;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}

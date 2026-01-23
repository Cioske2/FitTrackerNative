export interface FetchRetryOptions {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions: FetchRetryOptions = {},
): Promise<Response> {
  const { retries = 2, backoffMs = 400, timeoutMs = 8000 } = retryOptions;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < retries) {
        await wait(backoffMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

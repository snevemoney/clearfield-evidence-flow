const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || !RETRYABLE.has(res.status)) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error("fetch failed");
}

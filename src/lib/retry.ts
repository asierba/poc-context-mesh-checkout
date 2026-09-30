export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  isRetryable: (error: unknown) => boolean;
};

export async function withRetry<T>(policy: RetryPolicy, operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= policy.maxAttempts || !policy.isRetryable(error)) {
        throw error;
      }
      await sleep(policy.baseDelayMs * 2 ** (attempt - 1));
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

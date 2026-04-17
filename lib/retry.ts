/**
 * Exponential backoff retry utility with jitter
 * Default: max 3 attempts, base delay of 500ms, max delay of 5000ms
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  {
    maxAttempts = 3,
    baseDelay = 500,
    maxDelay = 5000,
    onRetry,
  }: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {},
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * exponentialDelay * 0.1; // 10% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      onRetry?.(attempt, lastError);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Max retry attempts exceeded');
}

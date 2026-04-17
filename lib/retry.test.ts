import { retryWithBackoff } from '@/lib/retry';

describe('Retry with Backoff', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('resolves on first attempt if successful', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries on failure and eventually succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce('success');

    const result = await retryWithBackoff(fn, { 
      maxAttempts: 3,
      baseDelay: 10,
      maxDelay: 50,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  }, 15000);

  test('throws after max attempts exceeded', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retryWithBackoff(fn, { 
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 50,
      })
    ).rejects.toThrow('always fails');
    
    expect(fn).toHaveBeenCalledTimes(2);
  }, 15000);

  test('calls onRetry callback on failures', async () => {
    const onRetry = jest.fn();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValueOnce('success');

    await retryWithBackoff(fn, { 
      maxAttempts: 2,
      baseDelay: 10,
      maxDelay: 50,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  }, 15000);

  test('exponential backoff increases delay', async () => {
    const delays: number[] = [];
    const fn = jest.fn().mockImplementation(() => {
      delays.push(Date.now());
      return Promise.reject(new Error('fail'));
    });

    try {
      await retryWithBackoff(fn, { 
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
      });
    } catch (e) {
      // Expected to fail
    }

    // Should have attempted 3 times
    expect(fn).toHaveBeenCalledTimes(3);
    
    // Second attempt should be delayed compared to first
    if (delays.length >= 2) {
      const timeBetweenFirstAndSecond = delays[1] - delays[0];
      expect(timeBetweenFirstAndSecond).toBeGreaterThanOrEqual(5);
    }
  }, 15000);
});

/**
 * Debounce utility for delaying function execution.
 * Used to batch rapid state changes before writing to AsyncStorage.
 */

export function createDebounce<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void> | void,
  delayMs: number,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  return function debounced(...args: Args) {
    pendingArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (pendingArgs) {
        fn(...pendingArgs);
      }
      timeoutId = null;
      pendingArgs = null;
    }, delayMs);
  };
}

/**
 * Immediately execute any pending debounced call.
 * Useful for cleanup/unmount to ensure final state is saved.
 */
export function flushDebounce<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void> | void,
  debounced: (...args: Args) => void,
  lastArgs: Args | null,
) {
  if (lastArgs) {
    fn(...lastArgs);
  }
}

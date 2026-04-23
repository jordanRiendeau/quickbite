/**
 * Error telemetry and logging infrastructure.
 * In production, this would integrate with Sentry, LogRocket, or similar.
 * For now, it provides structured logging and error tracking.
 */

export interface ErrorEvent {
  message: string;
  error?: Error | unknown;
  context?: Record<string, unknown>;
  timestamp: number;
}

class ErrorLogger {
  private events: ErrorEvent[] = [];
  private maxEvents = 100;

  /**
   * Log an error or warning event.
   */
  captureError(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    const event: ErrorEvent = {
      message,
      error,
      context,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep only recent events to prevent memory bloat
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Also log to console in development
    if (__DEV__) {
      console.error(`[ErrorLogger] ${message}`, { error, context });
    }
  }

  /**
   * Capture API validation errors (response doesn't match schema).
   */
  captureValidationError(source: 'spoonacular' | 'mealdb', error: Error, payload?: unknown) {
    this.captureError(
      `API validation failed: ${source}`,
      error,
      { source, payloadSize: JSON.stringify(payload).length },
    );
  }

  /**
   * Capture API network/runtime errors.
   */
  captureAPIError(source: 'spoonacular' | 'mealdb', error: Error, attempt: number) {
    this.captureError(
      `API call failed: ${source}`,
      error,
      { source, attempt },
    );
  }

  /**
   * Capture AsyncStorage errors.
   */
  captureStorageError(operation: 'read' | 'write', error: Error) {
    this.captureError(
      `AsyncStorage error: ${operation}`,
      error,
      { operation },
    );
  }

  /**
   * Get all recent error events (for debugging/analytics).
   */
  getEvents(): ErrorEvent[] {
    return [...this.events];
  }

  /**
   * Clear error history.
   */
  clear() {
    this.events = [];
  }
}

export const errorLogger = new ErrorLogger();

// Enable development mode flag if available
declare const __DEV__: boolean;

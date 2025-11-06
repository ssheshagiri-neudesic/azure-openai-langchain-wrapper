// src/utils/retry.js
/**
 * Retry utility for handling transient failures
 * Implements exponential backoff with jitter
 */

import pRetry from 'p-retry';
import { Logger } from './logger.js';
import { ErrorHandler } from './errors.js';
import { appConfig } from '../config/config.js';

/**
 * Retry wrapper for async functions
 */
export class RetryWrapper {
  /**
   * Execute function with retry logic
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Retry options
   * @param {number} options.retries - Number of retry attempts (default: from config)
   * @param {number} options.minTimeout - Minimum retry timeout in ms (default: from config)
   * @param {number} options.maxTimeout - Maximum retry timeout in ms (default: 30000)
   * @param {number} options.factor - Exponential backoff factor (default: 2)
   * @param {boolean} options.randomize - Add jitter to retry delays (default: true)
   */
  static async execute(fn, options = {}) {
    const retries = options.retries ?? appConfig.maxRetryAttempts;
    const minTimeout = options.minTimeout ?? appConfig.retryDelayMs;
    const maxTimeout = options.maxTimeout ?? 30000;
    const factor = options.factor ?? 2;
    const randomize = options.randomize ?? true;

    // If retry is disabled, execute once without retry
    if (!appConfig.enableRetry) {
      return fn();
    }

    const retryOptions = {
      retries,
      minTimeout,
      maxTimeout,
      factor,
      randomize,
      onFailedAttempt: (error) => {
        Logger.warn(`Retry attempt ${error.attemptNumber} failed`, {
          retriesLeft: error.retriesLeft,
          error: error.message,
        });
      },
    };

    return pRetry(async (attemptNumber) => {
      try {
        const startTime = Date.now();
        const result = await fn(attemptNumber);

        if (attemptNumber > 1) {
          Logger.info('Operation succeeded after retry', {
            attemptNumber,
            duration: Date.now() - startTime,
          });
        }

        return result;
      } catch (error) {
        const handledError = ErrorHandler.handle(error);

        // Check if error is retryable
        if (!ErrorHandler.isRetryable(handledError)) {
          Logger.debug('Error is not retryable, aborting', {
            error: handledError.message,
          });
          throw new pRetry.AbortError(handledError);
        }

        throw handledError;
      }
    }, retryOptions);
  }
}

export default RetryWrapper;

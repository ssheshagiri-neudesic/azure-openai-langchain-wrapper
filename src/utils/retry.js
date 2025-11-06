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
 * Retry configuration options
 */
export class RetryOptions {
  constructor(options = {}) {
    this.retries = options.retries ?? appConfig.maxRetryAttempts;
    this.minTimeout = options.minTimeout ?? appConfig.retryDelayMs;
    this.maxTimeout = options.maxTimeout ?? 30000;
    this.factor = options.factor ?? 2;
    this.randomize = options.randomize ?? true;
    this.onFailedAttempt = options.onFailedAttempt ?? this.defaultOnFailedAttempt;
  }

  /**
   * Default handler for failed attempts
   */
  defaultOnFailedAttempt(error) {
    Logger.warn(`Retry attempt ${error.attemptNumber} failed`, {
      retriesLeft: error.retriesLeft,
      error: error.message,
    });
  }

  /**
   * Convert to p-retry options
   */
  toPRetryOptions() {
    return {
      retries: this.retries,
      minTimeout: this.minTimeout,
      maxTimeout: this.maxTimeout,
      factor: this.factor,
      randomize: this.randomize,
      onFailedAttempt: this.onFailedAttempt,
    };
  }
}

/**
 * Retry wrapper for async functions
 */
export class RetryWrapper {
  /**
   * Execute function with retry logic
   */
  static async execute(fn, options = {}) {
    const retryOptions = new RetryOptions(options);
    
    if (!appConfig.enableRetry) {
      // If retry is disabled, execute once
      return fn();
    }

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
          throw new pRetry.AbortError(handledError);
        }
        
        throw handledError;
      }
    }, retryOptions.toPRetryOptions());
  }

  /**
   * Execute with custom retry condition
   */
  static async executeWithCondition(fn, shouldRetry, options = {}) {
    const retryOptions = new RetryOptions(options);
    
    return pRetry(async (attemptNumber) => {
      try {
        return await fn(attemptNumber);
      } catch (error) {
        if (!shouldRetry(error, attemptNumber)) {
          throw new pRetry.AbortError(error);
        }
        throw error;
      }
    }, retryOptions.toPRetryOptions());
  }

  /**
   * Execute with circuit breaker pattern
   */
  static async executeWithCircuitBreaker(fn, options = {}) {
    const { 
      threshold = 5, 
      timeout = 60000,
      resetTimeout = 30000 
    } = options;
    
    // Simple circuit breaker implementation
    if (!this.circuitBreaker) {
      this.circuitBreaker = {
        failures: 0,
        lastFailureTime: null,
        state: 'closed', // closed, open, half-open
      };
    }

    const breaker = this.circuitBreaker;

    // Check if circuit is open
    if (breaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
      
      if (timeSinceLastFailure > resetTimeout) {
        breaker.state = 'half-open';
        Logger.info('Circuit breaker moving to half-open state');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await this.execute(fn, options);
      
      // Reset on success
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.failures = 0;
        Logger.info('Circuit breaker closed');
      }
      
      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failures >= threshold) {
        breaker.state = 'open';
        Logger.error('Circuit breaker opened', null, { 
          failures: breaker.failures 
        });
      }
      
      throw error;
    }
  }
}

/**
 * Decorator for adding retry logic to class methods
 */
export function withRetry(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args) {
      return RetryWrapper.execute(
        () => originalMethod.apply(this, args),
        options
      );
    };
    
    return descriptor;
  };
}

export default RetryWrapper;

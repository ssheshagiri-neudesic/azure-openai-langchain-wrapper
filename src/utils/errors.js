// src/utils/errors.js
/**
 * Custom error classes for better error handling and debugging
 */

/**
 * Base error class for all custom errors
 */
export class BaseError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends BaseError {
  constructor(message, details = null) {
    super(`Configuration Error: ${message}`, 500, details);
  }
}

/**
 * Azure OpenAI API error
 */
export class AzureOpenAIError extends BaseError {
  constructor(message, statusCode = 500, details = null) {
    super(`Azure OpenAI Error: ${message}`, statusCode, details);
  }
}

/**
 * Prompt template error
 */
export class PromptTemplateError extends BaseError {
  constructor(message, details = null) {
    super(`Prompt Template Error: ${message}`, 400, details);
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429, { retryAfter });
  }
}

/**
 * Validation error
 */
export class ValidationError extends BaseError {
  constructor(message, validationErrors = null) {
    super(`Validation Error: ${message}`, 400, { validationErrors });
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handle and format errors consistently
   */
  static handle(error, context = '') {
    if (error instanceof BaseError) {
      return error;
    }

    // Handle Azure OpenAI specific errors
    if (error.response?.status) {
      const statusCode = error.response.status;
      const message = error.response.data?.error?.message || error.message;
      
      switch (statusCode) {
        case 429:
          return new RateLimitError(message, error.response.headers['retry-after']);
        case 401:
          return new AzureOpenAIError('Authentication failed', 401);
        case 404:
          return new AzureOpenAIError('Resource not found', 404);
        default:
          return new AzureOpenAIError(message, statusCode);
      }
    }

    // Handle LangChain errors
    if (error.name === 'LangChainError') {
      return new BaseError(`LangChain Error: ${error.message}`, 500, { 
        originalError: error.name,
        context 
      });
    }

    // Default error handling
    return new BaseError(
      error.message || 'An unexpected error occurred',
      500,
      { originalError: error.name, context }
    );
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error) {
    if (error instanceof RateLimitError) return true;
    if (error instanceof AzureOpenAIError) {
      return [429, 500, 502, 503, 504].includes(error.statusCode);
    }
    return false;
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error, attempt = 1, baseDelay = 1000) {
    if (error instanceof RateLimitError && error.details?.retryAfter) {
      return error.details.retryAfter * 1000;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }
}

export default ErrorHandler;

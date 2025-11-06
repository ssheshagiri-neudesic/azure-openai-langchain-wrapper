// src/utils/logger.js
/**
 * Logger utility using Winston
 * Provides structured logging with different levels and formats
 */

import winston from 'winston';
import { appConfig } from '../config/config.js';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

/**
 * Custom log format for development
 */
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

/**
 * Create logger instance with appropriate configuration
 */
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return winston.createLogger({
    level: appConfig.logLevel,
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      isDevelopment ? combine(colorize(), devFormat) : json()
    ),
    transports: [
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
    exitOnError: false,
  });
};

// Create and export logger instance
const logger = createLogger();

/**
 * Log method wrapper for consistent logging patterns
 */
export class Logger {
  static info(message, meta = {}) {
    logger.info(message, meta);
  }

  static error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...meta
    } : meta;
    
    logger.error(message, errorMeta);
  }

  static warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  static debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  /**
   * Log API calls for monitoring
   */
  static logApiCall(operation, duration, success, meta = {}) {
    const level = success ? 'info' : 'error';
    logger.log(level, `API Call: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      success,
      ...meta
    });
  }

  /**
   * Log prompt execution for debugging
   */
  static logPrompt(promptType, input, output = null, meta = {}) {
    logger.debug('Prompt Execution', {
      promptType,
      inputLength: input?.length || 0,
      outputLength: output?.length || 0,
      ...meta
    });
  }
}

export default Logger;

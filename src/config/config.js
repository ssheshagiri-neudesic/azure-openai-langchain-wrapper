// src/config/config.js
/**
 * Configuration management module
 * Centralizes all configuration with validation and default values
 */

import dotenv from 'dotenv';
import Joi from 'joi';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Configuration schema for validation
 */
const configSchema = Joi.object({
  azure: {
    openai: {
      apiKey: Joi.string().required().description('Azure OpenAI API Key'),
      endpoint: Joi.string().uri().required().description('Azure OpenAI Endpoint'),
      apiVersion: Joi.string().default('2024-02-15-preview').description('API Version'),
      deploymentName: Joi.string().required().description('Deployment Name'),
      modelName: Joi.string().default('gpt-4').description('Model Name'),
      temperature: Joi.number().min(0).max(2).default(0.7),
      maxTokens: Joi.number().integer().min(1).default(2000),
    }
  },
  app: {
    logLevel: Joi.string()
      .valid('error', 'warn', 'info', 'debug')
      .default('info'),
    enableRetry: Joi.boolean().default(true),
    maxRetryAttempts: Joi.number().integer().min(0).default(3),
    retryDelayMs: Joi.number().integer().min(100).default(1000),
  },
  rateLimit: {
    requestsPerMinute: Joi.number().integer().min(1).default(60),
  }
}).unknown();

/**
 * Build configuration object from environment variables
 */
const buildConfig = () => {
  const config = {
    azure: {
      openai: {
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        endpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        modelName: process.env.AZURE_OPENAI_MODEL_NAME,
        temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE) || 0.7,
        maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS) || 2000,
      }
    },
    app: {
      logLevel: process.env.LOG_LEVEL || 'info',
      enableRetry: process.env.ENABLE_RETRY !== 'false',
      maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
      retryDelayMs: parseInt(process.env.RETRY_DELAY_MS) || 1000,
    },
    rateLimit: {
      requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 60,
    }
  };

  return config;
};

/**
 * Validate and export configuration
 */
const validateConfig = () => {
  const config = buildConfig();
  const { error, value } = configSchema.validate(config, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    throw new Error(`Configuration validation error: ${error.message}`);
  }

  return value;
};

// Export validated configuration
export const config = validateConfig();

// Export individual config sections for convenience
export const azureConfig = config.azure.openai;
export const appConfig = config.app;
export const rateLimitConfig = config.rateLimit;

export default config;

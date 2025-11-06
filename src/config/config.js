// src/config/config.js
/**
 * Configuration management module
 * Centralizes all configuration with sensible defaults
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * Validate required configuration
 */
function validateRequired(config) {
  const required = ['apiKey', 'endpoint', 'deploymentName'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Azure OpenAI configuration: ${missing.join(', ')}. ` +
      `Please set the following environment variables: ${missing.map(k =>
        `AZURE_OPENAI_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`
      ).join(', ')}`
    );
  }
}

/**
 * Azure OpenAI configuration
 */
export const azureConfig = {
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  modelName: process.env.AZURE_OPENAI_MODEL_NAME || 'gpt-4',
  temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS) || 2000,
};

/**
 * Application configuration
 */
export const appConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  enableRetry: process.env.ENABLE_RETRY !== 'false',
  maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS) || 1000,
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 60,
};

/**
 * Combined configuration
 */
export const config = {
  azure: {
    openai: azureConfig
  },
  app: appConfig,
  rateLimit: rateLimitConfig,
};

// Validate required fields
validateRequired(azureConfig);

export default config;

// src/index.js
/**
 * Azure OpenAI LangChain Wrapper
 * Simplified entry point and exports
 */

// Core service
import {
  AzureOpenAIService as AzureOpenAIServiceClass,
  createAzureOpenAIService as createService,
} from "./services/azure-openai-service.js";
export {
  AzureOpenAIServiceClass as AzureOpenAIService,
  createService as createAzureOpenAIService,
};

// Utilities
export { Logger } from "./utils/logger.js";
export {
  BaseError,
  ConfigurationError,
  AzureOpenAIError,
  PromptTemplateError,
  RateLimitError,
  ValidationError,
  ErrorHandler,
} from "./utils/errors.js";
export { RetryWrapper } from "./utils/retry.js";

// Configuration
export {
  config,
  azureConfig,
  appConfig,
  rateLimitConfig,
} from "./config/config.js";

/**
 * Quick start helper - creates and initializes service with convenience methods
 * @param {Object} options - Configuration options to override defaults
 * @returns {Object} Service instance with convenience methods
 */
export async function quickStart(options = {}) {
  const service = await createService(options);
  return {
    service,
    // Convenience method for chat
    chat: (input, opts) => service.chat(input, opts),
    // Convenience method for streaming
    stream: (input, opts) => service.stream(input, opts),
    // Convenience method for batch processing
    batch: (inputs, opts) => service.batchProcess(inputs, opts),
  };
}

// Default export
export default {
  AzureOpenAIService: AzureOpenAIServiceClass,
  createAzureOpenAIService: createService,
  quickStart,
};

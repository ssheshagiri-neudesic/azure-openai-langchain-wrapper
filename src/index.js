// src/index.js
/**
 * Azure OpenAI LangChain Wrapper
 * Main entry point and exports
 */

// Core services
export { AzureOpenAIService, createAzureOpenAIService } from './services/azure-openai-service.js';

// Prompt management
export { 
  PromptManager, 
  getPromptManager, 
  PromptStrategy,
  prompts 
} from './prompts/prompt-manager.js';

// Prompt strategies
export { ZeroShotPrompt, createZeroShotPrompt } from './prompts/strategies/zero-shot.js';
export { FewShotPrompt, createFewShotPrompt } from './prompts/strategies/few-shot.js';
export { ChainOfThoughtPrompt, createChainOfThoughtPrompt } from './prompts/strategies/chain-of-thought.js';
export { RetrievalAugmentedPrompt, createRetrievalAugmentedPrompt } from './prompts/strategies/retrieval-augmented.js';

// Base classes
export { BasePromptStrategy, PromptBuilder } from './prompts/base-prompt.js';

// Utilities
export { Logger } from './utils/logger.js';
export { 
  BaseError,
  ConfigurationError,
  AzureOpenAIError,
  PromptTemplateError,
  RateLimitError,
  ValidationError,
  ErrorHandler 
} from './utils/errors.js';
export { RetryWrapper, RetryOptions, withRetry } from './utils/retry.js';

// Configuration
export { config, azureConfig, appConfig, rateLimitConfig } from './config/config.js';

/**
 * Quick start helper
 */
export async function quickStart(options = {}) {
  const service = await createAzureOpenAIService(options);
  return {
    service,
    // Convenience methods
    zeroShot: (input, opts) => service.executeZeroShot(input, opts),
    fewShot: (input, examples, opts) => service.executeFewShot(input, examples, opts),
    chainOfThought: (input, opts) => service.executeChainOfThought(input, opts),
    rag: (input, context, opts) => service.executeRAG(input, context, opts),
  };
}

// Default export
export default {
  AzureOpenAIService,
  createAzureOpenAIService,
  quickStart,
  PromptManager,
  getPromptManager,
};

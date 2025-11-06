// src/prompts/prompt-manager.js
/**
 * Prompt Manager
 * Central manager for all prompting strategies
 */

import { Logger } from '../utils/logger.js';
import { PromptTemplateError } from '../utils/errors.js';
import { PromptBuilder } from './base-prompt.js';

// Import all strategies
import { ZeroShotPrompt } from './strategies/zero-shot.js';
import { FewShotPrompt } from './strategies/few-shot.js';
import { ChainOfThoughtPrompt } from './strategies/chain-of-thought.js';
import { RetrievalAugmentedPrompt } from './strategies/retrieval-augmented.js';

/**
 * Prompt strategy types
 */
export const PromptStrategy = {
  ZERO_SHOT: 'zero-shot',
  FEW_SHOT: 'few-shot',
  CHAIN_OF_THOUGHT: 'chain-of-thought',
  RETRIEVAL_AUGMENTED: 'retrieval-augmented',
};

/**
 * Prompt Manager class
 */
export class PromptManager {
  constructor() {
    this.strategies = new Map();
    this.defaultStrategy = PromptStrategy.ZERO_SHOT;
    this.cache = new Map();
    this.cacheEnabled = true;
    
    // Register default strategies
    this.registerDefaultStrategies();
  }

  /**
   * Register default prompt strategies
   */
  registerDefaultStrategies() {
    this.registerStrategy(PromptStrategy.ZERO_SHOT, ZeroShotPrompt);
    this.registerStrategy(PromptStrategy.FEW_SHOT, FewShotPrompt);
    this.registerStrategy(PromptStrategy.CHAIN_OF_THOUGHT, ChainOfThoughtPrompt);
    this.registerStrategy(PromptStrategy.RETRIEVAL_AUGMENTED, RetrievalAugmentedPrompt);
    
    Logger.info('Default prompt strategies registered');
  }

  /**
   * Register a custom prompt strategy
   */
  registerStrategy(name, strategyClass) {
    if (!strategyClass || typeof strategyClass !== 'function') {
      throw new Error('Strategy class must be a constructor function');
    }
    
    this.strategies.set(name, strategyClass);
    Logger.debug(`Registered prompt strategy: ${name}`);
    return this;
  }

  /**
   * Create a prompt using specified strategy
   */
  async createPrompt(strategy = this.defaultStrategy, options = {}) {
    const StrategyClass = this.strategies.get(strategy);
    
    if (!StrategyClass) {
      throw new PromptTemplateError(
        `Unknown prompt strategy: ${strategy}`,
        { availableStrategies: Array.from(this.strategies.keys()) }
      );
    }

    try {
      const prompt = new StrategyClass(options);
      await prompt.initialize();
      
      Logger.info(`Created ${strategy} prompt`, { options });
      return prompt;
    } catch (error) {
      Logger.error(`Failed to create ${strategy} prompt`, error);
      throw error;
    }
  }

  /**
   * Create a prompt builder for fluent API
   */
  builder(strategy = this.defaultStrategy, options = {}) {
    const StrategyClass = this.strategies.get(strategy);
    
    if (!StrategyClass) {
      throw new PromptTemplateError(`Unknown prompt strategy: ${strategy}`);
    }
    
    const strategyInstance = new StrategyClass(options);
    return new PromptBuilder(strategyInstance);
  }

  /**
   * Create and cache a prompt
   */
  async getOrCreatePrompt(key, strategy, options = {}) {
    if (this.cacheEnabled && this.cache.has(key)) {
      Logger.debug(`Using cached prompt: ${key}`);
      return this.cache.get(key);
    }

    const prompt = await this.createPrompt(strategy, options);
    
    if (this.cacheEnabled) {
      this.cache.set(key, prompt);
    }
    
    return prompt;
  }

  /**
   * Clear prompt cache
   */
  clearCache() {
    this.cache.clear();
    Logger.debug('Prompt cache cleared');
  }

  /**
   * Set default strategy
   */
  setDefaultStrategy(strategy) {
    if (!this.strategies.has(strategy)) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }
    this.defaultStrategy = strategy;
    return this;
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Create prompt for specific use case
   */
  async createForUseCase(useCase, options = {}) {
    const useCaseMapping = {
      'qa': { strategy: PromptStrategy.ZERO_SHOT, useCase: 'question_answering' },
      'classification': { strategy: PromptStrategy.ZERO_SHOT, useCase: 'classification' },
      'summarization': { strategy: PromptStrategy.ZERO_SHOT, useCase: 'summarization' },
      'extraction': { strategy: PromptStrategy.ZERO_SHOT, useCase: 'extraction' },
      'reasoning': { strategy: PromptStrategy.CHAIN_OF_THOUGHT, useCase: 'reasoning' },
      'rag-qa': { strategy: PromptStrategy.RETRIEVAL_AUGMENTED, useCase: 'qa' },
      'few-shot-classification': { strategy: PromptStrategy.FEW_SHOT, useCase: 'classification' },
    };

    const mapping = useCaseMapping[useCase];
    if (!mapping) {
      throw new PromptTemplateError(`Unknown use case: ${useCase}`);
    }

    return this.createPrompt(mapping.strategy, { 
      useCase: mapping.useCase, 
      ...options 
    });
  }

  /**
   * Create a prompt chain
   */
  async createChain(configs) {
    const prompts = [];
    
    for (const config of configs) {
      const prompt = await this.createPrompt(
        config.strategy || this.defaultStrategy,
        config.options || {}
      );
      prompts.push(prompt);
    }
    
    return {
      prompts,
      async execute(input) {
        let result = input;
        const results = [];
        
        for (const prompt of prompts) {
          result = await prompt.format(result);
          results.push(result);
        }
        
        return {
          final: result,
          intermediate: results,
        };
      }
    };
  }

  /**
   * Batch process with a prompt
   */
  async batchProcess(prompt, inputs, options = {}) {
    const { 
      parallel = false, 
      maxConcurrency = 5,
      onProgress = null 
    } = options;

    const results = [];
    
    if (parallel) {
      // Process in parallel with concurrency limit
      const chunks = [];
      for (let i = 0; i < inputs.length; i += maxConcurrency) {
        chunks.push(inputs.slice(i, i + maxConcurrency));
      }
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(input => prompt.format(input))
        );
        results.push(...chunkResults);
        
        if (onProgress) {
          onProgress(results.length, inputs.length);
        }
      }
    } else {
      // Process sequentially
      for (let i = 0; i < inputs.length; i++) {
        const result = await prompt.format(inputs[i]);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, inputs.length);
        }
      }
    }
    
    return results;
  }
}

/**
 * Singleton instance
 */
let managerInstance = null;

/**
 * Get or create prompt manager instance
 */
export function getPromptManager() {
  if (!managerInstance) {
    managerInstance = new PromptManager();
  }
  return managerInstance;
}

/**
 * Quick helper functions for common use cases
 */
export const prompts = {
  zeroShot: (options) => getPromptManager().createPrompt(PromptStrategy.ZERO_SHOT, options),
  fewShot: (options) => getPromptManager().createPrompt(PromptStrategy.FEW_SHOT, options),
  chainOfThought: (options) => getPromptManager().createPrompt(PromptStrategy.CHAIN_OF_THOUGHT, options),
  rag: (options) => getPromptManager().createPrompt(PromptStrategy.RETRIEVAL_AUGMENTED, options),
};

export default PromptManager;

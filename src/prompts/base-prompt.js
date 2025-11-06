// src/prompts/base-prompt.js
/**
 * Base class for all prompt templates
 * Provides common functionality and interface for different prompting strategies
 */

import { PromptTemplate } from '@langchain/core/prompts';
import { Logger } from '../utils/logger.js';
import { PromptTemplateError } from '../utils/errors.js';

/**
 * Abstract base class for prompt strategies
 */
export class BasePromptStrategy {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.template = null;
    this.validators = [];
    this.preprocessors = [];
    this.postprocessors = [];
  }

  /**
   * Initialize the prompt template
   * Must be implemented by subclasses
   */
  async initialize() {
    throw new Error(`initialize() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Format the prompt with given variables
   */
  async format(variables = {}) {
    try {
      // Run preprocessors
      let processedVars = await this.runPreprocessors(variables);
      
      // Validate input
      await this.validate(processedVars);
      
      // Format the template
      if (!this.template) {
        throw new PromptTemplateError('Template not initialized');
      }
      
      const formatted = await this.template.format(processedVars);
      
      // Run postprocessors
      const finalOutput = await this.runPostprocessors(formatted);
      
      Logger.logPrompt(this.name, JSON.stringify(variables), finalOutput);
      
      return finalOutput;
    } catch (error) {
      Logger.error(`Error formatting prompt: ${this.name}`, error);
      throw new PromptTemplateError(`Failed to format prompt: ${error.message}`);
    }
  }

  /**
   * Add input validator
   */
  addValidator(validator) {
    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }
    this.validators.push(validator);
    return this;
  }

  /**
   * Add preprocessor
   */
  addPreprocessor(preprocessor) {
    if (typeof preprocessor !== 'function') {
      throw new Error('Preprocessor must be a function');
    }
    this.preprocessors.push(preprocessor);
    return this;
  }

  /**
   * Add postprocessor
   */
  addPostprocessor(postprocessor) {
    if (typeof postprocessor !== 'function') {
      throw new Error('Postprocessor must be a function');
    }
    this.postprocessors.push(postprocessor);
    return this;
  }

  /**
   * Validate input variables
   */
  async validate(variables) {
    for (const validator of this.validators) {
      const result = await validator(variables);
      if (result !== true) {
        throw new PromptTemplateError(
          `Validation failed: ${result || 'Invalid input'}`,
          { variables }
        );
      }
    }
    return true;
  }

  /**
   * Run preprocessors on input variables
   */
  async runPreprocessors(variables) {
    let processed = { ...variables };
    for (const preprocessor of this.preprocessors) {
      processed = await preprocessor(processed);
    }
    return processed;
  }

  /**
   * Run postprocessors on formatted output
   */
  async runPostprocessors(output) {
    let processed = output;
    for (const postprocessor of this.postprocessors) {
      processed = await postprocessor(processed);
    }
    return processed;
  }

  /**
   * Get prompt metadata
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.constructor.name,
      options: this.options,
      hasValidators: this.validators.length > 0,
      hasPreprocessors: this.preprocessors.length > 0,
      hasPostprocessors: this.postprocessors.length > 0,
    };
  }

  /**
   * Clone the prompt strategy
   */
  clone() {
    const cloned = new this.constructor(this.name, { ...this.options });
    cloned.template = this.template;
    cloned.validators = [...this.validators];
    cloned.preprocessors = [...this.preprocessors];
    cloned.postprocessors = [...this.postprocessors];
    return cloned;
  }
}

/**
 * Prompt builder for fluent API
 */
export class PromptBuilder {
  constructor(strategy) {
    this.strategy = strategy;
  }

  /**
   * Add a validator
   */
  withValidator(validator) {
    this.strategy.addValidator(validator);
    return this;
  }

  /**
   * Add a preprocessor
   */
  withPreprocessor(preprocessor) {
    this.strategy.addPreprocessor(preprocessor);
    return this;
  }

  /**
   * Add a postprocessor
   */
  withPostprocessor(postprocessor) {
    this.strategy.addPostprocessor(postprocessor);
    return this;
  }

  /**
   * Add required fields validator
   */
  withRequiredFields(...fields) {
    this.strategy.addValidator((variables) => {
      const missing = fields.filter(field => !variables[field]);
      if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
      }
      return true;
    });
    return this;
  }

  /**
   * Add length constraint
   */
  withMaxLength(field, maxLength) {
    this.strategy.addValidator((variables) => {
      if (variables[field] && variables[field].length > maxLength) {
        return `${field} exceeds maximum length of ${maxLength}`;
      }
      return true;
    });
    return this;
  }

  /**
   * Add trimming preprocessor
   */
  withTrimming() {
    this.strategy.addPreprocessor((variables) => {
      const trimmed = {};
      for (const [key, value] of Object.entries(variables)) {
        trimmed[key] = typeof value === 'string' ? value.trim() : value;
      }
      return trimmed;
    });
    return this;
  }

  /**
   * Build and return the strategy
   */
  async build() {
    await this.strategy.initialize();
    return this.strategy;
  }
}

export default BasePromptStrategy;

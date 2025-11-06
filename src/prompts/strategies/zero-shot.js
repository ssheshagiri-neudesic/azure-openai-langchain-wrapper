// src/prompts/strategies/zero-shot.js
/**
 * Zero-shot prompting strategy implementation
 * Provides direct prompting without examples
 */

import { PromptTemplate } from '@langchain/core/prompts';
import { BasePromptStrategy } from '../base-prompt.js';
import { Logger } from '../../utils/logger.js';

/**
 * Zero-shot prompt strategy
 */
export class ZeroShotPrompt extends BasePromptStrategy {
  constructor(options = {}) {
    super('zero-shot', options);
    
    // Default options for zero-shot prompting
    this.options = {
      includeSystemMessage: true,
      outputFormat: 'text', // 'text', 'json', 'markdown'
      temperature: 0.7,
      ...options
    };
  }

  /**
   * Initialize the zero-shot template
   */
  async initialize() {
    try {
      // Create base template based on options
      const templateString = this.buildTemplateString();
      
      this.template = new PromptTemplate({
        template: templateString,
        inputVariables: this.extractVariables(templateString),
      });

      // Add default validators
      this.setupDefaultValidators();
      
      Logger.info('Zero-shot prompt initialized', { 
        options: this.options 
      });
      
      return this;
    } catch (error) {
      Logger.error('Failed to initialize zero-shot prompt', error);
      throw error;
    }
  }

  /**
   * Build template string based on options
   */
  buildTemplateString() {
    const parts = [];
    
    // Add system message if enabled
    if (this.options.includeSystemMessage && this.options.systemMessage) {
      parts.push(`System: ${this.options.systemMessage}`);
      parts.push('');
    }

    // Add main instruction
    if (this.options.instruction) {
      parts.push(this.options.instruction);
    } else {
      // Default template
      parts.push('Task: {task}');
      parts.push('');
      parts.push('Input: {input}');
    }

    // Add output format instruction
    if (this.options.outputFormat !== 'text') {
      parts.push('');
      parts.push(this.getOutputFormatInstruction());
    }

    // Add custom template if provided
    if (this.options.template) {
      return this.options.template;
    }

    return parts.join('\n');
  }

  /**
   * Get output format instruction
   */
  getOutputFormatInstruction() {
    switch (this.options.outputFormat) {
      case 'json':
        return 'Output your response in valid JSON format.';
      case 'markdown':
        return 'Format your response using Markdown.';
      case 'structured':
        return `Output in the following structure:\n${this.options.outputStructure || ''}`;
      default:
        return '';
    }
  }

  /**
   * Extract variable names from template string
   */
  extractVariables(templateString) {
    const regex = /\{(\w+)\}/g;
    const variables = new Set();
    let match;
    
    while ((match = regex.exec(templateString)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  /**
   * Setup default validators for zero-shot prompting
   */
  setupDefaultValidators() {
    // Validate required input
    if (!this.options.template) {
      this.addValidator((variables) => {
        if (!variables.task && !variables.input) {
          return 'Either task or input must be provided';
        }
        return true;
      });
    }

    // Add length validation if specified
    if (this.options.maxInputLength) {
      this.addValidator((variables) => {
        const input = variables.input || variables.task || '';
        if (input.length > this.options.maxInputLength) {
          return `Input exceeds maximum length of ${this.options.maxInputLength}`;
        }
        return true;
      });
    }
  }

  /**
   * Create a zero-shot prompt for a specific use case
   */
  static createForUseCase(useCase, options = {}) {
    const useCaseTemplates = {
      classification: {
        template: 'Classify the following text into one of these categories: {categories}\n\nText: {text}\n\nCategory:',
        outputFormat: 'text',
      },
      summarization: {
        template: 'Summarize the following text in {length} sentences:\n\n{text}\n\nSummary:',
        outputFormat: 'text',
      },
      extraction: {
        template: 'Extract the following information from the text:\n{fields}\n\nText: {text}\n\nExtracted Information:',
        outputFormat: 'json',
      },
      translation: {
        template: 'Translate the following text from {source_language} to {target_language}:\n\n{text}\n\nTranslation:',
        outputFormat: 'text',
      },
      generation: {
        template: 'Generate {output_type} based on the following requirements:\n{requirements}\n\nOutput:',
        outputFormat: 'text',
      },
      question_answering: {
        template: 'Answer the following question based on the provided context:\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:',
        outputFormat: 'text',
      },
      reasoning: {
        template: 'Solve the following problem step by step:\n\n{problem}\n\nShow your reasoning and provide the final answer.',
        outputFormat: 'markdown',
      },
    };

    const config = useCaseTemplates[useCase];
    if (!config) {
      throw new Error(`Unknown use case: ${useCase}`);
    }

    return new ZeroShotPrompt({
      ...config,
      ...options,
      useCase,
    });
  }

  /**
   * Create a chain of zero-shot prompts
   */
  static createChain(prompts) {
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
}

/**
 * Factory function for creating zero-shot prompts
 */
export function createZeroShotPrompt(options = {}) {
  return new ZeroShotPrompt(options);
}

export default ZeroShotPrompt;

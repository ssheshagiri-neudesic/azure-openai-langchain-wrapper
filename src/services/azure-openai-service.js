// src/services/azure-openai-service.js
/**
 * Azure OpenAI Service
 * Main service for interacting with Azure OpenAI using LangChain
 */

import { AzureChatOpenAI } from '@langchain/azure-openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Logger } from '../utils/logger.js';
import { ErrorHandler, AzureOpenAIError } from '../utils/errors.js';
import { RetryWrapper } from '../utils/retry.js';
import { azureConfig } from '../config/config.js';
import { getPromptManager } from '../prompts/prompt-manager.js';

/**
 * Azure OpenAI Service class
 */
export class AzureOpenAIService {
  constructor(config = {}) {
    this.config = {
      ...azureConfig,
      ...config
    };
    
    this.model = null;
    this.promptManager = getPromptManager();
    this.outputParser = new StringOutputParser();
    this.conversations = new Map();
    this.metrics = {
      totalCalls: 0,
      totalTokens: 0,
      errors: 0,
      averageLatency: 0,
    };
  }

  /**
   * Initialize the Azure OpenAI model
   */
  async initialize() {
    try {
      Logger.info('Initializing Azure OpenAI Service');
      
      this.model = new AzureChatOpenAI({
        azureOpenAIApiKey: this.config.apiKey,
        azureOpenAIApiInstanceName: this.extractInstanceName(this.config.endpoint),
        azureOpenAIApiDeploymentName: this.config.deploymentName,
        azureOpenAIApiVersion: this.config.apiVersion,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        streaming: false,
        verbose: process.env.NODE_ENV === 'development',
      });

      // Test connection
      await this.testConnection();
      
      Logger.info('Azure OpenAI Service initialized successfully');
      return this;
    } catch (error) {
      const handledError = ErrorHandler.handle(error, 'initialization');
      Logger.error('Failed to initialize Azure OpenAI Service', handledError);
      throw handledError;
    }
  }

  /**
   * Extract instance name from endpoint
   */
  extractInstanceName(endpoint) {
    const match = endpoint.match(/https:\/\/(.+?)\.openai\.azure\.com/);
    if (!match) {
      throw new AzureOpenAIError('Invalid Azure OpenAI endpoint format');
    }
    return match[1];
  }

  /**
   * Test connection to Azure OpenAI
   */
  async testConnection() {
    try {
      const testMessage = new HumanMessage('Hello');
      await this.model.invoke([testMessage]);
      Logger.info('Connection test successful');
    } catch (error) {
      throw new AzureOpenAIError('Connection test failed', 500, { 
        originalError: error.message 
      });
    }
  }

  /**
   * Execute a zero-shot prompt
   */
  async executeZeroShot(input, options = {}) {
    const startTime = Date.now();
    
    try {
      // Create or get prompt
      const prompt = await this.promptManager.createPrompt('zero-shot', options);
      
      // Format the prompt with input
      const formattedPrompt = await prompt.format(input);
      
      // Execute with retry logic
      const response = await RetryWrapper.execute(async () => {
        const messages = [new HumanMessage(formattedPrompt)];
        
        if (options.systemMessage) {
          messages.unshift(new SystemMessage(options.systemMessage));
        }
        
        return await this.model.invoke(messages);
      });

      // Parse output
      const output = await this.outputParser.parse(response);
      
      // Update metrics
      this.updateMetrics(Date.now() - startTime, true);
      
      Logger.logApiCall('executeZeroShot', Date.now() - startTime, true, {
        inputLength: formattedPrompt.length,
        outputLength: output.length,
      });

      return {
        output,
        prompt: formattedPrompt,
        raw: response,
        metadata: {
          strategy: 'zero-shot',
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false);
      const handledError = ErrorHandler.handle(error, 'executeZeroShot');
      Logger.error('Zero-shot execution failed', handledError);
      throw handledError;
    }
  }

  /**
   * Execute with a specific prompt strategy
   */
  async executeWithStrategy(strategy, input, options = {}) {
    const startTime = Date.now();
    
    try {
      // Create prompt with specified strategy
      const prompt = await this.promptManager.createPrompt(strategy, options);
      
      // Format the prompt
      const formattedPrompt = await prompt.format(input);
      
      // Create message based on strategy
      const messages = this.createMessages(formattedPrompt, options);
      
      // Execute with retry
      const response = await RetryWrapper.execute(async () => {
        return await this.model.invoke(messages);
      });

      // Parse output
      const output = await this.outputParser.parse(response);
      
      // Post-process based on strategy
      const processedOutput = await this.postProcessOutput(output, strategy, options);
      
      // Update metrics
      this.updateMetrics(Date.now() - startTime, true);
      
      return {
        output: processedOutput,
        prompt: formattedPrompt,
        raw: response,
        metadata: {
          strategy,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false);
      const handledError = ErrorHandler.handle(error, `executeWithStrategy:${strategy}`);
      Logger.error(`Execution failed for strategy: ${strategy}`, handledError);
      throw handledError;
    }
  }

  /**
   * Execute few-shot prompting (placeholder)
   */
  async executeFewShot(input, examples = [], options = {}) {
    Logger.info('Executing few-shot prompt (using placeholder implementation)');
    
    return this.executeWithStrategy('few-shot', input, {
      ...options,
      examples,
    });
  }

  /**
   * Execute chain-of-thought prompting (placeholder)
   */
  async executeChainOfThought(input, options = {}) {
    Logger.info('Executing chain-of-thought prompt (using placeholder implementation)');
    
    return this.executeWithStrategy('chain-of-thought', input, options);
  }

  /**
   * Execute retrieval-augmented prompting (placeholder)
   */
  async executeRAG(input, context = [], options = {}) {
    Logger.info('Executing RAG prompt (using placeholder implementation)');
    
    return this.executeWithStrategy('retrieval-augmented', input, {
      ...options,
      context,
    });
  }

  /**
   * Execute agent-based prompting (placeholder)
   */
  async executeAgent(task, tools = [], options = {}) {
    Logger.warn('Agent-based prompting not yet implemented');
    
    // Placeholder implementation
    return {
      output: 'Agent-based prompting will be implemented in future versions',
      metadata: {
        strategy: 'agent',
        status: 'not-implemented',
        availableTools: tools.map(t => t.name || t),
      }
    };
  }

  /**
   * Stream response (placeholder for streaming support)
   */
  async *streamResponse(input, options = {}) {
    Logger.info('Starting streaming response');
    
    // TODO: Implement actual streaming
    const response = await this.executeZeroShot(input, options);
    
    // Simulate streaming by yielding chunks
    const chunks = response.output.match(/.{1,50}/g) || [];
    for (const chunk of chunks) {
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Create messages based on options
   */
  createMessages(prompt, options = {}) {
    const messages = [];
    
    if (options.systemMessage) {
      messages.push(new SystemMessage(options.systemMessage));
    }
    
    if (options.conversationId) {
      const history = this.getConversationHistory(options.conversationId);
      messages.push(...history);
    }
    
    messages.push(new HumanMessage(prompt));
    
    return messages;
  }

  /**
   * Post-process output based on strategy
   */
  async postProcessOutput(output, strategy, options = {}) {
    switch (strategy) {
      case 'zero-shot':
        return output;
        
      case 'chain-of-thought':
        // Extract final answer from reasoning
        const parts = output.split(/Final Answer:?/i);
        return parts[parts.length - 1].trim();
        
      case 'retrieval-augmented':
        // Clean up citations if needed
        return output.replace(/\[[\d,\s]+\]/g, '');
        
      default:
        return output;
    }
  }

  /**
   * Manage conversation history
   */
  startConversation(conversationId) {
    this.conversations.set(conversationId, []);
    return conversationId;
  }

  /**
   * Add to conversation history
   */
  addToConversation(conversationId, role, content) {
    if (!this.conversations.has(conversationId)) {
      this.startConversation(conversationId);
    }
    
    const message = role === 'human' 
      ? new HumanMessage(content)
      : new AIMessage(content);
    
    this.conversations.get(conversationId).push(message);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId) {
    return this.conversations.get(conversationId) || [];
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId) {
    this.conversations.delete(conversationId);
  }

  /**
   * Create a chain of operations
   */
  createChain(operations) {
    return RunnableSequence.from(operations.map(op => {
      if (typeof op === 'function') {
        return op;
      }
      if (op.type === 'prompt') {
        return async (input) => {
          const prompt = await this.promptManager.createPrompt(op.strategy, op.options);
          return prompt.format(input);
        };
      }
      if (op.type === 'model') {
        return this.model;
      }
      if (op.type === 'parser') {
        return this.outputParser;
      }
      return op;
    }));
  }

  /**
   * Batch processing
   */
  async batchProcess(inputs, strategy = 'zero-shot', options = {}) {
    Logger.info(`Starting batch processing for ${inputs.length} inputs`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < inputs.length; i++) {
      try {
        const result = await this.executeWithStrategy(strategy, inputs[i], options);
        results.push(result);
      } catch (error) {
        errors.push({ index: i, input: inputs[i], error });
        Logger.error(`Batch processing failed for input ${i}`, error);
      }
    }
    
    return { results, errors };
  }

  /**
   * Update service metrics
   */
  updateMetrics(latency, success) {
    this.metrics.totalCalls++;
    if (!success) {
      this.metrics.errors++;
    }
    
    // Update average latency
    const prevTotal = this.metrics.averageLatency * (this.metrics.totalCalls - 1);
    this.metrics.averageLatency = (prevTotal + latency) / this.metrics.totalCalls;
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: ((this.metrics.totalCalls - this.metrics.errors) / this.metrics.totalCalls) * 100,
      uptime: process.uptime(),
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.testConnection();
      return {
        status: 'healthy',
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Factory function to create and initialize service
 */
export async function createAzureOpenAIService(config = {}) {
  const service = new AzureOpenAIService(config);
  await service.initialize();
  return service;
}

export default AzureOpenAIService;

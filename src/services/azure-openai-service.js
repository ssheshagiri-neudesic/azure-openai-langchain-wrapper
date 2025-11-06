// src/services/azure-openai-service.js
/**
 * Azure OpenAI Service
 * Simplified service for interacting with Azure OpenAI using LangChain
 */

import { AzureChatOpenAI } from '@langchain/azure-openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Logger } from '../utils/logger.js';
import { ErrorHandler, AzureOpenAIError } from '../utils/errors.js';
import { RetryWrapper } from '../utils/retry.js';
import { azureConfig } from '../config/config.js';

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
   * Execute a chat completion
   * @param {string|Array} input - User message or array of messages
   * @param {Object} options - Optional parameters
   * @param {string} options.systemMessage - System message to include
   * @param {string} options.conversationId - Conversation ID for history
   * @param {number} options.temperature - Override default temperature
   * @param {number} options.maxTokens - Override default max tokens
   */
  async chat(input, options = {}) {
    const startTime = Date.now();

    try {
      // Build messages
      const messages = this.buildMessages(input, options);

      // Log the prompt
      Logger.logPrompt('chat', JSON.stringify(messages), null, {
        conversationId: options.conversationId,
      });

      // Execute with retry logic
      const response = await RetryWrapper.execute(async () => {
        return await this.model.invoke(messages, {
          temperature: options.temperature ?? this.config.temperature,
          maxTokens: options.maxTokens ?? this.config.maxTokens,
        });
      });

      // Parse output
      const output = await this.outputParser.parse(response);

      // Update conversation history if provided
      if (options.conversationId) {
        this.addToConversation(options.conversationId, 'human',
          typeof input === 'string' ? input : input[input.length - 1]);
        this.addToConversation(options.conversationId, 'ai', output);
      }

      // Update metrics
      this.updateMetrics(Date.now() - startTime, true);

      Logger.logApiCall('chat', Date.now() - startTime, true, {
        conversationId: options.conversationId,
        outputLength: output.length,
      });

      return {
        output,
        raw: response,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false);
      const handledError = ErrorHandler.handle(error, 'chat');
      Logger.error('Chat execution failed', handledError);
      throw handledError;
    }
  }

  /**
   * Build messages array from input and options
   */
  buildMessages(input, options = {}) {
    const messages = [];

    // Add system message if provided
    if (options.systemMessage) {
      messages.push(new SystemMessage(options.systemMessage));
    }

    // Add conversation history if conversationId provided
    if (options.conversationId) {
      const history = this.getConversationHistory(options.conversationId);
      messages.push(...history);
    }

    // Add user input
    if (typeof input === 'string') {
      messages.push(new HumanMessage(input));
    } else if (Array.isArray(input)) {
      // Allow passing an array of message objects
      input.forEach(msg => {
        if (typeof msg === 'string') {
          messages.push(new HumanMessage(msg));
        } else if (msg.role === 'system') {
          messages.push(new SystemMessage(msg.content));
        } else if (msg.role === 'assistant' || msg.role === 'ai') {
          messages.push(new AIMessage(msg.content));
        } else {
          messages.push(new HumanMessage(msg.content));
        }
      });
    }

    return messages;
  }

  /**
   * Stream response (for future implementation)
   */
  async *stream(input, options = {}) {
    Logger.info('Starting streaming response');

    try {
      const messages = this.buildMessages(input, options);

      // Enable streaming for this request
      const streamingModel = this.model.bind({ streaming: true });

      // Stream the response
      const stream = await streamingModel.stream(messages);

      for await (const chunk of stream) {
        const text = chunk.content || '';
        yield text;
      }
    } catch (error) {
      const handledError = ErrorHandler.handle(error, 'stream');
      Logger.error('Streaming failed', handledError);
      throw handledError;
    }
  }

  /**
   * Batch process multiple inputs
   */
  async batchProcess(inputs, options = {}) {
    Logger.info(`Starting batch processing for ${inputs.length} inputs`);

    const results = [];
    const errors = [];

    for (let i = 0; i < inputs.length; i++) {
      try {
        const result = await this.chat(inputs[i], options);
        results.push({ index: i, ...result });
      } catch (error) {
        errors.push({ index: i, input: inputs[i], error });
        Logger.error(`Batch processing failed for input ${i}`, error);
      }
    }

    return { results, errors };
  }

  /**
   * Manage conversation history
   */
  startConversation(conversationId = null) {
    const id = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversations.set(id, []);
    Logger.debug('Started conversation', { conversationId: id });
    return id;
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
    Logger.debug('Cleared conversation', { conversationId });
  }

  /**
   * Clear all conversations
   */
  clearAllConversations() {
    this.conversations.clear();
    Logger.debug('Cleared all conversations');
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
      successRate: this.metrics.totalCalls > 0
        ? ((this.metrics.totalCalls - this.metrics.errors) / this.metrics.totalCalls) * 100
        : 0,
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

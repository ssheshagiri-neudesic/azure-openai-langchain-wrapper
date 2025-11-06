// examples/basic-usage.js
/**
 * Basic usage examples for Azure OpenAI LangChain Wrapper
 */

import { createAzureOpenAIService } from '../src/index.js';
import { Logger } from '../src/utils/logger.js';

/**
 * Example 1: Simple zero-shot prompting
 */
async function basicZeroShot() {
  Logger.info('Example 1: Basic Zero-Shot Prompting');
  
  // Initialize service
  const service = await createAzureOpenAIService();
  
  // Execute zero-shot prompt
  const result = await service.executeZeroShot({
    task: 'Classify the sentiment',
    input: 'This product exceeded my expectations! Absolutely fantastic.'
  });
  
  console.log('Result:', result.output);
  console.log('Metadata:', result.metadata);
}

/**
 * Example 2: Zero-shot with custom template
 */
async function customTemplate() {
  Logger.info('Example 2: Custom Template');
  
  const service = await createAzureOpenAIService();
  
  const result = await service.executeZeroShot(
    {
      text: 'The quick brown fox jumps over the lazy dog.',
      targetLanguage: 'Spanish'
    },
    {
      template: 'Translate the following text to {targetLanguage}:\n\n{text}\n\nTranslation:',
      outputFormat: 'text'
    }
  );
  
  console.log('Translation:', result.output);
}

/**
 * Example 3: Using prompt manager directly
 */
async function usingPromptManager() {
  Logger.info('Example 3: Using Prompt Manager');
  
  const service = await createAzureOpenAIService();
  const { promptManager } = service;
  
  // Create a classification prompt
  const prompt = await promptManager.createForUseCase('classification', {
    template: 'Classify the following text into one of these categories: {categories}\n\nText: {text}\n\nCategory:'
  });
  
  const formatted = await prompt.format({
    categories: 'positive, negative, neutral',
    text: 'The service was okay, nothing special.'
  });
  
  console.log('Formatted prompt:', formatted);
}

/**
 * Example 4: Batch processing
 */
async function batchProcessing() {
  Logger.info('Example 4: Batch Processing');
  
  const service = await createAzureOpenAIService();
  
  const inputs = [
    { task: 'Summarize', input: 'Long text 1...' },
    { task: 'Summarize', input: 'Long text 2...' },
    { task: 'Summarize', input: 'Long text 3...' }
  ];
  
  const { results, errors } = await service.batchProcess(inputs, 'zero-shot', {
    template: '{task}: {input}\n\nOutput:',
    maxTokens: 100
  });
  
  console.log(`Processed ${results.length} successfully`);
  console.log(`Errors: ${errors.length}`);
}

/**
 * Example 5: Conversation management
 */
async function conversationExample() {
  Logger.info('Example 5: Conversation Management');
  
  const service = await createAzureOpenAIService();
  const conversationId = 'chat-123';
  
  // Start conversation
  service.startConversation(conversationId);
  
  // First message
  const result1 = await service.executeZeroShot(
    { input: 'What is machine learning?' },
    { conversationId }
  );
  
  service.addToConversation(conversationId, 'human', 'What is machine learning?');
  service.addToConversation(conversationId, 'ai', result1.output);
  
  // Follow-up message
  const result2 = await service.executeZeroShot(
    { input: 'Can you give me an example?' },
    { conversationId }
  );
  
  console.log('First response:', result1.output);
  console.log('Follow-up response:', result2.output);
  
  // Clear conversation
  service.clearConversation(conversationId);
}

/**
 * Example 6: Error handling
 */
async function errorHandling() {
  Logger.info('Example 6: Error Handling');
  
  try {
    const service = await createAzureOpenAIService({
      maxRetryAttempts: 3,
      retryDelayMs: 1000
    });
    
    // This might fail and will be retried
    const result = await service.executeZeroShot({
      input: 'Test input'
    });
    
    console.log('Success:', result.output);
  } catch (error) {
    console.error('Error after retries:', error.message);
    
    // Check error type
    if (error.name === 'RateLimitError') {
      console.log('Rate limit hit, retry after:', error.details.retryAfter);
    }
  }
}

/**
 * Example 7: Streaming response
 */
async function streamingExample() {
  Logger.info('Example 7: Streaming Response');
  
  const service = await createAzureOpenAIService();
  
  const stream = service.streamResponse({
    task: 'Write a short story',
    input: 'A developer discovers AI'
  });
  
  console.log('Streaming output:');
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  console.log('\nStreaming complete');
}

/**
 * Example 8: Chain of operations
 */
async function chainExample() {
  Logger.info('Example 8: Chain of Operations');
  
  const service = await createAzureOpenAIService();
  
  const chain = service.createChain([
    { type: 'prompt', strategy: 'zero-shot', options: { 
      template: 'Summarize: {input}' 
    }},
    { type: 'model' },
    { type: 'parser' },
    async (text) => text.toUpperCase() // Custom transformation
  ]);
  
  const result = await chain.invoke({
    input: 'Long article text here...'
  });
  
  console.log('Chain result:', result);
}

/**
 * Example 9: Health check and metrics
 */
async function healthAndMetrics() {
  Logger.info('Example 9: Health Check and Metrics');
  
  const service = await createAzureOpenAIService();
  
  // Perform some operations
  await service.executeZeroShot({ input: 'Test 1' });
  await service.executeZeroShot({ input: 'Test 2' });
  
  // Check health
  const health = await service.healthCheck();
  console.log('Health status:', health.status);
  
  // Get metrics
  const metrics = service.getMetrics();
  console.log('Service metrics:', metrics);
}

/**
 * Example 10: Quick start usage
 */
async function quickStartExample() {
  Logger.info('Example 10: Quick Start');
  
  const { quickStart } = await import('../src/index.js');
  const ai = await quickStart();
  
  // Use convenience methods
  const result = await ai.zeroShot({
    task: 'Explain in simple terms',
    input: 'Quantum computing'
  });
  
  console.log('Quick start result:', result.output);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  const examples = [
    basicZeroShot,
    customTemplate,
    usingPromptManager,
    batchProcessing,
    conversationExample,
    errorHandling,
    streamingExample,
    chainExample,
    healthAndMetrics,
    quickStartExample
  ];
  
  for (const example of examples) {
    try {
      await example();
      console.log('---\n');
    } catch (error) {
      console.error(`Error in ${example.name}:`, error.message);
    }
  }
}

// Run examples if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  basicZeroShot,
  customTemplate,
  usingPromptManager,
  batchProcessing,
  conversationExample,
  errorHandling,
  streamingExample,
  chainExample,
  healthAndMetrics,
  quickStartExample
};

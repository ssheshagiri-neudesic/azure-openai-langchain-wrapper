// examples/basic-usage.js
/**
 * Basic usage examples for Azure OpenAI LangChain Wrapper
 */

import { createAzureOpenAIService, quickStart, Logger } from '../src/index.js';

/**
 * Example 1: Simple chat
 */
async function simpleChat() {
  console.log('\n=== Example 1: Simple Chat ===');

  const service = await createAzureOpenAIService();

  const result = await service.chat('What is the capital of France?');

  console.log('Response:', result.output);
  console.log('Duration:', result.metadata.duration, 'ms');
}

/**
 * Example 2: Chat with system message
 */
async function chatWithSystemMessage() {
  console.log('\n=== Example 2: Chat with System Message ===');

  const service = await createAzureOpenAIService();

  const result = await service.chat('Explain quantum computing', {
    systemMessage: 'You are a helpful assistant who explains complex topics in simple terms.',
    temperature: 0.7
  });

  console.log('Response:', result.output);
}

/**
 * Example 3: Conversation with history
 */
async function conversationWithHistory() {
  console.log('\n=== Example 3: Conversation with History ===');

  const service = await createAzureOpenAIService();

  // Start a conversation
  const convId = service.startConversation();

  // First message
  const response1 = await service.chat('My name is Alice and I like programming.', {
    conversationId: convId
  });
  console.log('AI:', response1.output);

  // Second message - service remembers the context
  const response2 = await service.chat('What is my name and what do I like?', {
    conversationId: convId
  });
  console.log('AI:', response2.output);

  // Clean up
  service.clearConversation(convId);
}

/**
 * Example 4: Streaming response
 */
async function streamingResponse() {
  console.log('\n=== Example 4: Streaming Response ===');

  const service = await createAzureOpenAIService();

  console.log('Streaming output:');
  for await (const chunk of service.stream('Write a short haiku about coding')) {
    process.stdout.write(chunk);
  }
  console.log('\n');
}

/**
 * Example 5: Batch processing
 */
async function batchProcessing() {
  console.log('\n=== Example 5: Batch Processing ===');

  const service = await createAzureOpenAIService();

  const inputs = [
    'What is 2+2?',
    'What is the capital of Japan?',
    'Name a programming language.'
  ];

  const { results, errors } = await service.batchProcess(inputs);

  console.log(`Successfully processed: ${results.length}/${inputs.length}`);
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.output}`);
  });

  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
  }
}

/**
 * Example 6: Custom temperature and max tokens
 */
async function customParameters() {
  console.log('\n=== Example 6: Custom Parameters ===');

  const service = await createAzureOpenAIService({
    temperature: 0.9,  // More creative
    maxTokens: 500
  });

  const result = await service.chat('Write a creative story opening about a robot chef');
  console.log('Creative response:', result.output);
}

/**
 * Example 7: Error handling
 */
async function errorHandling() {
  console.log('\n=== Example 7: Error Handling ===');

  try {
    const service = await createAzureOpenAIService();

    const result = await service.chat('Hello!');
    console.log('Success:', result.output);
  } catch (error) {
    console.error('Error:', error.message);

    // Check error type
    if (error.name === 'RateLimitError') {
      console.log('Rate limit hit, retry after:', error.details?.retryAfter);
    } else if (error.name === 'AzureOpenAIError') {
      console.log('Azure OpenAI error:', error.statusCode);
    }
  }
}

/**
 * Example 8: Health check and metrics
 */
async function healthAndMetrics() {
  console.log('\n=== Example 8: Health Check and Metrics ===');

  const service = await createAzureOpenAIService();

  // Make a few calls
  await service.chat('Test 1');
  await service.chat('Test 2');
  await service.chat('Test 3');

  // Check health
  const health = await service.healthCheck();
  console.log('Health status:', health.status);

  // Get metrics
  const metrics = service.getMetrics();
  console.log('Metrics:');
  console.log('  Total calls:', metrics.totalCalls);
  console.log('  Errors:', metrics.errors);
  console.log('  Success rate:', metrics.successRate.toFixed(2) + '%');
  console.log('  Average latency:', metrics.averageLatency.toFixed(0) + 'ms');
}

/**
 * Example 9: Quick start helper
 */
async function quickStartHelper() {
  console.log('\n=== Example 9: Quick Start Helper ===');

  const { chat, stream, batch } = await quickStart();

  // Direct chat
  const result = await chat('What is JavaScript?');
  console.log('Response:', result.output);
}

/**
 * Example 10: Multiple conversations
 */
async function multipleConversations() {
  console.log('\n=== Example 10: Multiple Conversations ===');

  const service = await createAzureOpenAIService();

  // Conversation 1: Tech support
  const support = service.startConversation();
  const resp1 = await service.chat('I am having issues with my login', {
    conversationId: support,
    systemMessage: 'You are a technical support assistant.'
  });
  console.log('Support bot:', resp1.output.substring(0, 100) + '...');

  // Conversation 2: Creative writing
  const creative = service.startConversation();
  const resp2 = await service.chat('Help me write a story about space', {
    conversationId: creative,
    systemMessage: 'You are a creative writing assistant.'
  });
  console.log('Creative bot:', resp2.output.substring(0, 100) + '...');

  // Conversations are isolated from each other
  service.clearAllConversations();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  const examples = [
    simpleChat,
    chatWithSystemMessage,
    conversationWithHistory,
    streamingResponse,
    batchProcessing,
    customParameters,
    errorHandling,
    healthAndMetrics,
    quickStartHelper,
    multipleConversations
  ];

  for (const example of examples) {
    try {
      await example();
    } catch (error) {
      console.error(`\nError in ${example.name}:`, error.message);
    }
  }

  console.log('\n=== All examples completed ===');
}

// Run examples if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  simpleChat,
  chatWithSystemMessage,
  conversationWithHistory,
  streamingResponse,
  batchProcessing,
  customParameters,
  errorHandling,
  healthAndMetrics,
  quickStartHelper,
  multipleConversations
};

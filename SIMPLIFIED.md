# Simplified Azure OpenAI LangChain Wrapper

## What Was Removed

### Over-Engineered Components Removed:
1. **Strategy Pattern** - Removed complex prompt strategy system (zero-shot, few-shot, chain-of-thought, RAG strategies)
2. **Prompt Manager** - Removed registry and factory pattern for prompts
3. **Circuit Breaker** - Removed overly complex circuit breaker implementation
4. **Joi Validation** - Removed heavy validation library, replaced with simple validation
5. **Decorator Pattern** - Removed TypeScript-style decorators from JavaScript code
6. **Placeholder Methods** - Removed unimplemented agent, RAG, and few-shot methods
7. **Entire `src/prompts/` directory** - No longer needed

### Dependencies Removed:
- `joi` - Configuration validation library

## Simplified Structure

```
src/
├── config/
│   └── config.js                      # Simple config with basic validation
├── services/
│   └── azure-openai-service.js        # Main service (simplified to ~350 lines)
├── utils/
│   ├── errors.js                      # Custom error classes (kept as-is)
│   ├── logger.js                      # Winston logging (kept as-is)
│   └── retry.js                       # Simple retry with exponential backoff
└── index.js                           # Main exports
```

## What Was Kept

### Core Functionality:
- ✅ **LangChain Integration** - Full Azure OpenAI integration using LangChain
- ✅ **Error Handling** - Comprehensive custom error hierarchy
- ✅ **Logging** - Structured logging with Winston
- ✅ **Retry Logic** - Exponential backoff with jitter using p-retry
- ✅ **Conversation Management** - Multi-turn conversations with history
- ✅ **Streaming Support** - Real streaming using LangChain's stream API
- ✅ **Batch Processing** - Process multiple inputs sequentially
- ✅ **Metrics** - Track calls, errors, latency, success rate
- ✅ **Health Checks** - Service health monitoring

## Usage Examples

### Basic Chat

```javascript
import { createAzureOpenAIService } from './src/index.js';

// Initialize service
const service = await createAzureOpenAIService();

// Simple chat
const response = await service.chat('What is the capital of France?');
console.log(response.output);

// Chat with system message
const result = await service.chat('Write a haiku about coding', {
  systemMessage: 'You are a helpful assistant who writes concise responses.',
  temperature: 0.9
});
console.log(result.output);
```

### Conversation with History

```javascript
// Start a conversation
const convId = service.startConversation();

// First message
await service.chat('My name is Alice', { conversationId: convId });

// Second message - service remembers context
const response = await service.chat('What is my name?', { conversationId: convId });
console.log(response.output); // Should mention "Alice"

// Clear conversation when done
service.clearConversation(convId);
```

### Streaming Responses

```javascript
// Stream response in real-time
for await (const chunk of service.stream('Tell me a story about a robot')) {
  process.stdout.write(chunk);
}
```

### Batch Processing

```javascript
const inputs = [
  'What is 2+2?',
  'What is the capital of Japan?',
  'Explain quantum computing in one sentence.'
];

const { results, errors } = await service.batchProcess(inputs, {
  systemMessage: 'Be concise.'
});

results.forEach((result, i) => {
  console.log(`Result ${i}: ${result.output}`);
});
```

### Quick Start Helper

```javascript
import { quickStart } from './src/index.js';

// Quick start with convenience methods
const { chat, stream, batch } = await quickStart();

// Use convenience methods directly
const response = await chat('Hello!');
console.log(response.output);
```

### Custom Configuration

```javascript
const service = await createAzureOpenAIService({
  temperature: 0.5,
  maxTokens: 1500,
});
```

### Error Handling

```javascript
import { AzureOpenAIError, RateLimitError } from './src/index.js';

try {
  const response = await service.chat('Hello');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limited! Retry after:', error.details.retryAfter);
  } else if (error instanceof AzureOpenAIError) {
    console.error('Azure OpenAI error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Monitoring and Metrics

```javascript
// Get service metrics
const metrics = service.getMetrics();
console.log(metrics);
// {
//   totalCalls: 150,
//   totalTokens: 0,
//   errors: 3,
//   averageLatency: 1247.5,
//   successRate: 98,
//   uptime: 3600.5
// }

// Health check
const health = await service.healthCheck();
console.log(health.status); // 'healthy' or 'unhealthy'
```

### Custom Retry Configuration

```javascript
import { RetryWrapper } from './src/index.js';

// Custom retry logic (if needed outside the service)
const result = await RetryWrapper.execute(
  async () => {
    // Your async operation
    return await someApiCall();
  },
  {
    retries: 5,
    minTimeout: 2000,
    maxTimeout: 60000
  }
);
```

## Configuration

Set these environment variables in your `.env` file:

```bash
# Required
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_ENDPOINT=https://your-instance.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# Optional (with defaults)
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_MODEL_NAME=gpt-4
AZURE_OPENAI_TEMPERATURE=0.7
AZURE_OPENAI_MAX_TOKENS=2000

# App Configuration
LOG_LEVEL=info
ENABLE_RETRY=true
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

## Key Improvements

1. **Simpler API** - One main `chat()` method instead of multiple strategy methods
2. **Cleaner Code** - Reduced from ~2000+ lines to ~700 lines total
3. **Fewer Dependencies** - Removed unnecessary Joi validation
4. **Better Streaming** - Real streaming instead of simulated chunking
5. **Easier to Understand** - No complex abstraction layers
6. **Still Robust** - Maintains error handling, logging, and retry logic
7. **Production Ready** - All essential features for production use

## Migration Guide

### Old Code:
```javascript
const service = await createAzureOpenAIService();
const response = await service.executeZeroShot('Hello', {
  systemMessage: 'Be helpful'
});
```

### New Code:
```javascript
const service = await createAzureOpenAIService();
const response = await service.chat('Hello', {
  systemMessage: 'Be helpful'
});
```

The API is cleaner and more intuitive!

# Azure OpenAI LangChain Wrapper Service

A production-ready, modular JavaScript/TypeScript wrapper service for Azure OpenAI using LangChain. This service implements clean architecture principles with comprehensive error handling, retry logic, and support for multiple prompting strategies.

## 🚀 Features

- **Clean Architecture**: Modular design with separation of concerns
- **Multiple Prompting Strategies**:
  - ✅ Zero-shot prompting (fully implemented)
  - 🔄 Few-shot prompting (placeholder for expansion)
  - 🔄 Chain-of-thought reasoning (placeholder for expansion)
  - 🔄 Retrieval-augmented generation (placeholder for expansion)
- **Production-Ready Features**:
  - Comprehensive error handling with custom error classes
  - Retry logic with exponential backoff
  - Circuit breaker pattern for resilience
  - Structured logging with Winston
  - Configuration validation with Joi
  - Request/response caching
  - Batch processing support
  - Conversation management
  - Health checks and metrics

## 📁 Project Structure

```
azure-openai-langchain-wrapper/
├── package.json              # Dependencies and scripts
├── .env.example             # Environment variables template
├── src/
│   ├── index.js            # Main entry point and exports
│   ├── config/
│   │   └── config.js       # Configuration management
│   ├── services/
│   │   └── azure-openai-service.js  # Main Azure OpenAI service
│   ├── prompts/
│   │   ├── base-prompt.js          # Base prompt strategy class
│   │   ├── prompt-manager.js       # Prompt strategy manager
│   │   └── strategies/
│   │       ├── zero-shot.js        # Zero-shot implementation
│   │       ├── few-shot.js         # Few-shot placeholder
│   │       ├── chain-of-thought.js # CoT placeholder
│   │       └── retrieval-augmented.js # RAG placeholder
│   └── utils/
│       ├── logger.js       # Logging utility
│       ├── errors.js       # Error handling
│       └── retry.js        # Retry logic
└── examples/
    ├── basic-usage.js      # Basic usage examples
    └── advanced-usage.js   # Advanced patterns
```

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd azure-openai-langchain-wrapper
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Azure OpenAI credentials
```

## ⚙️ Configuration

Create a `.env` file with your Azure OpenAI credentials:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_MODEL_NAME=gpt-4

# Optional Configuration
AZURE_OPENAI_TEMPERATURE=0.7
AZURE_OPENAI_MAX_TOKENS=2000
LOG_LEVEL=info
ENABLE_RETRY=true
MAX_RETRY_ATTEMPTS=3
```

## 💻 Usage

### Quick Start

```javascript
import { quickStart } from 'azure-openai-langchain-wrapper';

const ai = await quickStart();

// Use zero-shot prompting
const result = await ai.zeroShot({
  task: 'Summarize',
  input: 'Your text here...'
});

console.log(result.output);
```

### Basic Usage

```javascript
import { createAzureOpenAIService } from 'azure-openai-langchain-wrapper';

// Initialize service
const service = await createAzureOpenAIService();

// Execute zero-shot prompt
const result = await service.executeZeroShot({
  task: 'Classify the sentiment',
  input: 'This product is amazing!'
});

console.log('Result:', result.output);
console.log('Metadata:', result.metadata);
```

### Custom Templates

```javascript
const result = await service.executeZeroShot(
  { text: 'Hello world', language: 'Spanish' },
  {
    template: 'Translate to {language}: {text}',
    outputFormat: 'text'
  }
);
```

### Using Prompt Builder

```javascript
import { getPromptManager } from 'azure-openai-langchain-wrapper';

const manager = getPromptManager();

const prompt = await manager.builder('zero-shot', {
  template: 'Analyze: {input}'
})
  .withRequiredFields('input')
  .withMaxLength('input', 1000)
  .withTrimming()
  .withValidator((vars) => {
    // Custom validation logic
    return true;
  })
  .build();

const formatted = await prompt.format({ input: 'Your text' });
```

### Batch Processing

```javascript
const inputs = [
  { task: 'Summarize', input: 'Text 1' },
  { task: 'Summarize', input: 'Text 2' },
  { task: 'Summarize', input: 'Text 3' }
];

const { results, errors } = await service.batchProcess(
  inputs,
  'zero-shot',
  { maxTokens: 100 }
);
```

### Conversation Management

```javascript
// Start a conversation
const conversationId = service.startConversation('chat-123');

// Add messages
service.addToConversation(conversationId, 'human', 'Hello');
service.addToConversation(conversationId, 'ai', 'Hi there!');

// Continue conversation with context
const response = await service.executeZeroShot(
  { input: 'What did I just say?' },
  { conversationId }
);
```

## 🎯 Prompting Strategies

### Zero-Shot Prompting (Implemented)

```javascript
const result = await service.executeZeroShot({
  task: 'Classify',
  input: 'Text to classify'
});
```

### Few-Shot Prompting (Placeholder)

```javascript
const result = await service.executeFewShot(
  { input: 'New example' },
  [
    { input: 'Example 1', output: 'Output 1' },
    { input: 'Example 2', output: 'Output 2' }
  ]
);
```

### Chain-of-Thought (Placeholder)

```javascript
const result = await service.executeChainOfThought({
  problem: 'Complex reasoning problem'
});
```

### Retrieval-Augmented Generation (Placeholder)

```javascript
const result = await service.executeRAG(
  { query: 'Question' },
  ['Context doc 1', 'Context doc 2']
);
```

## 🔧 Advanced Features

### Custom Prompt Strategies

```javascript
import { BasePromptStrategy } from 'azure-openai-langchain-wrapper';

class CustomPrompt extends BasePromptStrategy {
  async initialize() {
    // Custom initialization
    this.template = /* your template */;
    return this;
  }
}

// Register and use
manager.registerStrategy('custom', CustomPrompt);
const result = await service.executeWithStrategy('custom', input);
```

### Error Handling

```javascript
import { AzureOpenAIError, RateLimitError } from 'azure-openai-langchain-wrapper';

try {
  const result = await service.executeZeroShot(input);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.details.retryAfter);
  } else if (error instanceof AzureOpenAIError) {
    console.log('Azure error:', error.statusCode);
  }
}
```

### Retry Configuration

```javascript
import { RetryWrapper } from 'azure-openai-langchain-wrapper';

const result = await RetryWrapper.execute(
  async () => service.executeZeroShot(input),
  {
    retries: 5,
    minTimeout: 1000,
    maxTimeout: 30000,
    factor: 2
  }
);
```

### Circuit Breaker

```javascript
const result = await RetryWrapper.executeWithCircuitBreaker(
  async () => service.executeZeroShot(input),
  {
    threshold: 5,
    resetTimeout: 60000
  }
);
```

## 📊 Monitoring

### Health Checks

```javascript
const health = await service.healthCheck();
console.log('Status:', health.status);
console.log('Metrics:', health.metrics);
```

### Metrics

```javascript
const metrics = service.getMetrics();
console.log('Total calls:', metrics.totalCalls);
console.log('Success rate:', metrics.successRate);
console.log('Average latency:', metrics.averageLatency);
```

## 🏗️ Extending the Service

### Adding New Prompt Strategies

1. Create a new strategy class extending `BasePromptStrategy`
2. Implement the `initialize()` method
3. Register with the prompt manager
4. Use via `executeWithStrategy()`

### Adding New Features

The service is designed to be easily extensible:

- Add new validators in `src/prompts/base-prompt.js`
- Add new error types in `src/utils/errors.js`
- Add new retry strategies in `src/utils/retry.js`
- Add new output parsers in the service

## 🔍 Key Design Decisions

1. **ES Modules**: Using modern JavaScript modules for better tree-shaking and compatibility
2. **Separation of Concerns**: Each component has a single responsibility
3. **Dependency Injection**: Services can be configured and extended easily
4. **Strategy Pattern**: Prompt strategies can be swapped at runtime
5. **Builder Pattern**: Fluent API for constructing complex prompts
6. **Error Boundaries**: Comprehensive error handling at each layer
7. **Observability**: Built-in logging and metrics for production monitoring

## 🚦 API Reference

### Main Service

- `createAzureOpenAIService(config)` - Create and initialize service
- `service.executeZeroShot(input, options)` - Execute zero-shot prompt
- `service.executeWithStrategy(strategy, input, options)` - Execute with specific strategy
- `service.batchProcess(inputs, strategy, options)` - Process multiple inputs
- `service.healthCheck()` - Check service health

### Prompt Manager

- `getPromptManager()` - Get singleton instance
- `manager.createPrompt(strategy, options)` - Create a prompt
- `manager.builder(strategy, options)` - Get prompt builder
- `manager.registerStrategy(name, class)` - Register custom strategy

### Utilities

- `Logger` - Structured logging
- `ErrorHandler` - Error handling utilities
- `RetryWrapper` - Retry logic implementation

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AZURE_OPENAI_API_KEY` | API key for Azure OpenAI | Required |
| `AZURE_OPENAI_API_ENDPOINT` | Azure OpenAI endpoint URL | Required |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployment name | Required |
| `AZURE_OPENAI_API_VERSION` | API version | 2024-02-15-preview |
| `AZURE_OPENAI_TEMPERATURE` | Model temperature | 0.7 |
| `AZURE_OPENAI_MAX_TOKENS` | Max tokens in response | 2000 |
| `LOG_LEVEL` | Logging level | info |
| `ENABLE_RETRY` | Enable retry logic | true |
| `MAX_RETRY_ATTEMPTS` | Maximum retry attempts | 3 |

## 🤝 Contributing

Contributions are welcome! The service is designed to be easily extensible:

1. Fork the repository
2. Create a feature branch
3. Implement your feature (especially filling in placeholder strategies!)
4. Add tests and examples
5. Submit a pull request

## 📄 License

MIT

## 🔮 Future Enhancements

- [ ] Complete few-shot prompting implementation
- [ ] Complete chain-of-thought implementation
- [ ] Complete RAG implementation with vector stores
- [ ] Add agent-based prompting
- [ ] Add streaming support
- [ ] Add TypeScript definitions
- [ ] Add comprehensive test suite
- [ ] Add performance benchmarks
- [ ] Add OpenTelemetry integration
- [ ] Add webhook support for async operations

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

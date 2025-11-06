# Azure OpenAI LangChain Wrapper# Azure OpenAI LangChain Wrapper



A simple wrapper for Azure OpenAI using LangChain. Makes it easy to chat with GPT models, stream responses, and handle errors gracefully.A simple Node.js wrapper for Azure OpenAI using LangChain. Makes it easy to chat with GPT models, stream responses, and handle errors gracefully.



## What's Inside## Features



- **Simple Chat API** - Ask questions, get answers- **Clean Architecture**: Modular design with clear separation of concerns

- **Streaming** - Get responses word-by-word in real-time- **Multiple Prompting Strategies**:

- **Batch Processing** - Process multiple requests at once  - Zero-shot prompting (fully implemented)

- **Error Handling** - Automatic retries with exponential backoff  - Few-shot prompting (extensible framework)

- **Logging** - Built-in Winston logging  - Chain-of-thought reasoning (extensible framework)

- **Metrics** - Track your API usage and performance  - Retrieval-augmented generation (extensible framework)

- **Production-Ready Capabilities**:

## Quick Setup  - Comprehensive error handling with custom error classes

  - Retry logic with exponential backoff

### 1. Install Dependencies  - Circuit breaker pattern for system resilience

  - Structured logging with Winston

```bash  - Configuration validation with Joi

npm install  - Request/response caching mechanisms

```  - Batch processing support

  - Health checks and performance metrics

### 2. Configure Your Azure Credentials

## Project Structure

Copy the example env file:

```

```bashazure-openai-langchain-wrapper/

cp .env.example .env├── package.json              # Dependencies and scripts

```├── .env.example             # Environment variables template

├── src/

Edit `.env` with your Azure OpenAI details:│   ├── index.js            # Main entry point and exports

│   ├── config/

```bash│   │   └── config.js       # Configuration management

AZURE_OPENAI_API_KEY=your-api-key-here│   ├── services/

AZURE_OPENAI_API_ENDPOINT=https://your-resource.openai.azure.com│   │   └── azure-openai-service.js  # Main Azure OpenAI service

AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name│   ├── prompts/

```│   │   ├── base-prompt.js          # Base prompt strategy class

│   │   ├── prompt-manager.js       # Prompt strategy manager

That's it! You're ready to go.│   │   └── strategies/

│   │       ├── zero-shot.js        # Zero-shot implementation

## Running the Examples│   │       ├── few-shot.js         # Few-shot placeholder

│   │       ├── chain-of-thought.js # CoT placeholder

### Basic Examples│   │       └── retrieval-augmented.js # RAG placeholder

│   └── utils/

Run all basic examples:│       ├── logger.js       # Logging utility

│       ├── errors.js       # Error handling

```bash│       └── retry.js        # Retry logic

node examples/basic-usage.js└── examples/

```    ├── basic-usage.js      # Basic usage examples

    └── advanced-usage.js   # Advanced patterns

This shows you:```

- Simple chat

- Chat with system messages## Installation

- Streaming responses

- Batch processing1. Clone the repository:

- Custom parameters (temperature, max tokens)```bash

- Error handlinggit clone <repository-url>

- Health checks & metricscd azure-openai-langchain-wrapper

- Quick start helper```



### Advanced Examples2. Install dependencies:

```bash

Run advanced patterns:npm install

```

```bash

node examples/advanced-usage.js3. Configure environment variables:

``````bash

cp .env.example .env

This demonstrates:# Edit .env with your Azure OpenAI credentials

- Caching layer```

- Structured JSON output parsing

- Custom retry logic## Configuration

- Concurrent processing

- Response validationCreate a `.env` file with your Azure OpenAI credentials:

- Simple RAG pattern

- Middleware pattern```env

# Azure OpenAI Configuration

## Basic UsageAZURE_OPENAI_API_KEY=your-api-key

AZURE_OPENAI_API_ENDPOINT=https://your-resource.openai.azure.com

### Simple ChatAZURE_OPENAI_API_VERSION=2024-02-15-preview

AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

```javascriptAZURE_OPENAI_MODEL_NAME=gpt-4

import { createAzureOpenAIService } from './src/index.js';

# Optional Configuration

const service = await createAzureOpenAIService();AZURE_OPENAI_TEMPERATURE=0.7

AZURE_OPENAI_MAX_TOKENS=2000

const result = await service.chat('What is the capital of France?');LOG_LEVEL=info

console.log(result.output);ENABLE_RETRY=true

```MAX_RETRY_ATTEMPTS=3

```

### Chat with System Message

## Usage

```javascript

const result = await service.chat('Explain quantum computing', {### Quick Start

  systemMessage: 'You are a helpful assistant who explains things simply.',

  temperature: 0.7```javascript

});import { quickStart } from 'azure-openai-langchain-wrapper';

```

const ai = await quickStart();

### Streaming Response

// Use zero-shot prompting

```javascriptconst result = await ai.zeroShot({

for await (const chunk of service.stream('Tell me a story')) {  task: 'Summarize',

  process.stdout.write(chunk);  input: 'Your text here...'

}});

```

console.log(result.output);

### Batch Processing```



```javascript### Basic Usage

const inputs = [

  'What is 2+2?',```javascript

  'What is the capital of Japan?',import { createAzureOpenAIService } from 'azure-openai-langchain-wrapper';

  'Name a programming language.'

];// Initialize service

const service = await createAzureOpenAIService();

const { results, errors } = await service.batchProcess(inputs);

// Execute zero-shot prompt

results.forEach((result, i) => {const result = await service.executeZeroShot({

  console.log(`${i + 1}. ${result.output}`);  task: 'Classify the sentiment',

});  input: 'This product is amazing!'

```});



### Quick Start Helperconsole.log('Result:', result.output);

console.log('Metadata:', result.metadata);

```javascript```

import { quickStart } from './src/index.js';

### Custom Templates

const { chat, stream, batch } = await quickStart();

```javascript

const result = await chat('Hello!');const result = await service.executeZeroShot(

console.log(result.output);  { text: 'Hello world', language: 'Spanish' },

```  {

    template: 'Translate to {language}: {text}',

## Configuration Options    outputFormat: 'text'

  }

Override defaults when creating the service:);

```

```javascript

const service = await createAzureOpenAIService({### Using Prompt Builder

  temperature: 0.5,      // More deterministic (0-1)

  maxTokens: 1500,       // Shorter responses```javascript

});import { getPromptManager } from 'azure-openai-langchain-wrapper';

```

const manager = getPromptManager();

## Error Handling

const prompt = await manager.builder('zero-shot', {

```javascript  template: 'Analyze: {input}'

import { AzureOpenAIError, RateLimitError } from './src/index.js';})

  .withRequiredFields('input')

try {  .withMaxLength('input', 1000)

  const result = await service.chat('Hello');  .withTrimming()

} catch (error) {  .withValidator((vars) => {

  if (error instanceof RateLimitError) {    // Custom validation logic

    console.log('Rate limited! Retry after:', error.details.retryAfter);    return true;

  } else if (error instanceof AzureOpenAIError) {  })

    console.log('Azure error:', error.message);  .build();

  }

}const formatted = await prompt.format({ input: 'Your text' });

``````



## Monitoring### Batch Processing



### Get Metrics```javascript

const inputs = [

```javascript  { task: 'Summarize', input: 'Text 1' },

const metrics = service.getMetrics();  { task: 'Summarize', input: 'Text 2' },

console.log('Total calls:', metrics.totalCalls);  { task: 'Summarize', input: 'Text 3' }

console.log('Success rate:', metrics.successRate.toFixed(2) + '%');];

console.log('Average latency:', metrics.averageLatency.toFixed(0) + 'ms');

```const { results, errors } = await service.batchProcess(

  inputs,

### Health Check  'zero-shot',

  { maxTokens: 100 }

```javascript);

const health = await service.healthCheck();```

console.log('Status:', health.status); // 'healthy' or 'unhealthy'

```## Prompting Strategies



## Project Structure### Zero-Shot Prompting (Implemented)



``````javascript

src/const result = await service.executeZeroShot({

├── config/  task: 'Classify',

│   └── config.js                 # Configuration management  input: 'Text to classify'

├── services/});

│   └── azure-openai-service.js   # Main service```

├── utils/

│   ├── errors.js                 # Error handling### Few-Shot Prompting (Placeholder)

│   ├── logger.js                 # Winston logging

│   └── retry.js                  # Retry logic```javascript

└── index.js                      # Exportsconst result = await service.executeFewShot(

  { input: 'New example' },

examples/  [

├── basic-usage.js                # Simple examples    { input: 'Example 1', output: 'Output 1' },

└── advanced-usage.js             # Advanced patterns    { input: 'Example 2', output: 'Output 2' }

```  ]

);

## Environment Variables```



| Variable | Required | Default | Description |### Chain-of-Thought (Placeholder)

|----------|----------|---------|-------------|

| `AZURE_OPENAI_API_KEY` | ✅ | - | Your Azure OpenAI API key |```javascript

| `AZURE_OPENAI_API_ENDPOINT` | ✅ | - | Your Azure OpenAI endpoint |const result = await service.executeChainOfThought({

| `AZURE_OPENAI_DEPLOYMENT_NAME` | ✅ | - | Your deployment name |  problem: 'Complex reasoning problem'

| `AZURE_OPENAI_API_VERSION` | No | `2024-02-15-preview` | API version |});

| `AZURE_OPENAI_MODEL_NAME` | No | `gpt-4` | Model name |```

| `AZURE_OPENAI_TEMPERATURE` | No | `0.7` | Temperature (0-1) |

| `AZURE_OPENAI_MAX_TOKENS` | No | `2000` | Max response tokens |### Retrieval-Augmented Generation (Placeholder)

| `LOG_LEVEL` | No | `info` | Logging level |

| `ENABLE_RETRY` | No | `true` | Enable automatic retries |```javascript

| `MAX_RETRY_ATTEMPTS` | No | `3` | Max retry attempts |const result = await service.executeRAG(

  { query: 'Question' },

## Key Dependencies  ['Context doc 1', 'Context doc 2']

);

- `@langchain/azure-openai` - LangChain Azure integration```

- `langchain` - LangChain core

- `winston` - Logging## Advanced Features

- `dotenv` - Environment variables

- `p-retry` - Retry logic### Custom Prompt Strategies



## License```javascript

import { BasePromptStrategy } from 'azure-openai-langchain-wrapper';

MIT

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

## Monitoring

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

## Extending the Service

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

## Key Design Decisions

1. **ES Modules**: Using modern JavaScript modules for better tree-shaking and compatibility
2. **Separation of Concerns**: Each component has a single responsibility
3. **Dependency Injection**: Services can be configured and extended easily
4. **Strategy Pattern**: Prompt strategies can be swapped at runtime
5. **Builder Pattern**: Fluent API for constructing complex prompts
6. **Error Boundaries**: Comprehensive error handling at each layer
7. **Observability**: Built-in logging and metrics for production monitoring

## API Reference

### Main Service

- `createAzureOpenAIService(config)` - Create and initialize service
- `service.chat(input, options)` - Execute a chat completion
- `service.stream(input, options)` - Stream a chat response
- `service.batchProcess(inputs, options)` - Process multiple inputs
- `service.executeZeroShot(input, options)` - Execute zero-shot prompt
- `service.executeWithStrategy(strategy, input, options)` - Execute with specific strategy
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

## Environment Variables

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

## Contributing

Contributions are welcome. The service is designed to be easily extensible:

1. Fork the repository
2. Create a feature branch
3. Implement your feature
4. Add tests and examples
5. Submit a pull request

## License

MIT

## Future Enhancements

- Complete few-shot prompting implementation
- Complete chain-of-thought implementation
- Complete RAG implementation with vector stores
- Add agent-based prompting
- Add streaming support
- Add TypeScript definitions
- Add comprehensive test suite
- Add performance benchmarks
- Add OpenTelemetry integration
- Add webhook support for async operations

## Support

For issues, questions, or suggestions, please open an issue in the repository.

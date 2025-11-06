# Azure OpenAI LangChain Wrapper

Hey there! This is a simple, modular wrapper for Azure OpenAI using LangChain. It makes working with Azure OpenAI super easy by handling all the boilerplate stuff like retry logic, error handling, logging, and metrics tracking.

## What's This Thing Do?

Basically, it wraps Azure OpenAI with LangChain to give you:
- Simple chat interfaces (no more messing with raw API calls)
- Streaming responses (watch the AI think in real-time)
- Batch processing (process multiple prompts at once)
- Automatic retry logic (because networks are flaky)
- Built-in error handling (with proper error types)
- Metrics and health checks (know what's going on)
- Super clean logging (Winston-powered)

## Quick Setup

### 1. Install Dependencies

First, grab all the packages:

```bash
npm install
```

### 2. Configure Your Azure OpenAI

Copy the example env file and fill in your Azure OpenAI details:

```bash
cp .env.example .env
```

Then edit `.env` with your actual Azure OpenAI credentials:

```bash
# Required stuff
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# Optional tweaks
AZURE_OPENAI_MODEL_NAME=gpt-4
AZURE_OPENAI_TEMPERATURE=0.7
AZURE_OPENAI_MAX_TOKENS=2000
LOG_LEVEL=info
```

**Where to find your Azure OpenAI stuff:**
- API Key: Azure Portal → Your OpenAI Resource → Keys and Endpoint
- Endpoint: Same place, looks like `https://your-name.openai.azure.com`
- Deployment Name: Azure Portal → Your OpenAI Resource → Model deployments

### 3. Verify Your Setup

Run the setup checker to make sure everything is configured correctly:

```bash
node check-setup.js
```

This will tell you if anything is missing or misconfigured.

### 4. Run the Examples
- Endpoint: Same place as the API key
- Deployment Name: Azure Portal → Your OpenAI Resource → Model deployments

## Running the Examples

We've got two example files that show you how to use this wrapper:

### Basic Examples

Run all the basic examples at once:

```bash
node examples/basic-usage.js
```

This will run through:
1. Simple chat - Basic question/answer
2. Chat with system message - Control the AI's personality
3. Streaming response - Real-time text generation
4. Batch processing - Multiple prompts at once
5. Custom parameters - Tweak temperature and tokens
6. Error handling - How to catch and handle errors
7. Health check and metrics - Check service status
8. Quick start helper - Simplest way to get started

### Advanced Examples

Once you're comfortable with the basics, try the advanced patterns:

```bash
node examples/advanced-usage.js
```

These show you:
1. Caching layer - Cache responses to save API calls
2. Structured JSON output - Parse and validate JSON responses
3. Custom retry logic - Fine-tune retry behavior
4. Concurrent processing - Use Promise.all for parallel requests
5. Response validation - Validate and retry if output is wrong
6. Simple RAG pattern - Basic retrieval-augmented generation
7. Middleware pattern - Add hooks before/after requests

### Running Individual Examples

You can also run specific examples by importing them. Just check out the code and run whichever function you want!

## Basic Usage in Your Code

Super simple to get started:

```javascript
import { createAzureOpenAIService } from './src/index.js';

// Create the service
const service = await createAzureOpenAIService();

// Ask a question
const result = await service.chat('What is the meaning of life?');
console.log(result.output);
```

### Even Simpler with Quick Start

```javascript
import { quickStart } from './src/index.js';

const { chat } = await quickStart();

const result = await chat('Tell me a joke');
console.log(result.output);
```

### Streaming Responses

Want to see the response as it's generated?

```javascript
const service = await createAzureOpenAIService();

for await (const chunk of service.stream('Write a poem about coding')) {
  process.stdout.write(chunk);
}
```

### Batch Processing

Process multiple prompts efficiently:

```javascript
const service = await createAzureOpenAIService();

const inputs = [
  'What is JavaScript?',
  'What is Python?',
  'What is Go?'
];

const { results, errors } = await service.batchProcess(inputs);
results.forEach(r => console.log(r.output));
```

## Features You Get For Free

### Error Handling

The wrapper catches and wraps errors into useful types:
- `RateLimitError` - You hit the rate limit
- `AzureOpenAIError` - Something went wrong with Azure
- `ValidationError` - Invalid input
- `ConfigurationError` - Setup issues

```javascript
try {
  const result = await service.chat('Hello!');
} catch (error) {
  if (error.name === 'RateLimitError') {
    console.log('Retry after:', error.details.retryAfter);
  }
}
```

### Metrics

Track how your service is performing:

```javascript
const metrics = service.getMetrics();
console.log(`Success rate: ${metrics.successRate}%`);
console.log(`Average latency: ${metrics.averageLatency}ms`);
console.log(`Total calls: ${metrics.totalCalls}`);
```

### Health Checks

Make sure everything's working:

```javascript
const health = await service.healthCheck();
console.log('Status:', health.status); // 'healthy' or 'unhealthy'
```

## Project Structure

```
azure-openai-langchain-wrapper/
├── src/
│   ├── config/          # Configuration files
│   ├── services/        # Main service implementation
│   ├── utils/           # Helpers (logger, errors, retry)
│   └── index.js         # Main entry point
├── examples/
│   ├── basic-usage.js   # Basic examples
│   └── advanced-usage.js # Advanced patterns
├── .env.example         # Example environment variables
└── package.json         # Dependencies and scripts
```

## Tips & Tricks

1. **Start with basic-usage.js** - Get familiar with the core features first
2. **Use environment variables** - Keep your secrets out of code
3. **Enable logging** - Set `LOG_LEVEL=debug` in .env to see what's happening
4. **Watch your rate limits** - Azure has limits, use batch processing when possible
5. **Lower temperature for consistency** - Use 0.3 or lower for more predictable outputs
6. **Higher temperature for creativity** - Use 0.9+ for creative tasks

## Common Issues & Troubleshooting

### Connection Test Failed

If you see `Connection test failed` error:

1. **Run the setup checker:**
   ```bash
   node check-setup.js
   ```

2. **Common causes:**
   - **Wrong endpoint format** - Most common issue! Your endpoint should be:
     - ✅ Correct: `https://your-name.openai.azure.com`
     - ❌ Wrong: `https://your-name.cognitiveservices.azure.com`
   - Missing or incorrect API key
   - Deployment name doesn't exist in your Azure OpenAI resource
   - Network/firewall issues

3. **Verify your Azure OpenAI resource:**
   - Go to Azure Portal
   - Navigate to your Azure OpenAI resource
   - Check "Keys and Endpoint" section
   - **Important**: Make sure the endpoint ends with `.openai.azure.com`
   - Check "Model deployments" - make sure your deployment name matches

### Wrong Endpoint Format (ENOTFOUND error)

If you see `getaddrinfo ENOTFOUND` with `cognitiveservices.azure.com`:

```bash
# WRONG ❌
AZURE_OPENAI_API_ENDPOINT=https://your-name.cognitiveservices.azure.com

# CORRECT ✅
AZURE_OPENAI_API_ENDPOINT=https://your-name.openai.azure.com
```

Azure OpenAI uses a different endpoint format than regular Cognitive Services!

### Configuration Errors

**"Missing required Azure OpenAI configuration"** 
- Make sure you have a `.env` file (copy from `.env.example`)
- Check all required fields are filled in (not placeholder values)

### Rate Limit Errors

**"Rate limit exceeded"** 
- You're making too many requests
- The wrapper will auto-retry with exponential backoff
- Consider using batch processing or adding delays between requests

### Invalid Deployment Error

**"Invalid deployment name"**
- Double-check your `AZURE_OPENAI_DEPLOYMENT_NAME` matches exactly what's in Azure Portal
- Deployment names are case-sensitive

### Other Issues

Run with debug logging to see what's happening:
```bash
LOG_LEVEL=debug node examples/basic-usage.js
```

## Testing

Run the tests (if you want):

```bash
npm test
```

## License

MIT - Do whatever you want with it!

## Need Help?

Check out the examples folder - there's a ton of working code in there. Start with `basic-usage.js` and work your way up to `advanced-usage.js`.

Happy coding! 🚀

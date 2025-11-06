// examples/advanced-usage.js
/**
 * Advanced usage patterns for Azure OpenAI LangChain Wrapper
 */

import {
  createAzureOpenAIService,
  Logger,
  RetryWrapper,
  AzureOpenAIError
} from '../src/index.js';

/**
 * Example 1: Caching layer for repeated queries
 */
async function cachingLayer() {
  console.log('\n=== Advanced Example 1: Caching Layer ===');

  class CachedAzureService {
    constructor(service) {
      this.service = service;
      this.cache = new Map();
      this.ttl = 60000; // 1 minute cache TTL
    }

    getCacheKey(input, options) {
      return JSON.stringify({ input, options: options || {} });
    }

    async chat(input, options = {}) {
      const key = this.getCacheKey(input, options);

      // Check cache
      if (this.cache.has(key)) {
        const cached = this.cache.get(key);
        if (Date.now() - cached.timestamp < this.ttl) {
          console.log('  [Cache HIT]');
          return { ...cached.result, cached: true };
        } else {
          this.cache.delete(key);
        }
      }

      // Cache miss - fetch from API
      console.log('  [Cache MISS]');
      const result = await this.service.chat(input, options);

      // Store in cache
      this.cache.set(key, {
        result,
        timestamp: Date.now()
      });

      return result;
    }

    clearCache() {
      this.cache.clear();
    }

    getCacheStats() {
      return {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      };
    }
  }

  const baseService = await createAzureOpenAIService();
  const cachedService = new CachedAzureService(baseService);

  // First call - cache miss
  const result1 = await cachedService.chat('What is 2+2?');
  console.log('First call duration:', result1.metadata.duration + 'ms');

  // Second call - cache hit
  const result2 = await cachedService.chat('What is 2+2?');
  console.log('Second call (cached):', result2.cached ? 'instant' : result2.metadata.duration + 'ms');

  console.log('Cache stats:', cachedService.getCacheStats());
}

/**
 * Example 2: Structured JSON output parsing
 */
async function structuredOutputParsing() {
  console.log('\n=== Advanced Example 2: Structured Output Parsing ===');

  const service = await createAzureOpenAIService();

  // Helper to parse and validate JSON responses
  function parseStructuredOutput(output, schema) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(output);

      // Validate required fields
      for (const field of schema.required || []) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return parsed;
    } catch (error) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/) ||
                       output.match(/```\s*([\s\S]*?)\s*```/) ||
                       output.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // Validate required fields
        for (const field of schema.required || []) {
          if (!(field in parsed)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        return parsed;
      }

      throw new Error('Failed to parse JSON from output');
    }
  }

  const prompt = `Extract information from this text and return as JSON with fields: name, email, company, role.

Text: "John Doe (john.doe@techcorp.com) is the Senior Engineer at TechCorp Inc."

Return ONLY valid JSON, no additional text.`;

  const result = await service.chat(prompt, {
    systemMessage: 'You are a data extraction assistant. Always return valid JSON.',
    temperature: 0.3
  });

  const structured = parseStructuredOutput(result.output, {
    required: ['name', 'email', 'company']
  });

  console.log('Extracted data:', structured);
}

/**
 * Example 3: Custom retry logic with specific error handling
 */
async function customRetryLogic() {
  console.log('\n=== Advanced Example 3: Custom Retry Logic ===');

  const service = await createAzureOpenAIService();

  // Custom retry with specific handling for different error types
  async function chatWithCustomRetry(input, options = {}) {
    return RetryWrapper.execute(
      async () => {
        try {
          return await service.chat(input, options);
        } catch (error) {
          // Log specific error types
          if (error.name === 'RateLimitError') {
            console.log('  Rate limited, will retry...');
          } else if (error.statusCode === 429) {
            console.log('  Too many requests, backing off...');
          }
          throw error;
        }
      },
      {
        retries: 5,
        minTimeout: 2000,
        maxTimeout: 30000,
        factor: 2,
        randomize: true
      }
    );
  }

  const result = await chatWithCustomRetry('What is machine learning?');
  console.log('Result:', result.output.substring(0, 100) + '...');
}

/**
 * Example 4: Concurrent processing with Promise.all
 */
async function concurrentProcessing() {
  console.log('\n=== Advanced Example 4: Concurrent Processing ===');

  const service = await createAzureOpenAIService();

  const questions = [
    'What is JavaScript?',
    'What is Python?',
    'What is TypeScript?',
    'What is Go?',
    'What is Rust?'
  ];

  console.log(`Processing ${questions.length} questions concurrently...`);

  const startTime = Date.now();

  // Process all questions concurrently
  const results = await Promise.all(
    questions.map(q => service.chat(q, {
      systemMessage: 'Answer in one sentence.',
      maxTokens: 100
    }))
  );

  const duration = Date.now() - startTime;

  console.log(`Completed ${results.length} requests in ${duration}ms`);
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.output}`);
  });
}

/**
 * Example 5: Multi-step conversation with context building
 */
async function multiStepConversation() {
  console.log('\n=== Advanced Example 5: Multi-Step Conversation ===');

  const service = await createAzureOpenAIService();
  const convId = service.startConversation();

  const steps = [
    {
      message: 'I need help planning a Python project.',
      systemMsg: 'You are a helpful software architect.'
    },
    {
      message: 'It should be a REST API for a todo application.',
      systemMsg: 'You are a helpful software architect.'
    },
    {
      message: 'What framework would you recommend?',
      systemMsg: 'You are a helpful software architect.'
    },
    {
      message: 'Can you outline the project structure?',
      systemMsg: 'You are a helpful software architect.'
    }
  ];

  console.log('Multi-step conversation:\n');

  for (const [index, step] of steps.entries()) {
    console.log(`User: ${step.message}`);

    const result = await service.chat(step.message, {
      conversationId: convId,
      systemMessage: step.systemMsg
    });

    console.log(`AI: ${result.output.substring(0, 150)}...\n`);
  }

  // Conversation history
  const history = service.getConversationHistory(convId);
  console.log(`Total messages in conversation: ${history.length}`);

  service.clearConversation(convId);
}

/**
 * Example 6: Response validation and retry on invalid output
 */
async function responseValidation() {
  console.log('\n=== Advanced Example 6: Response Validation ===');

  const service = await createAzureOpenAIService();

  async function chatWithValidation(input, validator, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await service.chat(input, {
        temperature: 0.3 // Lower temperature for more consistent output
      });

      try {
        const isValid = validator(result.output);
        if (isValid) {
          return result;
        }
        throw new Error('Validation failed');
      } catch (error) {
        lastError = error;
        console.log(`  Attempt ${attempt} failed validation, retrying...`);

        if (attempt < maxRetries) {
          // Add clarification to the input
          input += '\n\nPlease ensure your response follows the exact format requested.';
        }
      }
    }

    throw new Error(`Failed validation after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Validator: ensure response contains a number
  const numberValidator = (output) => {
    return /\d+/.test(output);
  };

  const result = await chatWithValidation(
    'What is 5 multiplied by 7? Respond with ONLY the number.',
    numberValidator
  );

  console.log('Validated response:', result.output);
}

/**
 * Example 7: Building a simple RAG pattern manually
 */
async function simpleRAGPattern() {
  console.log('\n=== Advanced Example 7: Simple RAG Pattern ===');

  const service = await createAzureOpenAIService();

  // Simulated knowledge base
  const knowledgeBase = [
    'Azure OpenAI Service provides REST API access to OpenAI language models.',
    'The service supports GPT-4, GPT-3.5-Turbo, and Embeddings models.',
    'You can deploy models in specific Azure regions for data residency.',
    'Rate limits depend on your Azure subscription tier.',
    'All data is encrypted at rest and in transit.'
  ];

  // Simple retrieval: find relevant context (in production, use vector search)
  function retrieveContext(query, docs) {
    // Naive keyword matching (use embeddings in production)
    const keywords = query.toLowerCase().split(' ');
    const scored = docs.map(doc => {
      const score = keywords.filter(kw => doc.toLowerCase().includes(kw)).length;
      return { doc, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.doc);
  }

  const query = 'What models are available in Azure OpenAI?';
  const context = retrieveContext(query, knowledgeBase);

  const prompt = `Answer the question based on the following context:

Context:
${context.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Question: ${query}

Answer:`;

  const result = await service.chat(prompt, {
    systemMessage: 'You are a helpful assistant. Answer based only on the provided context.',
    temperature: 0.3
  });

  console.log('Question:', query);
  console.log('Retrieved context:', context.length, 'documents');
  console.log('Answer:', result.output);
}

/**
 * Example 8: Implementing request/response middleware
 */
async function middlewarePattern() {
  console.log('\n=== Advanced Example 8: Middleware Pattern ===');

  class ServiceWithMiddleware {
    constructor(service) {
      this.service = service;
      this.beforeMiddleware = [];
      this.afterMiddleware = [];
    }

    use(type, fn) {
      if (type === 'before') {
        this.beforeMiddleware.push(fn);
      } else if (type === 'after') {
        this.afterMiddleware.push(fn);
      }
    }

    async chat(input, options = {}) {
      // Run before middleware
      let modifiedInput = input;
      let modifiedOptions = options;

      for (const middleware of this.beforeMiddleware) {
        const result = await middleware(modifiedInput, modifiedOptions);
        modifiedInput = result.input;
        modifiedOptions = result.options;
      }

      // Execute request
      const result = await this.service.chat(modifiedInput, modifiedOptions);

      // Run after middleware
      let modifiedResult = result;
      for (const middleware of this.afterMiddleware) {
        modifiedResult = await middleware(modifiedResult);
      }

      return modifiedResult;
    }
  }

  const baseService = await createAzureOpenAIService();
  const service = new ServiceWithMiddleware(baseService);

  // Add logging middleware
  service.use('before', async (input, options) => {
    console.log('  [Before] Input length:', input.length);
    return { input, options };
  });

  service.use('after', async (result) => {
    console.log('  [After] Response length:', result.output.length);
    console.log('  [After] Duration:', result.metadata.duration + 'ms');
    return result;
  });

  // Add profanity filter middleware
  service.use('before', async (input, options) => {
    const sanitized = input.replace(/badword/gi, '***');
    return { input: sanitized, options };
  });

  const result = await service.chat('What is machine learning?');
  console.log('Final result:', result.output.substring(0, 100) + '...');
}

/**
 * Run all advanced examples
 */
async function runAllAdvancedExamples() {
  const examples = [
    cachingLayer,
    structuredOutputParsing,
    customRetryLogic,
    concurrentProcessing,
    multiStepConversation,
    responseValidation,
    simpleRAGPattern,
    middlewarePattern
  ];

  for (const example of examples) {
    try {
      await example();
    } catch (error) {
      console.error(`\nError in ${example.name}:`, error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  }

  console.log('\n=== All advanced examples completed ===');
}

// Run if main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAdvancedExamples().catch(console.error);
}

export {
  cachingLayer,
  structuredOutputParsing,
  customRetryLogic,
  concurrentProcessing,
  multiStepConversation,
  responseValidation,
  simpleRAGPattern,
  middlewarePattern
};

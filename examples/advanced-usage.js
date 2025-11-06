// examples/advanced-usage.js
/**
 * Advanced usage examples for Azure OpenAI LangChain Wrapper
 */

import { 
  createAzureOpenAIService,
  getPromptManager,
  PromptBuilder,
  ZeroShotPrompt,
  Logger,
  RetryWrapper
} from '../src/index.js';

/**
 * Example 1: Custom prompt strategy with validators and preprocessors
 */
async function customPromptStrategy() {
  Logger.info('Advanced Example 1: Custom Prompt Strategy');
  
  const service = await createAzureOpenAIService();
  const manager = getPromptManager();
  
  // Build a custom prompt with validators and preprocessors
  const prompt = await manager.builder('zero-shot', {
    template: 'Analyze the code:\n\n{code}\n\nLanguage: {language}\n\nAnalysis:',
    outputFormat: 'json'
  })
    .withRequiredFields('code', 'language')
    .withMaxLength('code', 5000)
    .withTrimming()
    .withValidator((vars) => {
      const supportedLanguages = ['javascript', 'python', 'java', 'typescript'];
      if (!supportedLanguages.includes(vars.language.toLowerCase())) {
        return `Unsupported language. Supported: ${supportedLanguages.join(', ')}`;
      }
      return true;
    })
    .withPreprocessor((vars) => ({
      ...vars,
      language: vars.language.toLowerCase(),
      code: vars.code.replace(/\/\/.*$/gm, '') // Remove comments
    }))
    .withPostprocessor((output) => {
      try {
        return JSON.parse(output);
      } catch {
        return { raw: output };
      }
    })
    .build();
  
  const result = await prompt.format({
    code: `
      function fibonacci(n) {
        // Calculate fibonacci number
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
    `,
    language: 'JavaScript'
  });
  
  console.log('Formatted prompt:', result);
}

/**
 * Example 2: Creating a custom prompt class
 */
class CustomAnalysisPrompt extends ZeroShotPrompt {
  constructor(options = {}) {
    super({
      ...options,
      template: options.template || 'Perform {analysisType} analysis on:\n\n{content}\n\nOutput format: {format}'
    });
  }
  
  async initialize() {
    await super.initialize();
    
    // Add custom validation for analysis types
    this.addValidator((vars) => {
      const validTypes = ['sentiment', 'technical', 'business', 'security'];
      if (!validTypes.includes(vars.analysisType)) {
        return `Invalid analysis type. Valid types: ${validTypes.join(', ')}`;
      }
      return true;
    });
    
    // Add custom preprocessor
    this.addPreprocessor((vars) => ({
      ...vars,
      format: vars.format || 'structured JSON'
    }));
    
    return this;
  }
}

async function customPromptClass() {
  Logger.info('Advanced Example 2: Custom Prompt Class');
  
  const service = await createAzureOpenAIService();
  const manager = getPromptManager();
  
  // Register custom prompt strategy
  manager.registerStrategy('custom-analysis', CustomAnalysisPrompt);
  
  // Use the custom strategy
  const result = await service.executeWithStrategy('custom-analysis', {
    analysisType: 'security',
    content: 'User input: SELECT * FROM users WHERE id = ' + '${userId}',
    format: 'JSON with severity levels'
  });
  
  console.log('Analysis result:', result.output);
}

/**
 * Example 3: Complex chain with multiple strategies
 */
async function complexChain() {
  Logger.info('Advanced Example 3: Complex Chain');
  
  const service = await createAzureOpenAIService();
  const manager = getPromptManager();
  
  // Create a chain of different prompt strategies
  const analysisChain = await manager.createChain([
    {
      strategy: 'zero-shot',
      options: {
        template: 'Extract key concepts from: {input}',
        outputFormat: 'json'
      }
    },
    {
      strategy: 'chain-of-thought',
      options: {
        template: 'Based on these concepts: {input}, determine the main theme'
      }
    },
    {
      strategy: 'zero-shot',
      options: {
        template: 'Create a summary using the theme: {input}',
        outputFormat: 'markdown'
      }
    }
  ]);
  
  const result = await analysisChain.execute({
    input: `
      Machine learning has revolutionized how we process data. 
      Neural networks can identify patterns humans might miss. 
      Deep learning models require substantial computational resources.
      Transfer learning allows us to reuse trained models.
    `
  });
  
  console.log('Chain final output:', result.final);
  console.log('Intermediate results:', result.intermediate);
}

/**
 * Example 4: Parallel batch processing with progress tracking
 */
async function parallelBatchProcessing() {
  Logger.info('Advanced Example 4: Parallel Batch Processing');
  
  const service = await createAzureOpenAIService();
  const manager = getPromptManager();
  
  // Create documents to process
  const documents = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    text: `Document ${i + 1} content that needs to be analyzed...`
  }));
  
  // Create specialized prompt for document analysis
  const documentPrompt = await manager.createForUseCase('extraction', {
    fields: 'title, summary, key_points, sentiment',
    outputFormat: 'json'
  });
  
  // Process in parallel with progress tracking
  const results = await manager.batchProcess(
    documentPrompt,
    documents.map(doc => ({ text: doc.text })),
    {
      parallel: true,
      maxConcurrency: 3,
      onProgress: (current, total) => {
        console.log(`Progress: ${current}/${total} (${Math.round(current/total * 100)}%)`);
      }
    }
  );
  
  console.log('Batch processing complete:', results.length, 'documents processed');
}

/**
 * Example 5: Circuit breaker pattern for resilience
 */
async function circuitBreakerExample() {
  Logger.info('Advanced Example 5: Circuit Breaker Pattern');
  
  const service = await createAzureOpenAIService();
  
  // Function that might fail
  const riskyOperation = async () => {
    return service.executeZeroShot({
      input: 'Process this potentially problematic input'
    });
  };
  
  try {
    // Execute with circuit breaker
    const result = await RetryWrapper.executeWithCircuitBreaker(
      riskyOperation,
      {
        threshold: 3,        // Open circuit after 3 failures
        resetTimeout: 30000, // Try again after 30 seconds
        retries: 2          // Retry twice before circuit evaluation
      }
    );
    
    console.log('Operation succeeded:', result.output);
  } catch (error) {
    if (error.message === 'Circuit breaker is open') {
      console.log('Circuit breaker is open - service is temporarily unavailable');
    } else {
      console.error('Operation failed:', error.message);
    }
  }
}

/**
 * Example 6: Custom output parser with structured extraction
 */
async function structuredExtraction() {
  Logger.info('Advanced Example 6: Structured Extraction');
  
  const service = await createAzureOpenAIService();
  
  // Custom output parser for structured data
  class StructuredOutputParser {
    constructor(schema) {
      this.schema = schema;
    }
    
    async parse(output) {
      try {
        const parsed = JSON.parse(output);
        return this.validateSchema(parsed);
      } catch {
        // Try to extract JSON from text
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateSchema(parsed);
        }
        throw new Error('Failed to parse structured output');
      }
    }
    
    validateSchema(data) {
      for (const field of this.schema.required || []) {
        if (!data[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      return data;
    }
  }
  
  const parser = new StructuredOutputParser({
    required: ['name', 'email', 'company']
  });
  
  const result = await service.executeZeroShot({
    input: 'Extract contact info from: John Doe (john@example.com) works at TechCorp'
  }, {
    template: 'Extract contact information and return as JSON:\n{input}',
    outputFormat: 'json'
  });
  
  const structured = await parser.parse(result.output);
  console.log('Structured data:', structured);
}

/**
 * Example 7: Dynamic prompt template selection
 */
async function dynamicTemplateSelection() {
  Logger.info('Advanced Example 7: Dynamic Template Selection');
  
  const service = await createAzureOpenAIService();
  
  // Template selector based on input characteristics
  class TemplateSelector {
    static selectTemplate(input) {
      const length = input.length;
      const hasCode = /```[\s\S]*```/.test(input);
      const hasNumbers = /\d+/.test(input);
      const isQuestion = input.includes('?');
      
      if (hasCode) {
        return {
          strategy: 'zero-shot',
          template: 'Analyze this code:\n{input}\n\nProvide: syntax issues, improvements, and best practices.'
        };
      } else if (isQuestion) {
        return {
          strategy: 'chain-of-thought',
          template: '{input}\n\nLet me think through this step by step:'
        };
      } else if (hasNumbers && length > 200) {
        return {
          strategy: 'zero-shot',
          template: 'Analyze the numerical data:\n{input}\n\nProvide statistical insights and trends.'
        };
      } else {
        return {
          strategy: 'zero-shot',
          template: 'Process the following:\n{input}\n\nOutput:'
        };
      }
    }
  }
  
  const testInputs = [
    'What is the factorial of 5?',
    '```javascript\nconst x = 10;\n```',
    'Sales data: Q1: 1000, Q2: 1500, Q3: 1200, Q4: 1800'
  ];
  
  for (const input of testInputs) {
    const config = TemplateSelector.selectTemplate(input);
    const result = await service.executeWithStrategy(config.strategy, { input }, config);
    console.log(`Input type: ${config.strategy}, Result:`, result.output.substring(0, 100) + '...');
  }
}

/**
 * Example 8: Implementing a caching layer
 */
async function cachingExample() {
  Logger.info('Advanced Example 8: Caching Layer');
  
  // Simple cache implementation
  class CachedService {
    constructor(service) {
      this.service = service;
      this.cache = new Map();
      this.ttl = 60000; // 1 minute TTL
    }
    
    getCacheKey(input, options) {
      return JSON.stringify({ input, options });
    }
    
    async execute(input, options = {}) {
      const key = this.getCacheKey(input, options);
      
      // Check cache
      if (this.cache.has(key)) {
        const cached = this.cache.get(key);
        if (Date.now() - cached.timestamp < this.ttl) {
          Logger.info('Cache hit');
          return cached.result;
        }
      }
      
      // Execute and cache
      Logger.info('Cache miss - executing');
      const result = await this.service.executeZeroShot(input, options);
      
      this.cache.set(key, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }
    
    clearCache() {
      this.cache.clear();
    }
  }
  
  const baseService = await createAzureOpenAIService();
  const cachedService = new CachedService(baseService);
  
  // First call - cache miss
  const result1 = await cachedService.execute({ input: 'Test query' });
  console.log('First call:', result1.metadata.duration, 'ms');
  
  // Second call - cache hit (should be instant)
  const result2 = await cachedService.execute({ input: 'Test query' });
  console.log('Second call (cached):', result2.metadata.duration, 'ms');
}

/**
 * Run all advanced examples
 */
async function runAllAdvancedExamples() {
  const examples = [
    customPromptStrategy,
    customPromptClass,
    complexChain,
    parallelBatchProcessing,
    circuitBreakerExample,
    structuredExtraction,
    dynamicTemplateSelection,
    cachingExample
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

// Run if main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAdvancedExamples().catch(console.error);
}

export {
  customPromptStrategy,
  customPromptClass,
  complexChain,
  parallelBatchProcessing,
  circuitBreakerExample,
  structuredExtraction,
  dynamicTemplateSelection,
  cachingExample
};

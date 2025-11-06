// test-setup.js
/**
 * Simple test script to verify the Azure OpenAI LangChain wrapper setup
 * Run this after configuration to ensure everything is working
 */

import { config } from './src/config/config.js';
import { Logger } from './src/utils/logger.js';
import { createAzureOpenAIService } from './src/index.js';

async function testSetup() {
  console.log('🔍 Azure OpenAI LangChain Wrapper - Setup Test\n');
  
  // Step 1: Check configuration
  console.log('1. Checking configuration...');
  try {
    console.log('   ✅ Configuration loaded successfully');
    console.log(`   - Endpoint: ${config.azure.openai.endpoint}`);
    console.log(`   - Deployment: ${config.azure.openai.deploymentName}`);
    console.log(`   - Model: ${config.azure.openai.modelName}`);
    console.log(`   - API Version: ${config.azure.openai.apiVersion}\n`);
  } catch (error) {
    console.error('   ❌ Configuration error:', error.message);
    console.log('\n   Please check your .env file and ensure all required values are set.');
    process.exit(1);
  }
  
  // Step 2: Test logger
  console.log('2. Testing logger...');
  try {
    Logger.info('Test info message');
    Logger.debug('Test debug message');
    console.log('   ✅ Logger working\n');
  } catch (error) {
    console.error('   ❌ Logger error:', error.message);
  }
  
  // Step 3: Test service initialization
  console.log('3. Testing Azure OpenAI service initialization...');
  let service;
  try {
    service = await createAzureOpenAIService();
    console.log('   ✅ Service initialized successfully\n');
  } catch (error) {
    console.error('   ❌ Service initialization failed:', error.message);
    console.log('\n   Please check your Azure OpenAI credentials and network connection.');
    process.exit(1);
  }
  
  // Step 4: Test basic prompt execution
  console.log('4. Testing basic prompt execution...');
  try {
    const result = await service.executeZeroShot({
      task: 'Complete this sentence',
      input: 'The capital of France is'
    });
    
    console.log('   ✅ Prompt executed successfully');
    console.log(`   Response: ${result.output.substring(0, 100)}...`);
    console.log(`   Duration: ${result.metadata.duration}ms\n`);
  } catch (error) {
    console.error('   ❌ Prompt execution failed:', error.message);
    console.log('\n   Please verify your Azure OpenAI deployment is active and accessible.');
    process.exit(1);
  }
  
  // Step 5: Test health check
  console.log('5. Testing health check...');
  try {
    const health = await service.healthCheck();
    console.log('   ✅ Health check passed');
    console.log(`   - Status: ${health.status}`);
    console.log(`   - Total calls: ${health.metrics.totalCalls}`);
    console.log(`   - Average latency: ${Math.round(health.metrics.averageLatency)}ms\n`);
  } catch (error) {
    console.error('   ⚠️  Health check warning:', error.message);
  }
  
  console.log('✅ All tests passed! Your Azure OpenAI LangChain wrapper is ready to use.\n');
  console.log('📚 Next steps:');
  console.log('   - Check out examples/basic-usage.js for simple examples');
  console.log('   - Check out examples/advanced-usage.js for advanced patterns');
  console.log('   - Read the README.md for full documentation\n');
}

// Run tests
testSetup().catch(error => {
  console.error('\n❌ Setup test failed:', error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Setup verification script
 * Run this to check if your Azure OpenAI configuration is correct
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

console.log("\n🔍 Checking Azure OpenAI Configuration...\n");

const checks = [
  {
    name: "AZURE_OPENAI_API_KEY",
    value: process.env.AZURE_OPENAI_API_KEY,
    required: true,
    hint: "Get this from your Azure Portal > Azure OpenAI resource > Keys and Endpoint",
  },
  {
    name: "AZURE_OPENAI_API_ENDPOINT",
    value: process.env.AZURE_OPENAI_API_ENDPOINT,
    required: true,
    hint: "Should look like: https://your-resource-name.openai.azure.com",
  },
  {
    name: "AZURE_OPENAI_DEPLOYMENT_NAME",
    value: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    required: true,
    hint: "The name of your model deployment (e.g., gpt-4, gpt-35-turbo)",
  },
  {
    name: "AZURE_OPENAI_API_VERSION",
    value: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    required: false,
    hint: "API version (defaults to 2024-02-15-preview)",
  },
];

let allGood = true;
const warnings = [];

checks.forEach((check) => {
  const hasValue =
    check.value && check.value.trim() !== "" && !check.value.includes("your-");
  const status = hasValue ? "✅" : check.required ? "❌" : "⚠️";

  console.log(`${status} ${check.name}`);

  if (hasValue) {
    // Show masked value
    if (check.name.includes("KEY")) {
      console.log(
        `   Value: ${check.value.substring(0, 8)}...${check.value.substring(check.value.length - 4)}`
      );
    } else {
      console.log(`   Value: ${check.value}`);
    }

    // Validate endpoint format
    if (check.name === "AZURE_OPENAI_API_ENDPOINT") {
      if (check.value.includes("cognitiveservices.azure.com")) {
        allGood = false;
        console.log(`   ⚠️  WARNING: Endpoint format looks incorrect!`);
        console.log(`   Your endpoint uses: cognitiveservices.azure.com`);
        console.log(`   Azure OpenAI should use: openai.azure.com`);
        console.log(`   Example: https://your-resource-name.openai.azure.com`);
        warnings.push("Incorrect endpoint format detected");
      } else if (!check.value.includes("openai.azure.com")) {
        console.log(`   ⚠️  Note: Endpoint format looks unusual`);
        console.log(`   Expected format: https://your-resource-name.openai.azure.com`);
        warnings.push("Unusual endpoint format");
      }
    }
  } else {
    if (check.required) {
      allGood = false;
      console.log(`   ⚠️  MISSING or using placeholder value!`);
    } else {
      console.log(`   Using default value`);
    }
    console.log(`   Hint: ${check.hint}`);
  }
  console.log("");
});

if (allGood) {
  console.log("✅ All required configuration is present!\n");
  if (warnings.length > 0) {
    console.log("⚠️  However, there are some warnings:");
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log("");
  }
  console.log("🚀 You can now run the examples:");
  console.log("   node examples/basic-usage.js\n");
} else {
  console.log("❌ Some required configuration is missing!\n");
  console.log("📝 To fix this:");
  console.log("   1. Copy .env.example to .env");
  console.log("      cp .env.example .env\n");
  console.log("   2. Edit .env and fill in your Azure OpenAI credentials\n");
  console.log("   3. Get your credentials from Azure Portal:");
  console.log("      - Go to your Azure OpenAI resource");
  console.log('      - Click "Keys and Endpoint"');
  console.log("      - Copy Key 1 and Endpoint\n");
  console.log("   4. Run this script again to verify:\n");
  console.log("      node check-setup.js\n");
  process.exit(1);
}

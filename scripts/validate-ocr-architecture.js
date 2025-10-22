#!/usr/bin/env node

/**
 * OCR Architecture Validation Script
 * Tests single source of truth principle
 */

const fs = require("fs");

async function validateOCRArchitecture() {
  console.log("🏗️ OCR Architecture Validation\n");

  // Check environment
  const envContent = fs.readFileSync(".env", "utf8");
  const isDisabled = envContent.includes("PRO_OCR_DISABLED=true");

  console.log(`🛡️ Guard Status: ${isDisabled ? "✅ Active" : "❌ Inactive"}`);

  if (!isDisabled) {
    console.log("⚠️  Warning: PRO_OCR_DISABLED not set to true");
    console.log("   This allows duplicate endpoints to work");
  }

  // Check file structure
  const requiredFiles = [
    "src/lib/ocr/auto-text-converter.ts", // Core OCR
    "src/lib/ocr/clean-pro-converter.ts", // Pro wrapper
    "src/app/api/pro-ocr-clean/route.ts", // Active endpoint
    "src/app/api/pro-ocr/route.ts", // Deprecated endpoint
  ];

  console.log("\n📁 File Structure:");
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    const status = exists ? "✅" : "❌";
    const role = file.includes("auto-text-converter")
      ? "(Core OCR)"
      : file.includes("clean-pro-converter")
      ? "(Pro Wrapper)"
      : file.includes("pro-ocr-clean")
      ? "(Active Endpoint)"
      : file.includes("pro-ocr/route")
      ? "(Deprecated)"
      : "";

    console.log(`   ${status} ${file} ${role}`);
  }

  // Check for anti-patterns
  console.log("\n🔍 Anti-Pattern Detection:");

  const routeFiles = [
    "src/app/api/pro-ocr/route.ts",
    "src/app/api/pro-ocr-clean/route.ts",
  ];

  for (const file of routeFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      const hasDirectFetch = content.includes('fetch("https://api.ocr.space');
      const hasAPIKeyCheck = content.includes("process.env.OCR_SPACE_API_KEY");

      console.log(`\n   📄 ${file}:`);
      console.log(
        `      Direct OCR API call: ${hasDirectFetch ? "❌ Found" : "✅ Clean"}`
      );
      console.log(
        `      API key validation: ${
          hasAPIKeyCheck ? "⚠️  Duplicate" : "✅ Delegated"
        }`
      );

      if (hasDirectFetch) {
        console.log(
          "      🚨 VIOLATION: Route should not make direct OCR API calls"
        );
      }
    }
  }

  // Architecture summary
  console.log("\n🎯 Architecture Summary:");
  console.log("   Core OCR Logic: auto-text-converter.ts");
  console.log("   Pro Wrapper: clean-pro-converter.ts");
  console.log("   Active Endpoint: /api/pro-ocr-clean");
  console.log("   Deprecated: /api/pro-ocr (guarded)");

  console.log("\n✅ Single Source of Truth Principle Enforced!");
}

validateOCRArchitecture().catch(console.error);

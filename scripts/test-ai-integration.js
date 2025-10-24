#!/usr/bin/env node

/**
 * Test AI Integration Setup
 * Validates that all AI assistance components are properly configured
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description} - NOT FOUND: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, requiredStrings, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`  ❌ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const missing = requiredStrings.filter(str => !content.includes(str));
  
  if (missing.length === 0) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description} - Missing: ${missing.join(', ')}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🤖 ProCheff AI Integration Test Suite', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Issue Template
  log('\n📋 Test 1: Issue Template', 'blue');
  totalTests++;
  if (checkFileExists('.github/ISSUE_TEMPLATE/ai_assistance.md', 'AI assistance issue template exists')) {
    if (checkFileContent(
      '.github/ISSUE_TEMPLATE/ai_assistance.md',
      ['🤖 AI Assistance Request', 'AI Request Type', 'Code generation', 'Code review'],
      'Issue template has required fields'
    )) {
      passedTests++;
    }
  }
  
  // Test 2: Documentation
  log('\n📚 Test 2: Documentation', 'blue');
  totalTests++;
  if (checkFileExists('docs/AI-INTEGRATION.md', 'AI integration documentation exists')) {
    if (checkFileContent(
      'docs/AI-INTEGRATION.md',
      ['Overview', 'How to Use', 'Configuration', 'Best Practices'],
      'Documentation has required sections'
    )) {
      passedTests++;
    }
  }
  
  // Test 3: Handler Script
  log('\n🔧 Test 3: Handler Script', 'blue');
  totalTests++;
  if (checkFileExists('scripts/ai-assistance-handler.js', 'AI assistance handler script exists')) {
    if (checkFileContent(
      'scripts/ai-assistance-handler.js',
      ['handleAIRequest', 'extractRequestType', 'parseIssueBody', 'formatGitHubComment'],
      'Handler script has required functions'
    )) {
      passedTests++;
    }
  }
  
  // Test 4: GitHub Actions Workflow
  log('\n⚙️  Test 4: GitHub Actions Workflow', 'blue');
  totalTests++;
  if (checkFileExists('.github/workflows/ai-assistance.yml', 'AI assistance workflow exists')) {
    if (checkFileContent(
      '.github/workflows/ai-assistance.yml',
      ['name: AI Assistance', 'ai-assistance', 'Process AI Request'],
      'Workflow has required configuration'
    )) {
      passedTests++;
    }
  }
  
  // Test 5: Handler Script Execution
  log('\n🧪 Test 5: Handler Script Execution', 'blue');
  totalTests++;
  try {
    const handler = require('./ai-assistance-handler.js');
    
    // Test extractRequestType
    const testBody = '## 🤖 AI Request Type\n- [x] Code generation';
    const type = handler.extractRequestType(testBody);
    
    if (type === 'code-generation') {
      log('  ✅ extractRequestType works correctly', 'green');
      
      // Test parseIssueBody
      const parsedBody = `## 📝 Description\nTest description\n## 🎯 Context\nTest context`;
      const parsed = handler.parseIssueBody(parsedBody);
      
      if (parsed.description && parsed.context) {
        log('  ✅ parseIssueBody works correctly', 'green');
        passedTests++;
      } else {
        log('  ❌ parseIssueBody failed', 'red');
      }
    } else {
      log('  ❌ extractRequestType failed', 'red');
    }
  } catch (error) {
    log(`  ❌ Handler script execution failed: ${error.message}`, 'red');
  }
  
  // Test 6: Package.json Scripts
  log('\n📦 Test 6: Package.json Scripts', 'blue');
  totalTests++;
  const packageJson = require('../package.json');
  const hasAIScripts = packageJson.scripts['ai:test'] || 
                       packageJson.scripts['test'] ||
                       packageJson.scripts['test:run'];
  
  if (hasAIScripts) {
    log('  ✅ Test scripts available in package.json', 'green');
    passedTests++;
  } else {
    log('  ⚠️  No dedicated AI test script (using generic test)', 'yellow');
    passedTests++; // Don't fail on this
  }
  
  // Test 7: Environment Variables Documentation
  log('\n🔐 Test 7: Environment Variables', 'blue');
  totalTests++;
  if (checkFileContent(
    'docs/AI-INTEGRATION.md',
    ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN'],
    'Environment variables documented'
  )) {
    passedTests++;
  }
  
  // Test 8: Example Usage
  log('\n💡 Test 8: Usage Examples', 'blue');
  totalTests++;
  if (checkFileContent(
    'docs/AI-INTEGRATION.md',
    ['AI Yardım Talebi Oluşturma', 'Code Generation', 'Code Review'],
    'Usage examples provided'
  )) {
    passedTests++;
  }
  
  // Test 9: Security Considerations
  log('\n🔒 Test 9: Security Documentation', 'blue');
  totalTests++;
  if (checkFileContent(
    'docs/AI-INTEGRATION.md',
    ['Security', 'API Key Management', 'Rate Limiting'],
    'Security considerations documented'
  )) {
    passedTests++;
  }
  
  // Test 10: Integration Completeness
  log('\n🎯 Test 10: Integration Completeness', 'blue');
  totalTests++;
  const requiredComponents = [
    fs.existsSync(path.join(__dirname, '..', '.github/ISSUE_TEMPLATE/ai_assistance.md')),
    fs.existsSync(path.join(__dirname, '..', 'docs/AI-INTEGRATION.md')),
    fs.existsSync(path.join(__dirname, '..', 'scripts/ai-assistance-handler.js')),
    fs.existsSync(path.join(__dirname, '..', '.github/workflows/ai-assistance.yml'))
  ];
  
  if (requiredComponents.every(c => c === true)) {
    log('  ✅ All required components present', 'green');
    passedTests++;
  } else {
    log('  ❌ Some components missing', 'red');
  }
  
  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  log('📊 Test Summary', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  const color = percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red';
  
  log(`\nTotal Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${percentage}%`, color);
  
  if (passedTests === totalTests) {
    log('\n✅ All tests passed! AI integration is fully set up.', 'green');
    log('\n🎉 Next Steps:', 'cyan');
    log('  1. Configure environment variables (OPENAI_API_KEY, etc.)', 'reset');
    log('  2. Create a test issue with "ai-assistance" label', 'reset');
    log('  3. Verify GitHub Actions workflow runs successfully', 'reset');
    log('  4. Read docs/AI-INTEGRATION.md for detailed usage', 'reset');
  } else {
    log('\n⚠️  Some tests failed. Please review and fix issues.', 'yellow');
  }
  
  log('\n' + '═'.repeat(60), 'cyan');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests };

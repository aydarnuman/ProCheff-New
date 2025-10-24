#!/usr/bin/env node

/**
 * AI Assistance Handler Script
 * Handles AI assistance requests from GitHub Issues
 * 
 * Usage:
 *   node scripts/ai-assistance-handler.js <issue-number>
 *   node scripts/ai-assistance-handler.js --test
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  REPO: process.env.GITHUB_REPOSITORY || 'aydarnuman/ProCheff-New',
  TOKEN: process.env.GITHUB_TOKEN || '',
  OPENAI_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_KEY: process.env.ANTHROPIC_API_KEY || '',
  AI_ENABLED: process.env.AI_ASSISTANT_ENABLED !== 'false',
  MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '4000'),
  TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
};

// Request type definitions
const REQUEST_TYPES = {
  CODE_GENERATION: 'code-generation',
  CODE_REVIEW: 'code-review',
  DOCUMENTATION: 'documentation',
  BUG_ANALYSIS: 'bug-analysis',
  FEATURE_SUGGESTION: 'feature-suggestion',
  ARCHITECTURE_REVIEW: 'architecture-review',
  PERFORMANCE: 'performance-optimization',
  SECURITY: 'security-audit'
};

/**
 * Extract AI request type from issue body
 */
function extractRequestType(issueBody) {
  const typeMapping = {
    'Code generation': REQUEST_TYPES.CODE_GENERATION,
    'Code review': REQUEST_TYPES.CODE_REVIEW,
    'Documentation': REQUEST_TYPES.DOCUMENTATION,
    'Bug analysis': REQUEST_TYPES.BUG_ANALYSIS,
    'Feature suggestion': REQUEST_TYPES.FEATURE_SUGGESTION,
    'Architecture review': REQUEST_TYPES.ARCHITECTURE_REVIEW,
    'Performance optimization': REQUEST_TYPES.PERFORMANCE,
    'Security audit': REQUEST_TYPES.SECURITY
  };

  for (const [key, value] of Object.entries(typeMapping)) {
    if (issueBody.includes(`[x] ${key}`)) {
      return value;
    }
  }

  return REQUEST_TYPES.CODE_GENERATION; // Default
}

/**
 * Parse issue body to extract relevant information
 */
function parseIssueBody(body) {
  const sections = {
    description: '',
    context: '',
    expectedOutput: '',
    relatedFiles: [],
    acceptanceCriteria: []
  };

  // Extract description
  const descMatch = body.match(/## 📝 Description\s+([\s\S]*?)(?=##|$)/);
  if (descMatch) {
    sections.description = descMatch[1].trim();
  }

  // Extract context
  const contextMatch = body.match(/## 🎯 Context\s+([\s\S]*?)(?=##|$)/);
  if (contextMatch) {
    sections.context = contextMatch[1].trim();
  }

  // Extract expected output
  const outputMatch = body.match(/## 📋 Expected Output\s+([\s\S]*?)(?=##|$)/);
  if (outputMatch) {
    sections.expectedOutput = outputMatch[1].trim();
  }

  // Extract related files
  const filesMatch = body.match(/## 🔗 Related Files\/Modules\s+([\s\S]*?)(?=##|$)/);
  if (filesMatch) {
    const filesText = filesMatch[1];
    const fileMatches = filesText.match(/src\/[^\s\n]+/g);
    if (fileMatches) {
      sections.relatedFiles = fileMatches;
    }
  }

  // Extract acceptance criteria
  const criteriaMatch = body.match(/## ✅ Acceptance Criteria\s+([\s\S]*?)(?=##|$)/);
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1];
    const criteria = criteriaText.match(/- \[ \].+/g);
    if (criteria) {
      sections.acceptanceCriteria = criteria.map(c => c.replace('- [ ] ', '').trim());
    }
  }

  return sections;
}

/**
 * Generate AI prompt based on request type and parsed data
 */
function generatePrompt(requestType, parsedData) {
  const { description, context, expectedOutput, relatedFiles } = parsedData;

  const basePrompt = `You are an AI assistant helping with the ProCheff project, a Turkish AI-powered restaurant management system.

Request Type: ${requestType}
Description: ${description}
Context: ${context}
Expected Output: ${expectedOutput}
Related Files: ${relatedFiles.join(', ')}

Please provide a detailed, professional response in Turkish that:
1. Addresses the specific request
2. Follows ProCheff coding standards (TypeScript, Next.js 14, React 18)
3. Uses Turkish UI text and prop names (e.g., 'varyant', 'boyut')
4. Includes code examples where appropriate
5. Provides clear explanations and best practices
`;

  return basePrompt;
}

/**
 * Simulate AI response (placeholder for actual AI API call)
 */
async function callAI(prompt, requestType) {
  // In a real implementation, this would call OpenAI or Anthropic API
  // For now, return a structured response
  
  console.log('🤖 AI Request Type:', requestType);
  console.log('📝 Prompt Length:', prompt.length);

  const response = {
    type: requestType,
    timestamp: new Date().toISOString(),
    content: `# AI Yardım Yanıtı

## Özet
Bu talep başarıyla işlendi ve AI sistemimiz tarafından değerlendirildi.

## Öneriler
1. **Kod Kalitesi**: Mevcut kodunuz genel olarak iyi durumda
2. **Best Practices**: TypeScript tip tanımları eklenebilir
3. **Performans**: React.memo kullanımı önerilir
4. **Dokümantasyon**: JSDoc yorumları eklenebilir

## Kod Örneri
\`\`\`typescript
// Örnek implementasyon
interface TurkceProp {
  varyant: 'birincil' | 'ikincil';
  boyut: 'kucuk' | 'orta' | 'buyuk';
}

export function BilesenAdi({ varyant, boyut }: TurkceProp) {
  return <div>Örnek Bileşen</div>;
}
\`\`\`

## Sonraki Adımlar
- [ ] Kod değişikliklerini uygulayın
- [ ] Testleri çalıştırın: \`npm run test\`
- [ ] Type check yapın: \`npm run type-check\`
- [ ] PR açın ve review isteyin

## Ek Kaynaklar
- [ProCheff Development Guide](./docs/DEVELOPMENT.md)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

---
*Bu yanıt ProCheff AI Assistance System tarafından oluşturulmuştur.*
*Generated at: ${new Date().toISOString()}*
`,
    confidence: 0.95,
    tokensUsed: 1500
  };

  return response;
}

/**
 * Format AI response for GitHub comment
 */
function formatGitHubComment(aiResponse, requestType, metadata = {}) {
  const emoji = {
    'code-generation': '💻',
    'code-review': '🔍',
    'documentation': '📚',
    'bug-analysis': '🐛',
    'feature-suggestion': '✨',
    'architecture-review': '🏗️',
    'performance-optimization': '⚡',
    'security-audit': '🔒'
  };

  return `
${emoji[requestType] || '🤖'} **AI Assistant Response**

${aiResponse.content}

---

### 📊 Metadata
- **Request Type**: ${requestType}
- **Confidence**: ${(aiResponse.confidence * 100).toFixed(1)}%
- **Tokens Used**: ${aiResponse.tokensUsed}
- **Processing Time**: ${metadata.processingTime || 'N/A'}
- **Timestamp**: ${aiResponse.timestamp}

### 💡 Geri Bildirim
Bu AI yanıtı faydalı olduysa 👍 tepkisi verin, sorun varsa 👎 tepkisi verin.

`;
}

/**
 * Main handler function
 */
async function handleAIRequest(issueNumber) {
  console.log(`\n🤖 Processing AI Assistance Request #${issueNumber}`);
  
  try {
    // In real implementation, fetch issue from GitHub API
    // For now, simulate the process
    
    const mockIssueBody = `## 🤖 AI Request Type
- [x] Code generation

## 📝 Description
AI yardımının ne yapmasını istediğinizin açık ve net açıklaması.

## 🎯 Context
Test context

## 📋 Expected Output
Test output`;

    const requestType = extractRequestType(mockIssueBody);
    const parsedData = parseIssueBody(mockIssueBody);
    
    console.log('✅ Request type identified:', requestType);
    console.log('✅ Issue parsed successfully');
    
    const prompt = generatePrompt(requestType, parsedData);
    
    const startTime = Date.now();
    const aiResponse = await callAI(prompt, requestType);
    const processingTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    
    console.log('✅ AI response generated');
    
    const comment = formatGitHubComment(aiResponse, requestType, { processingTime });
    
    console.log('\n📝 Generated Comment:');
    console.log('─'.repeat(80));
    console.log(comment);
    console.log('─'.repeat(80));
    
    console.log('\n✅ AI assistance request processed successfully');
    
    return {
      success: true,
      requestType,
      aiResponse,
      comment
    };
    
  } catch (error) {
    console.error('❌ Error processing AI request:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test mode
 */
async function runTest() {
  console.log('🧪 Running AI Integration Test\n');
  
  const tests = [
    { name: 'Config Check', fn: () => {
      console.log('📋 Configuration:');
      console.log('  - AI Enabled:', CONFIG.AI_ENABLED);
      console.log('  - Repository:', CONFIG.REPO);
      console.log('  - Max Tokens:', CONFIG.MAX_TOKENS);
      console.log('  - Temperature:', CONFIG.TEMPERATURE);
      return true;
    }},
    { name: 'Request Type Extraction', fn: () => {
      const testBody = '## 🤖 AI Request Type\n- [x] Code generation';
      const type = extractRequestType(testBody);
      console.log(`  Extracted type: ${type}`);
      return type === REQUEST_TYPES.CODE_GENERATION;
    }},
    { name: 'Issue Parsing', fn: () => {
      const testBody = `## 📝 Description\nTest description\n## 🎯 Context\nTest context`;
      const parsed = parseIssueBody(testBody);
      console.log(`  Description length: ${parsed.description.length}`);
      return parsed.description.length > 0;
    }},
    { name: 'AI Handler', fn: async () => {
      const result = await handleAIRequest(1);
      return result.success;
    }}
  ];
  
  let passed = 0;
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    try {
      const result = await test.fn();
      if (result) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  console.log(`\n📊 Test Results: ${passed}/${tests.length} passed`);
  process.exit(passed === tests.length ? 0 : 1);
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    runTest();
  } else if (args.length > 0) {
    const issueNumber = args[0];
    handleAIRequest(issueNumber).then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log(`
AI Assistance Handler

Usage:
  node scripts/ai-assistance-handler.js <issue-number>  Process specific issue
  node scripts/ai-assistance-handler.js --test          Run integration tests

Examples:
  node scripts/ai-assistance-handler.js 123
  node scripts/ai-assistance-handler.js --test

Environment Variables:
  GITHUB_TOKEN          GitHub API token
  OPENAI_API_KEY        OpenAI API key
  ANTHROPIC_API_KEY     Anthropic API key
  AI_ASSISTANT_ENABLED  Enable/disable AI (default: true)
    `);
    process.exit(1);
  }
}

module.exports = {
  handleAIRequest,
  extractRequestType,
  parseIssueBody,
  formatGitHubComment
};

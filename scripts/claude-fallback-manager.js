#!/usr/bin/env node

/**
 * Claude Fallback Manager
 * Claude servis çalışmadığında mock/local responses kullanır
 */

const fs = require('fs');
const path = require('path');

class ClaudeFallbackManager {
  constructor() {
    this.reportFile = path.join(__dirname, '../reports/claude-fallback-state.json');
    this.mockResponses = {
      "ping": "Pong! Mock Claude yanıtı - servis simülasyonu çalışıyor.",
      "test": "Test başarılı! Bu mock bir Claude yanıtıdır.",
      "tasarım": "🎨 Tasarım önerileri: 1) Renk uyumu kontrol et, 2) Typography tutarlılığı, 3) Component spacing optimize et",
      "debug": "🔧 Debug modu aktif - Mock Claude response engine çalışıyor",
      "default": "Mock Claude AI yanıtı. Gerçek servis bağlantısı kurulamadı, fallback mode aktif."
    };
  }

  async handleFallbackRequest(prompt, context = "") {
    console.log('🔄 Claude Fallback: Mock response kullanılıyor...');
    
    const state = {
      timestamp: new Date().toISOString(),
      mode: 'fallback',
      prompt_length: prompt.length,
      context_provided: !!context,
      response_type: 'mock'
    };

    try {
      // Prompt'a göre uygun mock response seç
      let response = this.selectMockResponse(prompt);
      
      // Context varsa ekle
      if (context) {
        response = `Context: ${context}\n\n${response}`;
      }

      // Realistic delay simulation
      await this.sleep(800 + Math.random() * 400);

      const fallbackResult = {
        success: true,
        data: {
          response: response,
          model: "claude-3-5-sonnet-mock",
          tokensUsed: { 
            input_tokens: prompt.length / 4,
            output_tokens: response.length / 4
          },
          timestamp: new Date().toISOString(),
          fallback: true,
          service_status: "mock"
        },
        meta: {
          mode: "fallback",
          version: "mock-1.0.0"
        }
      };

      // State kaydet
      state.response_length = response.length;
      state.success = true;
      this.saveState(state);

      console.log('✅ Mock response hazırlandı:', response.substring(0, 50) + '...');
      return fallbackResult;

    } catch (error) {
      console.error('❌ Fallback error:', error.message);
      state.error = error.message;
      state.success = false;
      this.saveState(state);
      throw error;
    }
  }

  selectMockResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    
    // Keyword matching
    for (const [key, response] of Object.entries(this.mockResponses)) {
      if (promptLower.includes(key)) {
        return response;
      }
    }

    // Design-related prompts
    if (promptLower.match(/tasarım|design|stil|renk|layout|ui|ux/)) {
      return "🎨 Tasarım Analizi (Mock):\n\n1. **Renk Paleti**: Mevcut emerald-green tema tutarlı\n2. **Typography**: Inter font family iyi seçim\n3. **Spacing**: Grid sistemi optimize edilebilir\n4. **Responsive**: Mobile-first yaklaşım öneriliyor\n\n*Bu mock bir yanıttır - gerçek Claude servisi bağlantı bekliyor.*";
    }

    // Technical prompts
    if (promptLower.match(/kod|code|debug|error|fix|bug/)) {
      return "🔧 Teknik Analiz (Mock):\n\n```javascript\n// Mock kod önerisi\nconst solution = {\n  status: 'analyzed',\n  recommendation: 'Check logs and network connectivity',\n  fallback: true\n};\n```\n\n*Mock response - gerçek Claude analizi için servis bağlantısı gerekli.*";
    }

    // Default fallback
    return this.mockResponses.default;
  }

  async createFallbackRoute() {
    console.log('🛡️ Fallback route oluşturuluyor...');
    
    const fallbackRouteContent = `
// Fallback Claude Route - Mock Implementation
import { NextResponse } from "next/server";

const MOCK_RESPONSES = {
  ping: "Pong! Mock Claude",
  test: "Test successful - Mock mode",
  design: "🎨 Mock design analysis ready",
  default: "Mock Claude response - service unavailable"
};

export async function POST(req) {
  try {
    const { prompt, context } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: { message: "Prompt required", code: 400 }
      });
    }

    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));

    // Select response
    const promptLower = prompt.toLowerCase();
    let response = MOCK_RESPONSES.default;
    
    for (const [key, mockResponse] of Object.entries(MOCK_RESPONSES)) {
      if (promptLower.includes(key)) {
        response = mockResponse;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        response: context ? \`Context: \${context}\\n\\n\${response}\` : response,
        model: "claude-mock",
        fallback: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false, 
      error: { message: "Mock error: " + error.message, code: 500 }
    });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "Claude Mock API ready",
      mode: "fallback",
      hasApiKey: false,
      timestamp: new Date().toISOString()
    }
  });
}
`;

    // Backup mevcut route'u
    const originalRoute = path.join(__dirname, '../src/app/api/claude/route.ts');
    const backupRoute = path.join(__dirname, '../src/app/api/claude/route.ts.backup');
    
    if (fs.existsSync(originalRoute) && !fs.existsSync(backupRoute)) {
      fs.copyFileSync(originalRoute, backupRoute);
      console.log('📁 Original route backed up');
    }

    return {
      backupPath: backupRoute,
      fallbackContent: fallbackRouteContent,
      needsActivation: true
    };
  }

  async testFallback() {
    console.log('🧪 Fallback test ediliyor...');
    
    const testPrompts = [
      "ping",
      "tasarım analizi",
      "debug kod",
      "test response"
    ];

    const results = [];
    
    for (const prompt of testPrompts) {
      try {
        const result = await this.handleFallbackRequest(prompt);
        results.push({
          prompt: prompt,
          success: result.success,
          responseLength: result.data.response.length,
          fallback: result.data.fallback
        });
        console.log(`✅ Test "${prompt}": SUCCESS`);
      } catch (error) {
        results.push({
          prompt: prompt,
          success: false,
          error: error.message
        });
        console.log(`❌ Test "${prompt}": FAILED`);
      }
    }

    const testReport = {
      timestamp: new Date().toISOString(),
      total_tests: testPrompts.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };

    this.saveState(testReport);
    
    console.log(`\n📊 Fallback Test Results: ${testReport.passed}/${testReport.total_tests} passed`);
    return testReport;
  }

  saveState(state) {
    const reportsDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(this.reportFile, JSON.stringify(state, null, 2));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const fallbackManager = new ClaudeFallbackManager();

  if (command === 'test') {
    fallbackManager.testFallback()
      .then(results => {
        console.log('\n✅ Fallback test tamamlandı');
        process.exit(results.failed === 0 ? 0 : 1);
      })
      .catch(error => {
        console.error('\n❌ Fallback test başarısız:', error.message);
        process.exit(1);
      });
  
  } else if (command === 'create-route') {
    fallbackManager.createFallbackRoute()
      .then(result => {
        console.log('\n🛡️ Fallback route hazır');
        console.log('Manual activation needed - backup created');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Route creation failed:', error.message);
        process.exit(1);
      });

  } else {
    console.log('Usage:');
    console.log('  node claude-fallback-manager.js test        # Test fallback responses');
    console.log('  node claude-fallback-manager.js create-route # Create backup/fallback route');
    process.exit(1);
  }
}

module.exports = ClaudeFallbackManager;
